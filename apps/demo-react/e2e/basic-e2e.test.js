/* global describe, test, expect, beforeAll, page, consoleMessages, pageErrors */
/* eslint-disable no-console */
describe("Базовый E2E тест", () => {
  beforeAll(async () => {
    // Переходим на страницу
    await page.goto("http://localhost:5173");

    // Ждем загрузки - проверяем наличие заголовка
    await page.waitForSelector("h1");
  }, 30000);

  test("страница загружается без ошибок", async () => {
    // Проверяем заголовок
    const title = await page.title();
    expect(title).toContain("Nexus State React Demo");

    // Проверяем наличие элементов
    const h1Text = await page.$eval("h1", (el) => el.textContent);
    expect(h1Text).toContain("Nexus State React Demo");

    // Проверяем, что нет критических ошибок
    const criticalErrors = pageErrors.filter(
      (err) =>
        err.includes("atom2.read is not a function") ||
        err.includes("Cannot read property") ||
        err.includes("is not a function"),
    );

    expect(criticalErrors.length).toBe(0);

    if (criticalErrors.length > 0) {
      console.log("Критические ошибки:", criticalErrors);
      console.log("Все ошибки страницы:", pageErrors);
      console.log("Сообщения консоли:", consoleMessages);
    }
  }, 10000);

  test("простой счетчик работает", async () => {
    // Проверяем начальное состояние - ищем параграф с текстом Count
    await page.waitForFunction(
      () => {
        const paragraphs = Array.from(document.querySelectorAll("p"));
        return paragraphs.some((p) => p.textContent.includes("Count:"));
      },
      { timeout: 5000 },
    );

    // Получаем текст параграфа
    const countText = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll("p"));
      const countParagraph = paragraphs.find((p) =>
        p.textContent.includes("Count:"),
      );
      return countParagraph ? countParagraph.textContent : "";
    });

    expect(countText).toContain("Count: 0");

    // Нажимаем кнопку Increment
    await page.waitForXPath('//button[contains(text(), "Increment")]');
    const [incrementButton] = await page.$x(
      '//button[contains(text(), "Increment")]',
    );
    await incrementButton.click();

    // Ждем обновления
    await page.waitForFunction(
      () => {
        const paragraphs = Array.from(document.querySelectorAll("p"));
        return paragraphs.some((p) => p.textContent.includes("Count: 1"));
      },
      { timeout: 5000 },
    );
    // Проверяем обновленное состояние
    const updatedCountText = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll("p"));
      const countParagraph = paragraphs.find((p) =>
        p.textContent.includes("Count:"),
      );
      return countParagraph ? countParagraph.textContent : "";
    });

    expect(updatedCountText).toContain("Count: 1");
  }, 15000);
});
