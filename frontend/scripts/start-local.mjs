import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadEnv } from "vite";

const frontend = fileURLToPath(new URL("../", import.meta.url));
const backend = path.resolve(frontend, "../backend");
const settings = loadEnv("development", frontend, "");
const teamSettings = loadEnv(
  "development",
  path.dirname(frontend),
  "API_METRIC",
);
const target = new URL(
  settings.BACKEND_PROXY_TARGET || "http://127.0.0.1:3000",
);
const children = new Set();
let stopping = false;

function launch(command, args, options) {
  const child = spawn(command, args, {
    stdio: "inherit",
    windowsHide: true,
    ...options,
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

async function isBackendReady() {
  try {
    const response = await fetch(new URL("/health", target), {
      signal: AbortSignal.timeout(1500),
    });
    const data = await response.json();
    return response.ok && data.status === "ok";
  } catch {
    return false;
  }
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

for (const event of ["SIGINT", "SIGTERM"]) process.on(event, () => stop());
process.on("exit", () => {
  for (const child of children) child.kill();
});

async function start() {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if (
    local &&
    target.protocol === "http:" &&
    settings.AUTO_START_BACKEND !== "false" &&
    !(await isBackendReady())
  ) {
    if (!existsSync(path.join(backend, "package.json")))
      throw new Error(
        "Backend da equipe não encontrado. Configure BACKEND_PROXY_TARGET em frontend/.env.local.",
      );
    if (!existsSync(path.join(backend, "node_modules/tsx/package.json"))) {
      console.log("Preparando as dependências do backend existente...");
      const npmCli = process.env.npm_execpath;
      if (!npmCli) throw new Error("Execute este comando por npm run dev.");
      const install = launch(process.execPath, [npmCli, "ci"], {
        cwd: backend,
      });
      await new Promise((resolve, reject) => {
        install.on("error", reject);
        install.on("exit", (code) =>
          code === 0
            ? resolve()
            : reject(
                new Error(
                  "Não foi possível instalar as dependências do backend.",
                ),
              ),
        );
      });
    }
    console.log("Iniciando o backend da equipe para descoberta de serviços...");
    const server = launch(
      process.execPath,
      ["--import", "tsx", "src/server.ts"],
      {
        cwd: backend,
        env: {
          ...process.env,
          PORT: target.port || "80",
          API_METRIC:
            settings.API_METRIC ||
            teamSettings.API_METRIC ||
            "https://metrics.unilaunch.org",
        },
      },
    );
    server.on("error", (error) => {
      console.error(error.message);
      stop(1);
    });
    server.on("exit", (code) => {
      if (!stopping) {
        console.error("O backend foi encerrado.");
        stop(code || 1);
      }
    });
    const deadline = Date.now() + 15000;
    while (!(await isBackendReady())) {
      if (stopping || Date.now() >= deadline)
        throw new Error(
          "O backend não respondeu. Confira a porta definida em BACKEND_PROXY_TARGET.",
        );
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const discoveryDeadline = Date.now() + 12000;
    while (!stopping && Date.now() < discoveryDeadline) {
      try {
        const response = await fetch(new URL("/services", target), {
          signal: AbortSignal.timeout(1500),
        });
        const data = await response.json();
        if (response.ok && typeof data.lastUpdatedAt === "string") break;
      } catch {
        /* The frontend reports an unavailable discovery if startup cannot complete. */
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (stopping) return;
  const vite = launch(
    process.execPath,
    [
      path.join(frontend, "node_modules/vite/bin/vite.js"),
      "--host",
      "0.0.0.0",
      ...process.argv.slice(2),
    ],
    { cwd: frontend },
  );
  vite.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  vite.on("exit", (code) => stop(code || 0));
}

start().catch((error) => {
  console.error(error.message);
  stop(1);
});
