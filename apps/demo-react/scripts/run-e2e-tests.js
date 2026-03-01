#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🚀 Запуск E2E тестов для Nexus State Demo...");
console.log("============================================");

// Проверяем наличие необходимых файлов
const requiredFiles = [
  "e2e/computed-atoms-e2e.test.js",
  "e2e/basic-e2e.test.js",
  "e2e/simple-e2e.test.js",
  "jest.e2e-config.js",
];

console.log("📁 Проверка файлов тестов...");
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - не найден`);
  }
}
console.log("");

// Запускаем сервер разработки
console.log("🌐 Запуск сервера разработки...");
const serverProcess = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, ".."),
  stdio: "pipe",
  env: { ...process.env, PORT: "5173" },
});

let serverOutput = "";
serverProcess.stdout.on("data", (data) => {
  serverOutput += data.toString();
  if (serverOutput.includes("Local:") || serverOutput.includes("Network:")) {
    console.log("  ✅ Сервер запущен");
  }
});

serverProcess.stderr.on("data", (data) => {
  console.error("  ❌ Ошибка сервера:", data.toString());
});

// Ждем запуска сервера
setTimeout(() => {
  console.log("\n🧪 Запуск E2E тестов...");

  const testProcess = spawn(
    "npm",
    ["test", "--", "--testPathPatterns=e2e", "--runInBand"],
    {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    },
  );

  testProcess.on("close", (code) => {
    console.log("\n============================================");
    if (code === 0) {
      console.log("✅ Все E2E тесты прошли успешно!");
    } else {
      console.log(`❌ E2E тесты завершились с кодом: ${code}`);
    }

    // Останавливаем сервер
    console.log("\n🛑 Остановка сервера...");
    serverProcess.kill();
    process.exit(code);
  });

  testProcess.on("error", (err) => {
    console.error("❌ Ошибка запуска тестов:", err);
    serverProcess.kill();
    process.exit(1);
  });
}, 8000); // Даем серверу время на запуск

// Обработка прерывания
process.on("SIGINT", () => {
  console.log("\n🛑 Прерывание выполнения...");
  serverProcess.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Завершение выполнения...");
  serverProcess.kill();
  process.exit(0);
});
