import { test, expect } from "@playwright/test";

/**
 * E2E tests for Snapshot List navigation and state restoration
 * Tests the sidebar snapshot selection and undo/redo functionality
 */
test.describe("Snapshot List - Navigation and Restoration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display snapshots in sidebar after typing", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type and wait for snapshots
    await editor.type("First content");
    await page.waitForTimeout(1200);

    await editor.type(" Second content");
    await page.waitForTimeout(1200);

    // Check snapshot count
    const snapshotCount = page.locator('[data-testid="snapshot-count"]');
    await expect(snapshotCount).toBeVisible();
  });

  test("should restore editor content when clicking snapshot in sidebar", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create first snapshot
    await editor.type("Version 1");
    await page.waitForTimeout(1200);

    // Create second snapshot
    await editor.type(" Version 2");
    await page.waitForTimeout(1200);

    // Create third snapshot
    await editor.type(" Version 3");
    await page.waitForTimeout(1200);

    // Verify current content
    let value = await editor.inputValue();
    expect(value).toContain("Version 1");
    expect(value).toContain("Version 2");
    expect(value).toContain("Version 3");

    // Click oldest snapshot - ПРОБЛЕМА: может не восстановиться
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    const count = await snapshotItems.count();
    await snapshotItems.nth(count - 1).click();
    await page.waitForTimeout(500);

    value = await editor.inputValue();
    expect(value).toBe("Version 1");
  });

  test("should handle multiple snapshot clicks in sequence", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    await editor.type(" C");
    await page.waitForTimeout(1200);

    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');

    // Click oldest - ПРОБЛЕМА: первый клик работает
    await snapshotItems.nth(2).click();
    await page.waitForTimeout(500);
    let value = await editor.inputValue();
    expect(value).toBe("A");

    // Click middle - ПРОБЛЕМА: последующие клики могут не работать
    await snapshotItems.nth(1).click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).toBe("A B");

    // Click newest - ПРОБЛЕМА: может не восстановиться
    await snapshotItems.nth(0).click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).toBe("A B C");
  });

  test("should highlight current snapshot in list", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("First");
    await page.waitForTimeout(1200);

    await editor.type(" Second");
    await page.waitForTimeout(1200);

    // Current snapshot should have badge
    const currentBadge = page.locator('[data-testid="snapshot-current-badge"]');
    await expect(currentBadge).toBeVisible();
    await expect(currentBadge).toHaveText("Current");
  });

  test("should update current snapshot indicator after navigation", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    await editor.type(" C");
    await page.waitForTimeout(1200);

    // Initially on last snapshot
    let currentBadge = page.locator('[data-testid="snapshot-current-badge"]');
    await expect(currentBadge).toBeVisible();

    // Click first snapshot
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    await snapshotItems.nth(2).click();
    await page.waitForTimeout(500);

    // Current badge should move
    currentBadge = page.locator('[data-testid="snapshot-current-badge"]');
    await expect(currentBadge).toBeVisible();
  });

  test("should handle undo navigation", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("First");
    await page.waitForTimeout(1200);

    await editor.type(" Second");
    await page.waitForTimeout(1200);

    await editor.type(" Third");
    await page.waitForTimeout(1200);

    // Click undo button
    const undoButton = page.locator('[data-testid="snapshot-undo-button"]');
    await undoButton.click();
    await page.waitForTimeout(500);

    let value = await editor.inputValue();
    expect(value).toContain("First");
    expect(value).toContain("Second");
    // Third should be undone
    expect(value).not.toContain("Third");
  });

  test("should handle redo navigation", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    // Undo
    const undoButton = page.locator('[data-testid="snapshot-undo-button"]');
    await undoButton.click();
    await page.waitForTimeout(500);

    // Redo - ПРОБЛЕМА: может не восстановиться
    const redoButton = page.locator('[data-testid="snapshot-redo-button"]');
    await redoButton.click();
    await page.waitForTimeout(500);

    const value = await editor.inputValue();
    expect(value).toBe("A B");
  });

  test("should handle multiple undo operations", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create multiple snapshots
    for (let i = 1; i <= 4; i++) {
      await editor.type(` ${i}`);
      await page.waitForTimeout(1200);
    }

    const undoButton = page.locator('[data-testid="snapshot-undo-button"]');

    // Multiple undo - ПРОБЛЕМА: может работать только первый раз
    await undoButton.click();
    await page.waitForTimeout(500);
    let value = await editor.inputValue();
    expect(value).not.toContain("4");

    await undoButton.click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).not.toContain("3");

    await undoButton.click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).not.toContain("2");
  });

  test("should handle undo-redo-undo sequence", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    const undoButton = page.locator('[data-testid="snapshot-undo-button"]');
    const redoButton = page.locator('[data-testid="snapshot-redo-button"]');

    // Undo
    await undoButton.click();
    await page.waitForTimeout(500);
    let value = await editor.inputValue();
    expect(value).toBe("A");

    // Redo - ПРОБЛЕМА: может не сработать
    await redoButton.click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).toBe("A B");

    // Undo again - ПРОБЛЕМА: может не сработать
    await undoButton.click();
    await page.waitForTimeout(500);
    value = await editor.inputValue();
    expect(value).toBe("A");
  });

  test("should disable undo when at first snapshot", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create single snapshot
    await editor.type("Only one");
    await page.waitForTimeout(1200);

    // Undo should be disabled
    const undoButton = page.locator('[data-testid="snapshot-undo-button"]');
    await expect(undoButton).toBeDisabled();
  });

  test("should disable redo when at last snapshot", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1200);

    await editor.type(" B");
    await page.waitForTimeout(1200);

    // Redo should be disabled (we're at latest)
    const redoButton = page.locator('[data-testid="snapshot-redo-button"]');
    await expect(redoButton).toBeDisabled();
  });

  test("should show snapshot delta information", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshot
    await editor.type("Some content");
    await page.waitForTimeout(1200);

    // Check delta is displayed
    const delta = page.locator('[data-testid^="snapshot-delta-"]');
    await expect(delta.first()).toBeVisible();
  });

  test("should show snapshot time information", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshot
    await editor.type("Content");
    await page.waitForTimeout(1200);

    // Check time is displayed
    const time = page.locator('[data-testid^="snapshot-time-"]');
    await expect(time.first()).toBeVisible();
  });
});
