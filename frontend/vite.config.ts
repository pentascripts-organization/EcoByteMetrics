import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'BACKEND_');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/backend': { target: env.BACKEND_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true, rewrite: (url) => url.replace(/^\/backend/, '') } },
    },
    preview: { port: 4173 },
  };
});
