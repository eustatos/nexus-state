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
    benchmark: {
      outputJson: "bench-result.json",
      reporters: ["default", "verbose"],
      // В CI режиме не запускаем watch mode
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // Включаем только исходный код пакетов
      include: [
        "packages/*/src/**/*.{ts,tsx}",
      ],
      // Исключаем тесты, фикстуры, бенчмарки, apps и другие служебные файлы
      exclude: [
        // Приложения (apps)
        "apps/**",
        // Тестовые файлы и директории
        "**/__tests__/**",
        "**/__fixtures__/**",
        "**/__mocks__/**",
        "**/__benchmarks__/**",
        "**/test-utils/**",
        "**/test-utils.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.bench.{ts,tsx}",
        "**/*.test-d.{ts,tsx}",
        // Файлы деклараций и конфигурации
        "**/*.d.ts",
        "**/legacy.ts",
        "**/*.config.{js,ts,mjs}",
        "**/*.config.*",
        // Скомпилированные файлы и зависимости
        "**/dist/**",
        "**/build/**",
        "**/node_modules/**",
        // Прочее
        "**/*.css",
        "**/*.scss",
        "**/*.less",
        "**/*.md",
        "**/*.json",
      ],
      // Пороговые значения для покрытия (опционально)
      thresholds: {
        global: {
          // Можно установить минимальные пороги
          // statements: 80,
          // branches: 80,
          // functions: 80,
          // lines: 80,
        },
      },
    },
    // Настройка среды для разных типов тестов
    environmentMatchGlobs: [
      // Для не-React тестов используем node
      ["**/core/**", "node"],
      ["**/family/**", "node"],
      ["**/tests/**", "node"],
      // Для React тестов используем jsdom
      ["**/react/**", "jsdom"],
      ["**/svelte/**", "jsdom"],
      ["**/vue/**", "jsdom"],
    ],
  },
});
