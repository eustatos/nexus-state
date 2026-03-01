/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = async () => {
  // Запускаем сервер разработки перед всеми тестами
  const { spawn } = require("child_process");
  const path = require("path");

  console.log("Запуск сервера разработки...");
  global.__SERVER_PROCESS__ = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname),
    stdio: "pipe",
  });

  // Ждем запуска сервера (увеличиваем время ожидания)
  console.log("Ожидание запуска сервера (10 секунд)...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("Сервер разработки запущен");
};
