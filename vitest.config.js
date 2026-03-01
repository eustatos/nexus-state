import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Устанавливаем jsdom как среду по умолчанию для React тестов
    environment: "jsdom",
    include: [
      "**/*.{test,spec}.ts",
      "**/*.{test,spec}.tsx",
    ],
    testTimeout: 30000, // 30 секунд timeout
    hookTimeout: 30000, // 30 секунд timeout для хуков
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["packages/*/src/**/*"],
      exclude: [
        "packages/**/src/**/*.d.ts",
        "**/legacy.ts",
        "**/*.config.*",
        "**/*.test.*",
        "**/*.spec.*",
        "packages/**/dist/**",
        "packages/**/node_modules/**",
      ],
      // Выводим lcov в директорию пакета для последующего объединения
      reportsDirectory: "./coverage",
    },
    // Настройка среды для разных типов тестов
    environmentMatchGlobs: [
      // Для не-React тестов используем node
      ["**/core/**", "node"],
      ["**/tests/**", "node"],
      // Для React тестов используем jsdom
      ["**/react/**", "jsdom"],
      ["**/svelte/**", "jsdom"],
      ["**/vue/**", "jsdom"],
    ],
  },
});
