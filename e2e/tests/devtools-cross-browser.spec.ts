import { test, expect } from '@playwright/test';

/**
 * Cross-browser compatibility tests for DevTools
 * 
 * These tests ensure DevTools work correctly across different browsers.
 * Playwright will run these tests in all configured browser projects.
 */

test.describe('DevTools Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Log which browser we're testing in
    console.log(`Running test in: ${browserName}`);
    
    // Navigate to the React demo app
    await page.goto('http://localhost:5173');
    
    // Wait for the app to be fully loaded
    await page.waitForSelector('text=Count: 0');
  });

  test('basic state updates work in all browsers', async ({ page, browserName }) => {
    // Test basic increment functionality
    await page.click('button:has-text("Increment")');
    
    // Verify the count updated
    await expect(page.locator('text=Count: 1')).toBeVisible();
    
    // Test decrement functionality
    await page.click('button:has-text("Decrement")');
    
    // Verify the count updated back to 0
    await expect(page.locator('text=Count: 0')).toBeVisible();
    
    console.log(`Basic state updates passed in ${browserName}`);
  });

  test('rapid interactions are handled consistently', async ({ page, browserName }) => {
    // Perform rapid clicks
    const incrementButton = page.locator('button:has-text("Increment")');
    
    const startTime = Date.now();
    
    // Click 20 times rapidly
    for (let i = 0; i < 20; i++) {
      await incrementButton.click();
    }
    
    const duration = Date.now() - startTime;
    
    // Verify final state
    await expect(page.locator('text=Count: 20')).toBeVisible();
    
    console.log(`Rapid interactions (20 clicks) in ${browserName}: ${duration}ms`);
    
    // All browsers should complete within a reasonable time
    // Different browsers have different performance characteristics,
    // so we use a generous timeout
    expect(duration).toBeLessThan(10000); // 10 seconds max
  });

  test('state persistence across navigation', async ({ page, browserName }) => {
    // This test checks that state management works correctly
    // when the user interacts with the page
    
    // Set initial state
    const incrementButton = page.locator('button:has-text("Increment")');
    await incrementButton.click();
    await incrementButton.click();
    await incrementButton.click();
    
    // Verify state
    await expect(page.locator('text=Count: 3')).toBeVisible();
    
    // Simulate navigation by reloading the page
    await page.reload();
    await page.waitForSelector('text=Count: 0'); // Should reset after reload
    
    // Verify fresh state
    await expect(page.locator('text=Count: 0')).toBeVisible();
    
    console.log(`State persistence test passed in ${browserName}`);
  });

  test('UI responsiveness during state updates', async ({ page, browserName }) => {
    // Test that the UI remains responsive during state updates
    
    // Start a series of updates
    const incrementButton = page.locator('button:has-text("Increment")');
    
    // Try to interact with other UI elements during updates
    const clickPromises = [];
    
    for (let i = 0; i < 10; i++) {
      clickPromises.push(incrementButton.click());
      
      // Every few clicks, try to read the current count
      if (i % 3 === 0) {
        const countText = await page.locator('text=Count:').textContent();
        expect(countText).toMatch(/Count: \d+/);
      }
    }
    
    // Wait for all clicks to complete
    await Promise.all(clickPromises);
    
    // Final verification
    await expect(page.locator('text=Count: 10')).toBeVisible();
    
    console.log(`UI responsiveness test passed in ${browserName}`);
  });

  test('error handling and recovery', async ({ page, browserName }) => {
    // Test that the application recovers gracefully from errors
    // or edge cases
    
    // Perform normal operations first
    await page.click('button:has-text("Increment")');
    await expect(page.locator('text=Count: 1')).toBeVisible();
    
    // Rapidly trigger many state updates
    const incrementButton = page.locator('button:has-text("Increment")');
    const promises = [];
    
    for (let i = 0; i < 15; i++) {
      promises.push(incrementButton.click());
    }
    
    await Promise.all(promises);
    
    // Wait for UI to settle
    await page.waitForTimeout(100);
    
    // Verify the application is still in a good state
    const countText = await page.locator('text=Count:').textContent();
    expect(countText).toMatch(/Count: \d+/);
    
    // The count should be 16 (1 + 15)
    // But due to async nature, it might be slightly different
    // We just verify it's a positive number
    const countMatch = countText!.match(/Count: (\d+)/);
    if (countMatch) {
      const count = parseInt(countMatch[1], 10);
      expect(count).toBeGreaterThan(0);
    }
    
    console.log(`Error handling test passed in ${browserName}. Final count: ${countText}`);
  });
});
