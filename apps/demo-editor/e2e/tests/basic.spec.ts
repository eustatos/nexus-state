import { test, expect } from "@playwright/test";

/**
 * Basic E2E tests for Editor Demo
 * Tests the core functionality of the editor application
 */
test.describe("Editor Demo - Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the application", async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Editor Demo/);

    // Check header is visible
    await expect(page.getByText("Editor Demo")).toBeVisible();

    // Check editor textarea is visible
    await expect(page.locator("textarea")).toBeVisible();

    // Check sidebar is visible - use heading
    await expect(page.getByRole("heading", { name: "Snapshots" })).toBeVisible();
  });

  test("should display toolbar buttons", async ({ page }) => {
    // Check toolbar buttons are visible
    await expect(page.getByTitle("Clear")).toBeVisible();
    await expect(page.getByTitle("Copy")).toBeVisible();
  });

  test("should allow typing in the editor", async ({ page }) => {
    // Find the textarea and type
    const editor = page.locator("textarea");
    await editor.click();
    await editor.type("Hello, World!");

    // Check the text is displayed
    await expect(editor).toHaveValue("Hello, World!");
  });

  test("should have placeholder text", async ({ page }) => {
    const editor = page.locator("textarea");
    await expect(editor).toHaveAttribute("placeholder", /Start typing/);
  });

  test("should apply dark theme", async ({ page }) => {
    // Check dark theme is applied to body
    const body = page.locator("body");
    await expect(body).toHaveCSS("background-color", "rgb(15, 23, 42)");
  });
});
