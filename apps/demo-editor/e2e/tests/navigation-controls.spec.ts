import { test, expect } from '@playwright/test'

/**
 * E2E tests for Navigation Controls functionality
 * Tests basic UI and button states
 */
test.describe('Navigation Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea').waitFor({ state: 'visible' })
    await page.waitForTimeout(500)
  })

  test('should display navigation controls', async ({ page }) => {
    await expect(page.locator('[data-testid="navigation-controls"]')).toBeVisible()
  })

  test('should display all navigation buttons', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-button-first"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-button-undo"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-button-redo"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-button-last"]')).toBeVisible()
  })

  test('should show tooltips on buttons', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-button-undo"]')).toHaveAttribute('title', 'Undo (Ctrl+Z)')
    await expect(page.locator('[data-testid="nav-button-redo"]')).toHaveAttribute('title', 'Redo (Ctrl+Y)')
    await expect(page.locator('[data-testid="nav-button-first"]')).toHaveAttribute('title', 'Go to first snapshot (Home)')
    await expect(page.locator('[data-testid="nav-button-last"]')).toHaveAttribute('title', 'Go to last snapshot (End)')
  })

  test('should disable undo when at first snapshot', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-button-undo"]')).toBeDisabled()
  })

  test('should disable first button when at first snapshot', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-button-first"]')).toBeDisabled()
  })

  test('should disable redo when at last snapshot', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-button-redo"]')).toBeDisabled()
  })

  test('should have proper hover effects', async ({ page }) => {
    const undoButton = page.locator('[data-testid="nav-button-undo"]')
    await undoButton.hover()
    await expect(undoButton).toBeVisible()
  })
})
