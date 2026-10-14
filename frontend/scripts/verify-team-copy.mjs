import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const origin = JSON.parse(
  fs.readFileSync(
    new URL("../docs/backend-origin.json", import.meta.url),
    "utf8",
  ),
);
const authorized = JSON.parse(
  fs.readFileSync(
    new URL("../docs/backend-authorized-changes.json", import.meta.url),
    "utf8",
  ),
);
for (const file of origin.files) {
  const bytes = fs.readFileSync(new URL(file.path, root));
  const hash = crypto
    .createHash("sha1")
    .update(Buffer.from("blob " + bytes.length + "\0"))
    .update(bytes)
    .digest("hex");
  const expected =
    authorized.files.find((entry) => entry.path === file.path)?.sha ?? file.sha;
  if (hash !== expected)
    throw new Error(
      "Arquivo do time alterado: " + fileURLToPath(new URL(file.path, root)),
    );
}
console.log(
  origin.files.length -
    authorized.files.length +
    " arquivos do time preservados; " +
    authorized.files.length +
    " arquivos com alterações autorizadas para #52; referência " +
    origin.commit +
    ".",
);
