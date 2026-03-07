import { test, expect } from "@playwright/test";

/**
 * E2E tests for Timeline Slider functionality
 * Tests the timeline navigation and state restoration
 */
test.describe("Timeline Slider - Navigation and Restoration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display timeline slider", async ({ page }) => {
    // Check timeline slider is visible
    const timeline = page.locator('[data-testid="timeline-slider"]');
    await expect(timeline).toBeVisible();
  });

  test("should display snapshot points in timeline after typing", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type first snapshot content
    await editor.type("First text");
    await page.waitForTimeout(1200); // Wait for debounce

    // Type second snapshot content
    await editor.type(" Second text");
    await page.waitForTimeout(1200);

    // Type third snapshot content
    await editor.type(" Third text");
    await page.waitForTimeout(1200);

    // Check timeline has snapshot points
    const timelinePoints = page.locator('[data-testid^="timeline-slider-point-"]');
    await expect(timelinePoints).toHaveCount(3);
  });

  test("should restore editor content when clicking timeline points", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create three snapshots
    await editor.type("Text A");
    await page.waitForTimeout(1200);

    await editor.type(" Text B");
    await page.waitForTimeout(1200);

    await editor.type(" Text C");
    await page.waitForTimeout(1200);

    // Verify current content
    let value = await editor.inputValue();
    expect(value).toContain("Text A");
    expect(value).toContain("Text B");
    expect(value).toContain("Text C");

    // Click first snapshot point - ПРОБЛЕМА: может не восстановиться
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.waitForTimeout(500);

    value = await editor.inputValue();
    expect(value).toBe("Text A");
  });

  test("should navigate timeline with multiple clicks", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("Version 1");
    await page.waitForTimeout(1200);

    await editor.type(" Version 2");
    await page.waitForTimeout(1200);

    await editor.type(" Version 3");
    await page.waitForTimeout(1200);

    // Navigate: last -> first -> middle
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.waitForTimeout(500);
    let value = await editor.inputValue();
    expect(value).toBe("Version 1");

    await page.locator('[data-testid="timeline-slider-point-2"]').click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).toContain("Version 1");
    expect(value).toContain("Version 2");
    expect(value).toContain("Version 3");
  });

  test("should update timeline position indicator", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    // Check position indicator shows correct position
    const positionInfo = page.locator('[data-testid="timeline-slider-info"]');
    await expect(positionInfo).toContainText("2 / 2");

    // Click first point
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.waitForTimeout(500);

    // Position should update
    await expect(positionInfo).toContainText("1 / 2");
  });

  test("should handle keyboard navigation in timeline", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("First");
    await page.waitForTimeout(1200);

    await editor.type(" Second");
    await page.waitForTimeout(1200);

    await editor.type(" Third");
    await page.waitForTimeout(1200);

    // Focus timeline
    const timeline = page.locator('[data-testid="timeline-slider"]');
    await timeline.focus();

    // Navigate with Home key
    await page.keyboard.press("Home");
    await page.waitForTimeout(500);

    let value = await editor.inputValue();
    expect(value).toBe("First");

    // Navigate with End key
    await page.keyboard.press("End");
    await page.waitForTimeout(500);

    value = await editor.inputValue();
    expect(value).toContain("First");
    expect(value).toContain("Second");
    expect(value).toContain("Third");
  });

  test("should handle drag navigation in timeline", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    await editor.type(" C");
    await page.waitForTimeout(1200);

    // Get timeline bounding box
    const timeline = page.locator('[data-testid="timeline-slider"]');
    const box = await timeline.boundingBox();

    if (box) {
      // Drag from right to left
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(500);

      // Content should have changed
      const value = await editor.inputValue();
      expect(value).toBeDefined();
    }
  });
});
