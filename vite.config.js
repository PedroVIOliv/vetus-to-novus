import { defineConfig } from "vite";

export default defineConfig({
  build: { rollupOptions: { input: { main: "index.html", sources: "sources.html" } } },
  test: { environment: "jsdom" },
});
