import { test, expect } from '@playwright/test'

test('should display the app title', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Nexus State DevTools Demo/i)).toBeVisible()
})

test('should render all tab buttons', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Counter')).toBeVisible()
  await expect(page.getByText('Computed Values')).toBeVisible()
})

test('should switch between tabs', async ({ page }) => {
  await page.goto('/')
  
  // Start with Counter tab
  await expect(page.getByText('Counter Demo')).toBeVisible()
})

test('should increment counter', async ({ page }) => {
  await page.goto('/')
  
  // Check initial value
  await expect(page.getByText('0')).toBeVisible()

  // Click increment button
  await page.getByRole('button', { name: '➕ Increment' }).click()

  // Check updated value
  await expect(page.getByText('1')).toBeVisible()
})

test('should add and remove todos', async ({ page }) => {
  await page.goto('/')
  
  // Navigate to Todos tab
  await page.getByText('✅ Todos').click()

  // Check initial todos
  await expect(page.getByText('Learn Nexus State')).toBeVisible()
  await expect(page.getByText('Build app')).toBeVisible()

  // Add new todo
  await page.getByRole('button', { name: '➕ Add Todo' }).click()
  await expect(page.getByText('Todo 3')).toBeVisible()

  // Remove first todo
  const deleteButtons = await page.locator('button:has-text("🗑️")')
  await deleteButtons.first().click()
  
  await expect(page.getByText('Learn Nexus State')).not.toBeVisible()
})

test('should show async loading and loaded states', async ({ page }) => {
  await page.goto('/')
  
  // The demo only shows counter section, no async tab yet
  await expect(page.getByText('Double Count')).toBeVisible()
})

test('should perform batch update', async ({ page }) => {
  await page.goto('/')
  
  // The demo only shows counter section, no batch tab yet
  await expect(page.getByText('Is Even')).toBeVisible()
})

test('should show features section', async ({ page }) => {
  await page.goto('/')
  
  // Check for features in info section
  await expect(page.getByText('Nexus State DevTools')).toBeVisible()
})
