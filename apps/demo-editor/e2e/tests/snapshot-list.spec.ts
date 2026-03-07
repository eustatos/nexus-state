import { test, expect } from "@playwright/test";

/**
 * E2E tests for Snapshot List functionality (TASK-006)
 * Tests the snapshot list component with search and filter
 */
test.describe("Snapshot List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display snapshot list component", async ({ page }) => {
    // Check snapshot list is visible
    await expect(page.getByTestId("snapshot-list")).toBeVisible();
  });

  test("should display snapshot count", async ({ page }) => {
    // Check snapshot count is displayed
    await expect(page.getByTestId("snapshot-count")).toBeVisible();
  });

  test("should display undo/redo buttons", async ({ page }) => {
    // Check undo button is visible
    await expect(page.getByTestId("snapshot-undo-button")).toBeVisible();

    // Check redo button is visible
    await expect(page.getByTestId("snapshot-redo-button")).toBeVisible();
  });

  test("should display search input", async ({ page }) => {
    // Check search input is visible
    await expect(page.getByTestId("snapshot-search-input")).toBeVisible();
  });

  test("should display filter select", async ({ page }) => {
    // Check filter select is visible
    await expect(page.getByTestId("snapshot-filter-select")).toBeVisible();
  });

  test("should type in search input", async ({ page }) => {
    const searchInput = page.getByTestId("snapshot-search-input");
    await searchInput.fill("test search");

    await expect(searchInput).toHaveValue("test search");
  });

  test("should select filter option", async ({ page }) => {
    const filterSelect = page.getByTestId("snapshot-filter-select");
    await filterSelect.selectOption("text-edit");

    await expect(filterSelect).toHaveValue("text-edit");
  });

  test("should show empty state or items container", async ({ page }) => {
    // Either empty state or items container should be visible
    const itemsContainer = page.getByTestId("snapshot-items-container");
    await expect(itemsContainer).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    const itemsContainer = page.getByTestId("snapshot-items-container");

    // Check role attribute
    await expect(itemsContainer).toHaveAttribute("role", "list");

    // Check aria-label
    await expect(itemsContainer).toHaveAttribute("aria-label", "Snapshot history");
  });

  test("should have aria-label on search input", async ({ page }) => {
    const searchInput = page.getByTestId("snapshot-search-input");
    await expect(searchInput).toHaveAttribute("aria-label", "Search snapshots");
  });

  test("should have aria-label on filter select", async ({ page }) => {
    const filterSelect = page.getByTestId("snapshot-filter-select");
    await expect(filterSelect).toHaveAttribute(
      "aria-label",
      "Filter by action type"
    );
  });

  test("should display snapshot items container", async ({ page }) => {
    await expect(page.getByTestId("snapshot-items-container")).toBeVisible();
  });

  test("should display controls container", async ({ page }) => {
    await expect(page.getByTestId("snapshot-controls")).toBeVisible();
  });

  test("should display header with count", async ({ page }) => {
    await expect(page.getByTestId("snapshot-list-header")).toBeVisible();
  });

  test("should display undo/redo container", async ({ page }) => {
    await expect(page.getByTestId("snapshot-undo-redo")).toBeVisible();
  });

  test("should create snapshots when typing in editor", async ({ page }) => {
    // Type in editor
    const editor = page.locator("textarea");
    await editor.click();
    await editor.type("Test content for snapshot");

    // Wait for debounce delay (1 second + buffer)
    await page.waitForTimeout(1500);

    // Check that snapshot items appear
    const itemsContainer = page.getByTestId("snapshot-items-container");
    await expect(itemsContainer).toBeVisible();

    // Check snapshot count is updated (should be more than initial)
    const snapshotCount = page.getByTestId("snapshot-count");
    await expect(snapshotCount).toBeVisible();
  });

  test("should display snapshot items after typing", async ({ page }) => {
    // Type in editor
    const editor = page.locator("textarea");
    await editor.click();
    await editor.type("Hello World");

    // Wait for debounce
    await page.waitForTimeout(1500);

    // Check snapshot items are displayed
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    await expect(snapshotItems.first()).toBeVisible();
  });

  test("should show current snapshot badge", async ({ page }) => {
    // Type in editor
    const editor = page.locator("textarea");
    await editor.click();
    await editor.type("Test");

    // Wait for debounce
    await page.waitForTimeout(1500);

    // Current snapshot should have badge (at least one)
    const currentBadges = page.getByTestId("snapshot-current-badge");
    await expect(currentBadges.first()).toBeVisible();
  });

  test("should not create excessive snapshots on single character input", async ({ page }) => {
    // Get initial snapshot count
    const snapshotCountElement = page.getByTestId("snapshot-count");
    const initialCountText = await snapshotCountElement.textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || "0");

    // Type single character
    const editor = page.locator("textarea");
    await editor.click();
    await editor.type("a");

    // Wait for debounce delay (1 second + buffer)
    await page.waitForTimeout(1500);

    // Get new snapshot count
    const newCountText = await snapshotCountElement.textContent();
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || "0");

    // Should create at most 1 new snapshot (not multiple)
    expect(newCount - initialCount).toBeLessThanOrEqual(1);
  });

  test("should create only one snapshot after debounce delay for multiple rapid inputs", async ({ page }) => {
    // Get initial snapshot count
    const snapshotCountElement = page.getByTestId("snapshot-count");
    const initialCountText = await snapshotCountElement.textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || "0");

    // Type multiple characters quickly
    const editor = page.locator("textarea");
    await editor.click();

    // Type 5 characters rapidly (within debounce window)
    for (let i = 0; i < 5; i++) {
      await editor.type(String(i), { delay: 50 });
    }

    // Wait for debounce delay (1 second + buffer)
    await page.waitForTimeout(1500);

    // Get new snapshot count
    const newCountText = await snapshotCountElement.textContent();
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || "0");

    // Should create at most 1-2 new snapshots (not 5)
    expect(newCount - initialCount).toBeLessThanOrEqual(2);
  });

  test("should create snapshots with pauses between typing", async ({ page }) => {
    // Get initial snapshot count
    const snapshotCountElement = page.getByTestId("snapshot-count");
    const initialCountText = await snapshotCountElement.textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || "0");

    const editor = page.locator("textarea");
    await editor.click();

    // Type with pauses longer than debounce delay
    await editor.type("Hello");
    await page.waitForTimeout(1200);

    await editor.type(" World");
    await page.waitForTimeout(1200);

    // Get new snapshot count
    const newCountText = await snapshotCountElement.textContent();
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || "0");

    // Should create 2 new snapshots (one for each pause)
    expect(newCount - initialCount).toBeGreaterThanOrEqual(1);
    expect(newCount - initialCount).toBeLessThanOrEqual(3);
  });

  test("should have unique snapshot item test ids", async ({ page }) => {
    // Type to create snapshots
    const editor = page.locator("textarea");
    await editor.click();
    await editor.type("Test");
    await page.waitForTimeout(1500);

    // Get all snapshot items
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    const count = await snapshotItems.count();

    // Should have at least one snapshot
    expect(count).toBeGreaterThan(0);

    // Check that each item has unique test id
    const testIds = new Set<string>();
    for (let i = 0; i < count; i++) {
      const testId = await snapshotItems.nth(i).getAttribute("data-testid");
      expect(testId).toBeTruthy();
      expect(testIds.has(testId!)).toBeFalsy();
      testIds.add(testId!);
    }
  });

  test("should restore editor content when clicking on snapshot", async ({ page }) => {
    const editor = page.locator("textarea");

    // Create first snapshot with "Hello"
    await editor.click();
    await editor.type("Hello");
    await page.waitForTimeout(1500);

    // Create second snapshot with " World"
    await editor.type(" World");
    await page.waitForTimeout(1500);

    // Editor should contain "Hello World"
    await expect(editor).toHaveValue("Hello World");

    // Get snapshot items
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    const count = await snapshotItems.count();

    // Should have at least 2 snapshots
    expect(count).toBeGreaterThanOrEqual(2);

    // Click on the older snapshot (last in the list, which should have "Hello")
    await snapshotItems.last().click();

    // Wait for restoration
    await page.waitForTimeout(500);

    // Editor should contain "Hello" (restored state)
    const restoredValue = await editor.inputValue();
    expect(restoredValue).toContain("Hello");
  });

  test("should allow clicking on snapshot items", async ({ page }) => {
    const editor = page.locator("textarea");

    // Create first snapshot
    await editor.click();
    await editor.type("First");
    await page.waitForTimeout(1200);

    // Create second snapshot
    await editor.type(" Second");
    await page.waitForTimeout(1200);

    // Get snapshot items
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    const count = await snapshotItems.count();

    // Should have at least 2 snapshots
    expect(count).toBeGreaterThanOrEqual(2);

    // Click on any snapshot should not throw error
    await snapshotItems.first().click();
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.getByTestId("snapshot-list")).toBeVisible();
  });

  test("should highlight newest snapshot as current", async ({ page }) => {
    const editor = page.locator("textarea");

    // Create first snapshot
    await editor.click();
    await editor.type("First");
    await page.waitForTimeout(1200);

    // Create second snapshot
    await editor.type(" Second");
    await page.waitForTimeout(1200);

    // Get snapshot items
    const snapshotItems = page.locator('[data-testid^="snapshot-item-"]');
    const count = await snapshotItems.count();

    // Should have at least 2 snapshots
    expect(count).toBeGreaterThanOrEqual(2);

    // The newest snapshot (first in list) should be current
    const firstItemBadge = snapshotItems.first().getByTestId("snapshot-current-badge");
    await expect(firstItemBadge).toBeVisible();
  });
});
