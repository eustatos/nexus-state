import { test, expect } from "@playwright/test";

/**
 * E2E tests for Editor State Restoration issues
 * Reproduces the specific issues reported by users
 */
test.describe("Editor State Restoration - Bug Reproduction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("BUG: Timeline empty - no snapshot points displayed", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type content to create snapshots
    await editor.type("First snapshot content");
    await page.waitForTimeout(1500);

    await editor.type(" Second snapshot");
    await page.waitForTimeout(1500);

    await editor.type(" Third snapshot");
    await page.waitForTimeout(1500);

    // ПРОБЛЕМА: Timeline может быть пустым
    const timelinePoints = page.locator('[data-testid^="timeline-slider-point-"]');
    
    // Should have at least 3 points
    await expect(timelinePoints).toHaveCount(3);
    
    // If this fails, timeline is not displaying snapshots
    const count = await timelinePoints.count();
    console.log(`Timeline points count: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test("BUG: Timeline click doesn't restore editor content", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots with distinct content
    await editor.type("AAA");
    await page.waitForTimeout(1500);

    await editor.type(" BBB");
    await page.waitForTimeout(1500);

    await editor.type(" CCC");
    await page.waitForTimeout(1500);

    // Verify current content
    let currentValue = await editor.inputValue();
    console.log(`Current value before click: ${currentValue}`);
    expect(currentValue).toBe("AAA BBB CCC");

    // Click first timeline point
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.waitForTimeout(1000);

    // ПРОБЛЕМА: Content may not restore
    currentValue = await editor.inputValue();
    console.log(`Current value after click: ${currentValue}`);
    expect(currentValue).toBe("AAA");
  });

  test("BUG: Sidebar snapshot clicks only work once", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("Version 1");
    await page.waitForTimeout(1500);

    await editor.type(" Version 2");
    await page.waitForTimeout(1500);

    await editor.type(" Version 3");
    await page.waitForTimeout(1500);

    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    const count = await snapshotItems.count();
    console.log(`Snapshot items count: ${count}`);

    // First click - should work
    await snapshotItems.nth(count - 1).click(); // Oldest
    await page.waitForTimeout(1000);
    let value = await editor.inputValue();
    console.log(`After first click: ${value}`);
    expect(value).toBe("Version 1");

    // Second click - ПРОБЛЕМА: может не сработать
    await snapshotItems.nth(count - 2).click(); // Middle
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After second click: ${value}`);
    expect(value).toBe("Version 1 Version 2");

    // Third click - ПРОБЛЕМА: может не сработать
    await snapshotItems.nth(0).click(); // Newest
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After third click: ${value}`);
    expect(value).toBe("Version 1 Version 2 Version 3");
  });

  test("BUG: Undo/Redo only works once", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("Step 1");
    await page.waitForTimeout(1500);

    await editor.type(" Step 2");
    await page.waitForTimeout(1500);

    await editor.type(" Step 3");
    await page.waitForTimeout(1500);

    const undoButton = page.locator('[data-testid="snapshot-undo-button"]');
    const redoButton = page.locator('[data-testid="snapshot-redo-button"]');

    // First undo - should work
    await undoButton.click();
    await page.waitForTimeout(1000);
    let value = await editor.inputValue();
    console.log(`After first undo: ${value}`);
    expect(value).toBe("Step 1 Step 2");

    // Second undo - ПРОБЛЕМА: может не сработать
    await undoButton.click();
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After second undo: ${value}`);
    expect(value).toBe("Step 1");

    // First redo - should work
    await redoButton.click();
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After first redo: ${value}`);
    expect(value).toBe("Step 1 Step 2");

    // Second redo - ПРОБЛЕМА: может не сработать
    await redoButton.click();
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After second redo: ${value}`);
    expect(value).toBe("Step 1 Step 2 Step 3");
  });

  test("BUG: State not restored after jumping to last snapshot", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("A");
    await page.waitForTimeout(1500);

    await editor.type(" B");
    await page.waitForTimeout(1500);

    // Currently at last snapshot
    let value = await editor.inputValue();
    expect(value).toBe("A B");

    // Jump to first
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After jump to first: ${value}`);
    expect(value).toBe("A");

    // Jump back to last - ПРОБЛЕМА: состояние может не восстановиться
    await page.locator('[data-testid="timeline-slider-point-1"]').click();
    await page.waitForTimeout(1000);
    value = await editor.inputValue();
    console.log(`After jump to last: ${value}`);
    expect(value).toBe("A B");
  });

  test("BUG: Multiple rapid navigation doesn't update state", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create snapshots
    await editor.type("1");
    await page.waitForTimeout(1500);

    await editor.type(" 2");
    await page.waitForTimeout(1500);

    await editor.type(" 3");
    await page.waitForTimeout(1500);

    await editor.type(" 4");
    await page.waitForTimeout(1500);

    // Rapid navigation - ПРОБЛЕМА: state may not update properly
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.locator('[data-testid="timeline-slider-point-3"]').click();
    await page.locator('[data-testid="timeline-slider-point-1"]').click();

    await page.waitForTimeout(1000);

    const value = await editor.inputValue();
    console.log(`After rapid navigation: ${value}`);
    // Should be at point-1 = "1 2"
    expect(value).toBe("1 2");
  });

  test("BUG: Editor doesn't reflect snapshot content after navigation", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Create distinct snapshots
    await editor.type("Hello");
    await page.waitForTimeout(1500);

    await editor.type(" World");
    await page.waitForTimeout(1500);

    await editor.type("!");
    await page.waitForTimeout(1500);

    // Navigate to first
    await page.locator('[data-testid="timeline-slider-point-0"]').click();
    await page.waitForTimeout(1000);

    // ПРОБЛЕМА: Editor value may not match snapshot
    const editorValue = await editor.inputValue();
    const expectedValue = "Hello";
    
    console.log(`Editor value: ${editorValue}`);
    console.log(`Expected value: ${expectedValue}`);
    
    expect(editorValue).toBe(expectedValue);

    // Also check via snapshot item
    const snapshotActions = page.locator('[data-testid^="snapshot-action-"]');
    const firstAction = await snapshotActions.first().textContent();
    console.log(`First snapshot action: ${firstAction}`);
  });
});
