import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "**/*.{test,spec}.ts",
      "**/*.{test,spec}.tsx",
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "packages/core/src/**/*",
        "packages/react/src/**/*",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**/*",
        "**/test-utils/**/*",
      ],
      reportsDirectory: "./coverage",
      thresholds: {
        // Global thresholds for core packages
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
        // Per-package thresholds (override global)
        perFile: true,
      },
    },
    environmentMatchGlobs: [
      ["**/core/**", "node"],
      ["**/tests/**", "node"],
      ["**/react/**", "jsdom"],
      ["**/svelte/**", "jsdom"],
      ["**/vue/**", "jsdom"],
    ],
  },
});
