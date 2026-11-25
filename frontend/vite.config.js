import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const backendDirectory = resolve(import.meta.dirname, "../backend");
  const { PORT = "3001" } = loadEnv(mode, backendDirectory, "PORT");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": `http://127.0.0.1:${PORT}`,
      },
    },
  };
});