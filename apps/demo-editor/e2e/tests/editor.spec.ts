import { test, expect } from "@playwright/test";

/**
 * E2E tests for Editor text editing functionality
 */
test.describe("Editor - Text Editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should type text in editor", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type multiple lines
    await editor.type("Line 1");
    await page.keyboard.press("Enter");
    await editor.type("Line 2");
    await page.keyboard.press("Enter");
    await editor.type("Line 3");

    // Verify all lines are present
    const value = await editor.inputValue();
    expect(value).toContain("Line 1");
    expect(value).toContain("Line 2");
    expect(value).toContain("Line 3");
  });

  test("should paste text into editor", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Paste text using keyboard shortcut
    await page.keyboard.insertText("Pasted text from clipboard");

    // Verify text is present
    const value = await editor.inputValue();
    expect(value).toContain("Pasted text from clipboard");
  });

  test("should select text", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type text
    await editor.type("Select this text");

    // Select text using keyboard
    await page.keyboard.down("Shift");
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowLeft");
    }
    await page.keyboard.up("Shift");

    // Verify selection is made (selectionStart !== selectionEnd)
    const selectionStart = await editor.evaluate((el: HTMLTextAreaElement) => el.selectionStart);
    const selectionEnd = await editor.evaluate((el: HTMLTextAreaElement) => el.selectionEnd);
    expect(selectionStart).not.toEqual(selectionEnd);
  });

  test("should update cursor position", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type some text
    await editor.type("Hello");

    // Move cursor using arrow keys
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");

    // Cursor should be positioned correctly (verified by typing)
    await editor.type("X");

    // Verify the text contains the inserted character
    const value = await editor.inputValue();
    expect(value).toContain("HelXlo");
  });

  test("should handle undo/redo keyboard shortcuts", async ({ page }) => {
    const editor = page.locator("textarea");
    await editor.click();

    // Type text
    await editor.type("First line");
    await page.keyboard.press("Enter");
    await editor.type("Second line");

    // Undo (Ctrl/Cmd + Z)
    await page.keyboard.press("ControlOrMeta+Z");

    // Second line should be removed
    const valueAfterUndo = await editor.inputValue();
    expect(valueAfterUndo).not.toContain("Second line");

    // Redo (Ctrl/Cmd + Shift + Z or Ctrl + Y)
    await page.keyboard.press("ControlOrMeta+Shift+Z");

    // Second line should be back
    const valueAfterRedo = await editor.inputValue();
    expect(valueAfterRedo).toContain("Second line");
  });
});
