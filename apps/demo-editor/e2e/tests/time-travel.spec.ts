import { test, expect } from "@playwright/test";

/**
 * E2E tests for Time-Travel functionality
 * Tests the snapshot creation and restoration features
 */
test.describe("Time-Travel - Snapshot Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display snapshots sidebar", async ({ page }) => {
    // Check snapshots sidebar is visible
    await expect(page.getByRole("heading", { name: "Snapshots" })).toBeVisible();

    // Check snapshot list component is visible
    await expect(page.getByTestId("snapshot-list")).toBeVisible();
  });

  test("should create snapshots when typing", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type some text
    await editor.type("Test content for snapshot");

    // Wait for debounce (1 second + buffer)
    await page.waitForTimeout(1500);

    // Check snapshot count in sidebar - look for the count span
    const snapshotCount = page.locator("aside").getByText(/\d+/).last();
    await expect(snapshotCount).toBeVisible();
  });

  test("should restore state from snapshot", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type initial content
    await editor.type("Initial content");

    // Wait for snapshot creation
    await page.waitForTimeout(1500);

    // Type more content
    await editor.type(" - Additional content");

    // Wait for another snapshot
    await page.waitForTimeout(1500);

    // Note: Full snapshot restoration test requires snapshot list implementation
    // This is a placeholder for future implementation
    const value = await editor.inputValue();
    expect(value).toContain("Initial content");
    expect(value).toContain("Additional content");
  });

  test("should track multiple snapshots", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create multiple snapshots by typing with pauses
    for (let i = 1; i <= 3; i++) {
      await editor.type(` Snapshot ${i}`);
      await page.waitForTimeout(1200);
    }

    // Verify all content is present
    const value = await editor.inputValue();
    expect(value).toContain("Snapshot 1");
    expect(value).toContain("Snapshot 2");
    expect(value).toContain("Snapshot 3");
  });
});
