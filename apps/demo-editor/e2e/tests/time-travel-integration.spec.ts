/**
 * E2E tests for time-travel editor integration
 * 
 * Tests that verify editor content updates when jumping to snapshots
 */

import { test, expect } from '@playwright/test'

test.describe('Time-Travel Editor Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should update editor content when clicking snapshot in list', async ({ page }) => {
    // Wait for editor to load
    const editor = page.getByTestId('editor')
    await expect(editor).toBeVisible()

    // Type initial content
    await editor.fill('Initial content')
    
    // Wait for debounce snapshot (1 second)
    await page.waitForTimeout(1100)

    // Type more content
    await editor.fill('Modified content')
    
    // Wait for another snapshot
    await page.waitForTimeout(1100)

    // Verify current content
    await expect(editor).toHaveValue('Modified content')

    // Open snapshot list and click on first snapshot
    const snapshotItems = page.getByTestId('snapshot-item')
    const firstSnapshot = snapshotItems.first()
    await firstSnapshot.click()

    // Editor should update to initial content
    await expect(editor).toHaveValue('Initial content', { timeout: 2000 })
  })

  test('should update editor when using undo/redo buttons', async ({ page }) => {
    const editor = page.getByTestId('editor')
    await expect(editor).toBeVisible()

    // Type initial content
    await editor.fill('Before')
    await page.waitForTimeout(1100)

    // Type modified content
    await editor.fill('After')
    await page.waitForTimeout(1100)

    // Verify current content
    await expect(editor).toHaveValue('After')

    // Click undo button in snapshot list
    const undoButton = page.getByTestId('snapshot-undo-button')
    await undoButton.click()

    // Editor should show previous content
    await expect(editor).toHaveValue('Before', { timeout: 2000 })

    // Click redo button
    const redoButton = page.getByTestId('snapshot-redo-button')
    await redoButton.click()

    // Editor should show "After" content
    await expect(editor).toHaveValue('After', { timeout: 2000 })
  })

  test('should update editor when using timeline slider', async ({ page }) => {
    const editor = page.getByTestId('editor')
    await expect(editor).toBeVisible()

    // Create multiple snapshots
    await editor.fill('State 1')
    await page.waitForTimeout(1100)

    await editor.fill('State 2')
    await page.waitForTimeout(1100)

    await editor.fill('State 3')
    await page.waitForTimeout(1100)

    // Verify current content
    await expect(editor).toHaveValue('State 3')

    // Use timeline slider to jump to earlier state
    const timelineSlider = page.getByTestId('timeline-slider')
    await expect(timelineSlider).toBeVisible()
    
    // Click on left side of timeline (earlier snapshots)
    const timelineBox = await timelineSlider.boundingBox()
    if (timelineBox) {
      await page.mouse.click(
        timelineBox.x + timelineBox.width * 0.1,
        timelineBox.y + timelineBox.height / 2
      )
    }

    // Editor should update to earlier content
    await expect(editor).toHaveValue(/State [12]/, { timeout: 2000 })
  })

  test('should update header snapshot count on navigation', async ({ page }) => {
    const editor = page.getByTestId('editor')
    await expect(editor).toBeVisible()

    // Create snapshots
    await editor.fill('Content 1')
    await page.waitForTimeout(1100)

    await editor.fill('Content 2')
    await page.waitForTimeout(1100)

    // Check snapshot count in header
    const snapshotCount = page.getByTestId('header-snapshot-count')
    await expect(snapshotCount).toContainText('Snapshots: 2')

    // Click on first snapshot
    const snapshotItems = page.getByTestId('snapshot-item')
    await snapshotItems.first().click()

    // Snapshot count should still be correct
    await expect(snapshotCount).toContainText('Snapshots: 2')
  })
})
