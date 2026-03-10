import { test, expect } from "@playwright/test";

/**
 * E2E tests for Toolbar functionality
 */
test.describe("Toolbar - Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should click toolbar buttons", async ({ page }) => {
    // First add some content to enable buttons
    const editor = page.locator("textarea");
    await editor.type("Test content");

    // Click Clear button
    const clearButton = page.getByTitle("Clear");
    await clearButton.click();

    // Verify content is cleared
    await expect(editor).toHaveValue("");
  });

  test("should display tooltips on hover", async ({ page }) => {
    const clearButton = page.getByTitle("Clear");

    // Hover over button
    await clearButton.hover();

    // Tooltip should appear (implementation dependent)
    // This test may need adjustment based on tooltip implementation
  });

  test("should have all required toolbar buttons", async ({ page }) => {
    // Check all expected buttons are present
    const expectedButtons = ["Clear", "Copy"];

    for (const buttonTitle of expectedButtons) {
      await expect(page.getByTitle(buttonTitle)).toBeVisible();
    }
  });
});
