import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "BACKEND_");
  const proxy = {
    "/backend": {
      target: env.BACKEND_PROXY_TARGET || "http://127.0.0.1:3000",
      changeOrigin: true,
      rewrite: (url: string) => url.replace(/^\/backend/, ""),
    },
  };
  return {
    plugins: [react()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "globe-vendor",
                test: /node_modules[\\/](?:react-globe\.gl|globe\.gl|three|three-globe|three-render-objects|three-geojson-geometry|three-conic-polygon-geometry|d3-geo)[\\/]/,
                priority: 20,
                entriesAware: true,
                maxSize: 400_000,
              },
            ],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: { port: 4173, proxy },
  };
});
