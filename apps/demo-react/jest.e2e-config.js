module.exports = {
  preset: 'jest-puppeteer',
  testMatch: [
    '<rootDir>/e2e/**/*.test.js',
    '<rootDir>/e2e/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.e2e-setup.js'
  ],
  globalSetup: '<rootDir>/jest.e2e-environment.js',
  globalTeardown: '<rootDir>/jest.e2e-teardown.js',
  testEnvironment: '<rootDir>/jest.e2e-environment.js',
  transform: {},
  // Более длинные таймауты для E2E тестов
  testTimeout: 60000,
  // Отключаем параллельное выполнение для стабильности
  maxWorkers: 1,
  // Детальный вывод
  verbose: true,
  // Цветной вывод
  colors: true,
  // Сбор покрытия для E2E тестов
  collectCoverage: false,
  // Отчеты о покрытии
  coverageReporters: ['text', 'lcov', 'html'],
  // Директории для покрытия
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}'
  ],
  // Глобальные переменные
  globals: {
    // Глобальные переменные для отслеживания ошибок
    pageErrors: [],
    consoleMessages: [],
    // URL для тестов
    BASE_URL: 'http://localhost:5173'
  },
  // Настройки для отображения
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'e2e-junit.xml'
    }]
  ]
};