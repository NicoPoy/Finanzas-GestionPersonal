import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.API_PROXY_TARGET || env.VITE_API_PROXY_TARGET || "https://finanzas-gestion.vercel.app";

  return {
    plugins: [react()],
    root: "frontend",
    envDir: process.cwd(),
    publicDir: "public",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api": {
          changeOrigin: true,
          secure: false,
          target: apiProxyTarget,
          timeout: 30_000,
          proxyTimeout: 30_000,
          configure(proxy) {
            proxy.on("error", (error) => {
              console.error(`[vite proxy] ${apiProxyTarget}: ${error.message}`);
            });
          },
        },
      },
    },
  };
});
