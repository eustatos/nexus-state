import { test, expect } from '@playwright/test';

test('should increment counter', async ({ page }) => {
  // Открываем React приложение
  await page.goto('http://localhost:5173');
  
  // Проверяем начальное значение счетчика
  await expect(page.locator('text=Count: 0')).toBeVisible();
  
  // Кликаем по кнопке инкремента
  await page.click('button:has-text("Increment")');
  
  // Проверяем, что значение счетчика увеличилось
  await expect(page.locator('text=Count: 1')).toBeVisible();
});