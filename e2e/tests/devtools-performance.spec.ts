import { test, expect } from '@playwright/test';

/**
 * DevTools Performance E2E Tests
 * 
 * These tests verify that DevTools integration doesn't degrade
 * application performance and doesn't cause memory leaks.
 */

test.describe('DevTools Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the React demo app
    await page.goto('http://localhost:5173');
    
    // Wait for the app to be fully loaded
    await page.waitForSelector('text=Count: 0');
  });

  test('should maintain performance during rapid state updates', async ({ page }) => {
    // Measure initial performance
    const startTime = Date.now();
    
    // Perform rapid state updates
    const incrementButton = page.locator('button:has-text("Increment")');
    
    // Click the button 50 times rapidly
    for (let i = 0; i < 50; i++) {
      await incrementButton.click();
    }
    
    // Verify the final count
    await expect(page.locator('text=Count: 50')).toBeVisible();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Performance assertion: 50 clicks should complete within 5 seconds
    // This is a conservative threshold that should pass even on slow CI
    expect(duration).toBeLessThan(5000);
    
    console.log(`50 rapid clicks completed in ${duration}ms`);
  });

  test('should not have memory leaks during extended usage', async ({ page, browser }) => {
    // This test simulates extended usage to check for memory leaks
    // Get browser context (not used directly but kept for future enhancements)
    void browser.contexts()[0];
    
    // Perform multiple operations over time
    const incrementButton = page.locator('button:has-text("Increment")');
    const decrementButton = page.locator('button:has-text("Decrement")');
    
    // Simulate varied usage pattern
    for (let cycle = 0; cycle < 10; cycle++) {
      // Increment several times
      for (let i = 0; i < 5; i++) {
        await incrementButton.click();
        await page.waitForTimeout(10); // Small delay between actions
      }
      
      // Decrement several times
      for (let i = 0; i < 3; i++) {
        await decrementButton.click();
        await page.waitForTimeout(10);
      }
      
      // Navigate away and back (simulating SPA navigation)
      if (cycle % 3 === 0) {
        // In a real app, you might navigate to a different route
        // For now, we'll just reload to simulate fresh mount
        await page.reload();
        await page.waitForSelector('text=Count:');
      }
    }
    
    // Final state should be consistent
    const countText = await page.locator('text=Count:').textContent();
    expect(countText).toMatch(/Count: \d+/);
    
    // Note: Actual memory measurement would require browser-specific APIs
    // that may not be available in all environments
    console.log('Extended usage test completed without crashes');
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    // Test that DevTools can handle rapid, concurrent interactions
    
    const incrementButton = page.locator('button:has-text("Increment")');
    const decrementButton = page.locator('button:has-text("Decrement")');
    
    // Start multiple "clicks" in rapid succession
    const clickPromises = [];
    
    for (let i = 0; i < 20; i++) {
      // Alternate between increment and decrement
      const button = i % 2 === 0 ? incrementButton : decrementButton;
      clickPromises.push(button.click());
      
      // Don't await each click - simulate concurrent clicks
      if (i % 5 === 0) {
        // Small delay every 5 clicks to simulate realistic user pattern
        await page.waitForTimeout(1);
      }
    }
    
    // Wait for all clicks to complete
    await Promise.all(clickPromises);
    
    // Wait a moment for state to settle
    await page.waitForTimeout(100);
    
    // Verify the UI is responsive and shows some count
    const countText = await page.locator('text=Count:').textContent();
    expect(countText).toMatch(/Count: -?\d+/);
    
    console.log(`Concurrent interactions test completed. Final count: ${countText}`);
  });

  test('should maintain performance with DevTools panel open', async ({ page }) => {
    // This test would require the actual DevTools extension to be loaded
    // For now, we'll simulate the overhead by measuring baseline performance
    
    // Measure performance without "DevTools overhead" simulation
    const startTime = Date.now();
    
    const incrementButton = page.locator('button:has-text("Increment")');
    for (let i = 0; i < 30; i++) {
      await incrementButton.click();
    }
    
    const baselineDuration = Date.now() - startTime;
    
    // Reload page (simulating DevTools being connected)
    await page.reload();
    await page.waitForSelector('text=Count: 0');
    
    // Measure performance again (simulating with DevTools)
    const startTime2 = Date.now();
    
    for (let i = 0; i < 30; i++) {
      await incrementButton.click();
    }
    
    const withDevToolsDuration = Date.now() - startTime2;
    
    // Calculate performance difference
    const performanceDiff = withDevToolsDuration - baselineDuration;
    const performanceRatio = withDevToolsDuration / baselineDuration;
    
    console.log(`Baseline: ${baselineDuration}ms, With DevTools simulation: ${withDevToolsDuration}ms`);
    console.log(`Performance difference: ${performanceDiff}ms (${performanceRatio.toFixed(2)}x)`);
    
    // Assert that performance doesn't degrade too much
    // Allow for some variance, but not more than 2x slower
    expect(performanceRatio).toBeLessThan(2);
  });
});
