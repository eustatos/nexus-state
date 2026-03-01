import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
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
});
