/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = async () => {
  // Останавливаем сервер разработки после всех тестов
  if (global.__SERVER_PROCESS__) {
    global.__SERVER_PROCESS__.kill();
    console.log('Сервер разработки остановлен');
  }
};