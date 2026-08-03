import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config: dev server on 5173, proxies /api/* to the Express backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787"
    }
  },
  build: {
    outDir: "dist"
  }
});
