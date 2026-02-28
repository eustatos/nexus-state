import { defineWorkspace } from "vitest/config";

const sharedConfig = {
  test: {
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "apps/**",
      "e2e/**",
      "docs/**",
      "examples/**",
    ],
  },
};

export default defineWorkspace([
  {
    extends: "./vitest.config.js",
    test: {
      ...sharedConfig.test,
      name: "core",
      environment: "node",
      include: [
        "packages/core/**/*.{test,spec}.{ts,tsx}",
        "packages/async/**/*.{test,spec}.{ts,tsx}",
        "packages/devtools/**/*.{test,spec}.{ts,tsx}",
        "packages/family/**/*.{test,spec}.{ts,tsx}",
        "packages/immer/**/*.{test,spec}.{ts,tsx}",
      ],
      coverage: {
        provider: "v8",
        include: [
          "packages/core/src/**/*.{ts,tsx}",
          "packages/async/src/**/*.{ts,tsx}",
          "packages/devtools/src/**/*.{ts,tsx}",
          "packages/family/src/**/*.{ts,tsx}",
          "packages/immer/src/**/*.{ts,tsx}",
        ],
      },
    },
  },
  {
    extends: "./vitest.config.js",
    test: {
      ...sharedConfig.test,
      name: "browser-deps",
      environment: "jsdom",
      include: [
        "packages/middleware/**/*.{test,spec}.{ts,tsx}",
        "packages/persist/**/*.{test,spec}.{ts,tsx}",
      ],
      coverage: {
        provider: "v8",
        include: [
          "packages/middleware/src/**/*.{ts,tsx}",
          "packages/persist/src/**/*.{ts,tsx}",
        ],
      },
    },
  },
  {
    extends: "./vitest.config.js",
    test: {
      ...sharedConfig.test,
      name: "react",
      environment: "jsdom",
      include: ["packages/react/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        provider: "v8",
        include: ["packages/react/src/**/*.{ts,tsx}"],
      },
    },
  },
  {
    extends: "./vitest.config.js",
    test: {
      ...sharedConfig.test,
      name: "svelte",
      environment: "jsdom",
      include: ["packages/svelte/**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        provider: "v8",
        include: ["packages/svelte/src/**/*.{ts,tsx}"],
      },
    },
  },
]);
