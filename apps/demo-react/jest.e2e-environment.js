/* eslint-disable @typescript-eslint/no-var-requires */
const NodeEnvironment = require('jest-environment-node').TestEnvironment;
const puppeteer = require('puppeteer');

class E2EEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    
    // Запускаем браузер
    this.global.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Создаем новую страницу
    this.global.page = await this.global.browser.newPage();
    
    // Настраиваем обработчики ошибок
    this.global.consoleMessages = [];
    this.global.pageErrors = [];
    
    this.global.page.on('console', msg => {
      this.global.consoleMessages.push(msg.text());
      if (msg.type() === 'error') {
        console.error('Консольная ошибка:', msg.text());
      }
    });
    
    this.global.page.on('pageerror', error => {
      this.global.pageErrors.push(error.message);
      console.error('Ошибка страницы:', error.message);
    });
  }
  
  async teardown() {
    // Закрываем браузер
    if (this.global.browser) {
      await this.global.browser.close();
    }
    
    await super.teardown();
  }
  
  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = E2EEnvironment;