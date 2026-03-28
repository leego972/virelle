import { defineConfig } from "vite";

export default defineConfig({
  // The desktop app loads the production web app directly (virellestudios.com)
  // so there's no separate renderer bundle needed.
  // This vite config is kept for potential future local renderer development.
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
});
