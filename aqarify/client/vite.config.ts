import { createRequire } from "node:module";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Workspace-safe path — Vite sometimes fails to resolve `maplibre-gl/dist/*.css` when hoisted. */
function maplibreGlCssPath(): string {
  const pkg = require.resolve("maplibre-gl/package.json", { paths: [__dirname] });
  return path.join(path.dirname(pkg), "dist", "maplibre-gl.css");
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "maplibre-gl/dist/maplibre-gl.css": maplibreGlCssPath(),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
