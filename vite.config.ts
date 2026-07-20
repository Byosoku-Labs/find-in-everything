import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode !== "store",
    rollupOptions: {
      input: {
        background: resolve(rootDir, "src/background/background.ts"),
        popup: resolve(rootDir, "src/popup/popup.html"),
        sidepanel: resolve(rootDir, "src/sidepanel/sidepanel.html"),
        options: resolve(rootDir, "src/options/options.html")
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") {
            return "background.js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  },
  publicDir: "public",
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
}));
