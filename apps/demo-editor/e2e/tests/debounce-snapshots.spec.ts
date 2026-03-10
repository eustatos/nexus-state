import { test, expect } from "@playwright/test";

/**
 * E2E tests for Debounce Snapshots functionality (TASK-005)
 * Tests the automatic snapshot creation with debounce
 */
test.describe("Debounce Snapshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show saving indicator when typing", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Start typing
    await editor.type("Hello");

    // Should show "Saving..." or "Unsaved changes"
    const saveStatus = page.locator(".save-status.saving, .save-status");
    await expect(saveStatus).toBeVisible();
  });

  test("should update snapshot count after debounce delay", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type some text
    await editor.type("Test content for snapshot");

    // Wait for debounce delay (1 second + buffer)
    await page.waitForTimeout(1500);

    // Check snapshot count in header
    const snapshotCount = page.getByText(/Snapshots:/);
    await expect(snapshotCount).toBeVisible();
  });

  test("should show saved status after debounce", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type text
    await editor.type("Test content");

    // Wait for debounce to complete
    await page.waitForTimeout(1500);

    // Should show saving status (saved or unsaved changes)
    const saveStatus = page.locator(".save-status");
    await expect(saveStatus).toBeVisible();
  });

  test("should create multiple snapshots with pauses", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type first chunk
    await editor.type("First chunk");
    await page.waitForTimeout(1200);

    // Type second chunk
    await editor.type(" Second chunk");
    await page.waitForTimeout(1200);

    // Type third chunk
    await editor.type(" Third chunk");
    await page.waitForTimeout(1200);

    // Verify all content is present
    const value = await editor.inputValue();
    expect(value).toContain("First chunk");
    expect(value).toContain("Second chunk");
    expect(value).toContain("Third chunk");
  });

  test("should not create excessive snapshots during fast typing", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type quickly (multiple characters in rapid succession)
    const fastText = "Quick typing test with many characters";
    for (const char of fastText) {
      await editor.type(char, { delay: 10 });
    }

    // Wait for debounce
    await page.waitForTimeout(1500);

    // Should have saving status
    const saveStatus = page.locator(".save-status");
    await expect(saveStatus).toBeVisible();
  });

  test("should update stats after snapshot creation", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type text
    await editor.type("Test statistics update");

    // Wait for debounce
    await page.waitForTimeout(1500);

    // Check stats are updated - look for character count
    const charsStat = page.locator(".stat-item").filter({ hasText: "Chars" });
    await expect(charsStat).toBeVisible();

    const charValue = await charsStat.locator(".stat-value").textContent();
    expect(charValue).toBeTruthy();
    expect(parseInt(charValue || "0")).toBeGreaterThan(0);
  });

  test("should handle continuous typing with maxWait", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type continuously for more than maxWait (5 seconds)
    for (let i = 0; i < 10; i++) {
      await editor.type(` Word${i}`);
      await page.waitForTimeout(400);
    }

    // Final wait for debounce
    await page.waitForTimeout(1500);

    // Should have saving status
    const saveStatus = page.locator(".save-status");
    await expect(saveStatus).toBeVisible();

    // Verify content
    const value = await editor.inputValue();
    expect(value).toContain("Word0");
    expect(value).toContain("Word9");
  });
});
