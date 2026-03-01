/* global describe, test, expect, beforeAll, afterAll */
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
const puppeteer = require("puppeteer");
const path = require("path");

describe("E2E тест демонстрации вычисляемых атомов", () => {
  let browser;
  let page;
  let serverProcess;

  beforeAll(async () => {
    // Запускаем сервер разработки
    const { spawn } = require("child_process");
    serverProcess = spawn("npm", ["run", "dev"], {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });

    // Ждем запуска сервера
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Запускаем браузер
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test("базовая страница загружается", async () => {
    await page.goto("http://localhost:5173");

    // Проверяем заголовок
    const title = await page.title();
    expect(title).toContain("Nexus State React Demo");

    // Проверяем наличие элементов
    const pageContent = await page.content();
    expect(pageContent).toContain("Nexus State Demos");
  }, 10000);

  test("переключение между демо работает", async () => {
    await page.goto("http://localhost:5173");

    // Нажимаем кнопку Computed Atoms Demo
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();

    // Ждем появления заголовка демо
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
      { timeout: 5000 },
    );

    // Проверяем наличие элементов формы
    const formExists = await page.$('label:has-text("First Name")');
    expect(formExists).toBeTruthy();
  }, 10000);

  test("проверка ошибок в консоли", async () => {
    const consoleMessages = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      consoleMessages.push(msg.text());
      if (msg.type() === "error") {
        console.error("Консольная ошибка:", msg.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
      console.error("Ошибка страницы:", error.message);
    });

    await page.goto("http://localhost:5173");

    // Переключаемся на демо вычисляемых атомов
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();
    await page.waitForTimeout(1000);

    // Проверяем, что нет критических ошибок
    const criticalErrors = pageErrors.filter(
      (err) =>
        err.includes("atom2.read is not a function") ||
        err.includes("Cannot read property"),
    );

    expect(criticalErrors.length).toBe(0);

    if (criticalErrors.length > 0) {
      console.log("Найдены критические ошибки:", criticalErrors);
    }

    // Логируем все сообщения консоли для отладки
    console.log("Все сообщения консоли:", consoleMessages);
  }, 15000);
});
