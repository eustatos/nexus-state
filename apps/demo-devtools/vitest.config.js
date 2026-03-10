import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@nexus-state/core": path.resolve(
        __dirname,
        "../../packages/core/dist/index.js"
      ),
      "@nexus-state/react": path.resolve(
        __dirname,
        "../../packages/react/dist/index.js"
      ),
      "@nexus-state/devtools": path.resolve(
        __dirname,
        "../../packages/devtools/dist/esm/index.js"
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/e2e/**", "**/*.e2e.{ts,tsx}", "**/playwright.config.{ts,js}"],
  },
});
