import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  base: "./",
  css: {
    postcss: path.resolve(__dirname, "postcss.config.mjs")
  },
  build: {
    outDir: path.resolve(__dirname, "../media/webview"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html")
    }
  }
});
