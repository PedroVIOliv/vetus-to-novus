import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths, so the build works when served from a subpath (GitHub Pages).
  base: "./",
  build: { rollupOptions: { input: { main: "index.html", sources: "sources.html" } } },
  test: { environment: "jsdom" },
});
