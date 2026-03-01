module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/tests/**/*.test.jsx",
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/e2e/**/*.test.js",
  ],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@nexus-state/core$": "<rootDir>/../../packages/core/dist/cjs/index.js",
    "^@nexus-state/react$": "<rootDir>/../../packages/react/dist/cjs/index.js",
    "^@nexus-state/devtools$":
      "<rootDir>/../../packages/devtools/dist/cjs/src/index.js",
  },
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@nexus-state)/)",
    "node_modules/(?!(@nexus-state)/)",
  ],
  // Настройки для e2e тестов
  globalSetup: "./jest.e2e-setup.js",
  globalTeardown: "./jest.e2e-teardown.js",
  testEnvironment: "./jest.e2e-environment.js",
};

// Отдельная конфигурация для e2e тестов
if (process.env.E2E_TEST) {
  module.exports.testEnvironment = "./jest.e2e-environment.js";
  module.exports.globalSetup = "./jest.e2e-setup.js";
  module.exports.globalTeardown = "./jest.e2e-teardown.js";
  module.exports.setupFilesAfterEnv = [];
}
