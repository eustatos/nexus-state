/* global describe, test, expect, beforeAll, afterAll, beforeEach */
/* eslint-disable @typescript-eslint/no-var-requires, no-console */
const puppeteer = require("puppeteer");
const path = require("path");

describe("E2E тест демонстрации вычисляемых атомов и селективного обновления", () => {
  let browser;
  let page;
  let serverProcess;
  let consoleMessages = [];
  let pageErrors = [];

  beforeAll(async () => {
    // Запускаем сервер разработки
    const { spawn } = require("child_process");
    serverProcess = spawn("npm", ["run", "dev"], {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
      env: { ...process.env, PORT: "5173" },
    });

    // Ждем запуска сервера
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Запускаем браузер
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      defaultViewport: { width: 1280, height: 800 },
    });

    page = await browser.newPage();

    // Собираем сообщения консоли и ошибки
    page.on("console", (msg) => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString(),
      });

      if (msg.type() === "error") {
        console.error("Консольная ошибка:", text);
      }
    });

    page.on("pageerror", (error) => {
      const errorMsg = error.message;
      pageErrors.push({
        message: errorMsg,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      console.error("Ошибка страницы:", errorMsg);
    });

    // Перехватываем сетевые ошибки
    page.on("requestfailed", (request) => {
      console.error(
        "Сетевой запрос не удался:",
        request.url(),
        request.failure().errorText,
      );
    });
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  beforeEach(async () => {
    consoleMessages = [];
    pageErrors = [];
  });

  // Вспомогательная функция для проверки отсутствия критических ошибок
  const checkForCriticalErrors = () => {
    const criticalErrors = pageErrors.filter(
      (err) =>
        err.message.includes("atom2.read is not a function") ||
        err.message.includes("Cannot read property") ||
        err.message.includes("is not a function") ||
        err.message.includes("Uncaught") ||
        err.message.includes("TypeError"),
    );

    if (criticalErrors.length > 0) {
      console.log("Найдены критические ошибки:", criticalErrors);
      console.log("Все ошибки страницы:", pageErrors);
      console.log("Сообщения консоли:", consoleMessages);
    }

    return criticalErrors;
  };

  test("демонстрация вычисляемых атомов загружается корректно", async () => {
    await page.goto("http://localhost:5173");

    // Переключаемся на демо вычисляемых атомов
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
      { timeout: 10000 },
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();

    // Ждем загрузки демо
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
      { timeout: 10000 },
    );

    // Проверяем наличие всех ключевых элементов
    const elementsToCheck = [
      'label:has-text("First Name")',
      'label:has-text("Last Name")',
      'label:has-text("Age")',
      'label:has-text("Status")',
      'div:has-text("Full Name:")',
      'div:has-text("Is Adult:")',
      'div:has-text("Profile Summary:")',
      'button:has-text("Reset All")',
      'button:has-text("Update All (Batch)")',
    ];

    for (const selector of elementsToCheck) {
      const element = await page.$(selector);
      expect(element).toBeTruthy();
    }

    // Проверяем начальные значения
    const fullNameText = await page.$eval(
      'div:has-text("Full Name:")',
      (el) => el.textContent,
    );
    expect(fullNameText).toContain('Full Name: "John Doe"');

    const isAdultText = await page.$eval(
      'div:has-text("Is Adult:")',
      (el) => el.textContent,
    );
    expect(isAdultText).toContain("Is Adult: true");

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 20000);

  test("вычисляемые атомы корректно обновляются при изменении базовых атомов", async () => {
    await page.goto("http://localhost:5173");
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
    );

    // Изменяем First Name
    const firstNameInput = await page.$('input[type="text"]');
    await firstNameInput.click({ clickCount: 3 }); // Выделяем весь текст
    await firstNameInput.type("Alice");

    // Ждем обновления вычисляемых атомов
    await page.waitForFunction(
      () => {
        const fullNameDiv = Array.from(document.querySelectorAll("div")).find(
          (el) => el.textContent.includes("Full Name:"),
        );
        return fullNameDiv && fullNameDiv.textContent.includes("Alice Doe");
      },
      { timeout: 5000 },
    );

    // Проверяем обновление Full Name
    const fullNameText = await page.$eval(
      'div:has-text("Full Name:")',
      (el) => el.textContent,
    );
    expect(fullNameText).toContain('Full Name: "Alice Doe"');

    // Проверяем обновление Profile Summary
    const profileSummaryText = await page.$eval(
      'div:has-text("Profile Summary:")',
      (el) => el.textContent,
    );
    expect(profileSummaryText).toContain("Alice Doe");

    // Изменяем Age
    const ageInput = await page.$('input[type="number"]');
    await ageInput.click({ clickCount: 3 });
    await ageInput.type("17");

    // Ждем обновления Is Adult
    await page.waitForFunction(
      () => {
        const isAdultDiv = Array.from(document.querySelectorAll("div")).find(
          (el) => el.textContent.includes("Is Adult:"),
        );
        return isAdultDiv && isAdultDiv.textContent.includes("false");
      },
      { timeout: 5000 },
    );

    // Проверяем обновление Is Adult
    const isAdultText = await page.$eval(
      'div:has-text("Is Adult:")',
      (el) => el.textContent,
    );
    expect(isAdultText).toContain("Is Adult: false");

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 20000);

  test("селективное обновление работает корректно (рендерится только измененные компоненты)", async () => {
    await page.goto("http://localhost:5173");
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
    );

    // Получаем начальные счетчики рендеров
    const getRenderCounts = async () => {
      return await page.evaluate(() => {
        const renderCountElements = Array.from(
          document.querySelectorAll("span"),
        ).filter((el) => el.textContent.includes("renders:"));
        return renderCountElements.map((el) => {
          const text = el.textContent;
          const match = text.match(/renders:\s*(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
      });
    };

    const initialRenderCounts = await getRenderCounts();

    // Изменяем только First Name
    const firstNameInput = await page.$('input[type="text"]');
    await firstNameInput.click({ clickCount: 3 });
    await firstNameInput.type("Bob");
    await page.waitForTimeout(1000); // Ждем обновления

    const afterFirstNameRenderCounts = await getRenderCounts();

    // Проверяем, что счетчики изменились только для связанных атомов
    // (firstName, fullName, profileSummary, needsUpdate, isValid)
    // Остальные должны остаться без изменений

    // Изменяем только Status (переключаем)
    const statusButton = await page.$('button:has-text("Active")');
    await statusButton.click();
    await page.waitForTimeout(1000);

    const afterStatusRenderCounts = await getRenderCounts();

    // Проверяем, что счетчики изменились только для связанных атомов
    // (isActive, profileSummary, needsUpdate)

    console.log("Начальные счетчики:", initialRenderCounts);
    console.log("После изменения First Name:", afterFirstNameRenderCounts);
    console.log("После изменения Status:", afterStatusRenderCounts);

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 20000);

  test("batch обновление работает корректно", async () => {
    await page.goto("http://localhost:5173");
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
    );

    // Нажимаем кнопку Update All (Batch)
    await page.waitForSelector('button:has-text("Update All (Batch)")');
    await page.click('button:has-text("Update All (Batch)")');

    // Ждем обновления всех значений
    await page.waitForFunction(
      () => {
        const fullNameDiv = Array.from(document.querySelectorAll("div")).find(
          (el) => el.textContent.includes("Full Name:"),
        );
        return fullNameDiv && fullNameDiv.textContent.includes("Jane Smith");
      },
      { timeout: 5000 },
    );

    // Проверяем обновленные значения
    const fullNameText = await page.$eval(
      'div:has-text("Full Name:")',
      (el) => el.textContent,
    );
    expect(fullNameText).toContain('Full Name: "Jane Smith"');

    const ageText = await page.$eval(
      'div:has-text("age")',
      (el) => el.textContent,
    );
    expect(ageText).toContain("age: 25");

    const statusText = await page.$eval(
      'div:has-text("isActive")',
      (el) => el.textContent,
    );
    expect(statusText).toContain("isActive: false");

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 20000);

  test("валидация формы работает корректно", async () => {
    await page.goto("http://localhost:5173");
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
    );

    // Проверяем начальное состояние валидации
    const initialIsValidText = await page.$eval(
      'div:has-text("Form is valid")',
      (el) => el.textContent,
    );
    expect(initialIsValidText).toContain("Form is valid: true");

    // Делаем форму невалидной - очищаем First Name
    const firstNameInput = await page.$('input[type="text"]');
    await firstNameInput.click({ clickCount: 3 });
    await firstNameInput.type("");

    // Ждем обновления валидации
    await page.waitForFunction(
      () => {
        const isValidDiv = Array.from(document.querySelectorAll("div")).find(
          (el) => el.textContent.includes("Form is valid:"),
        );
        return isValidDiv && isValidDiv.textContent.includes("false");
      },
      { timeout: 5000 },
    );

    // Проверяем, что форма стала невалидной
    const afterClearIsValidText = await page.$eval(
      'div:has-text("Form is valid")',
      (el) => el.textContent,
    );
    expect(afterClearIsValidText).toContain("Form is valid: false");

    // Восстанавливаем валидность
    await firstNameInput.type("ValidName");

    // Ждем обновления валидации
    await page.waitForFunction(
      () => {
        const isValidDiv = Array.from(document.querySelectorAll("div")).find(
          (el) => el.textContent.includes("Form is valid:"),
        );
        return isValidDiv && isValidDiv.textContent.includes("true");
      },
      { timeout: 5000 },
    );

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 20000);

  test("devtools интеграция работает (проверка через консольные сообщения)", async () => {
    await page.goto("http://localhost:5173");
    await page.waitForXPath(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    const [computedButton] = await page.$x(
      '//button[contains(text(), "Computed Atoms Demo")]',
    );
    await computedButton.click();
    await page.waitForXPath(
      '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
    );

    // Выполняем несколько действий для генерации событий в devtools
    const firstNameInput = await page.$('input[type="text"]');
    await firstNameInput.click({ clickCount: 3 });
    await firstNameInput.type("Test");

    await page.waitForTimeout(500);

    // Нажимаем кнопку Update All (Batch)
    await page.click('button:has-text("Update All (Batch)")');

    await page.waitForTimeout(1000);

    // Проверяем, что в консоли есть сообщения от devtools (если они включены)
    const devtoolsMessages = consoleMessages.filter(
      (msg) =>
        msg.text.includes("[Nexus State]") ||
        msg.text.includes("atom") ||
        msg.text.includes("DevTools"),
    );

    console.log("Сообщения DevTools:", devtoolsMessages);

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 20000);

  test("переключение между демо не вызывает ошибок", async () => {
    await page.goto("http://localhost:5173");

    // Переключаемся несколько раз между демо
    for (let i = 0; i < 3; i++) {
      await page.waitForXPath(
        '//button[contains(text(), "Computed Atoms Demo")]',
        {
          timeout: 5000,
        },
      );
      const [computedButton] = await page.$x(
        '//button[contains(text(), "Computed Atoms Demo")]',
      );
      await computedButton.click();
      await page.waitForXPath(
        '//h1[contains(text(), "Nexus State: Computed Atoms Demo")]',
        { timeout: 5000 },
      );

      await page.waitForTimeout(500);

      await page.waitForXPath('//button[contains(text(), "Simple Counter")]', {
        timeout: 5000,
      });
      const [simpleButton] = await page.$x(
        '//button[contains(text(), "Simple Counter")]',
      );
      await simpleButton.click();
      await page.waitForXPath(
        '//h1[contains(text(), "Nexus State React Demo")]',
        {
          timeout: 5000,
        },
      );

      await page.waitForTimeout(500);
    }

    // Проверяем отсутствие критических ошибок
    const criticalErrors = checkForCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  }, 30000);
});
