import { expect, test } from '@playwright/test'
import { dragScene, scene } from './helpers'

const BOX = { x: 100, y: 100, width: 200, height: 100 }

test.describe('B1: Create shapes', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })

  test('B1.1 rectangle from (100,100) to (300,200)', async ({ page }) => {
    await page.getByTestId('tool-rectangle').click()
    await dragScene(page, [100, 100], [300, 200])
    const { elements } = await scene(page)
    expect(elements).toHaveLength(1)
    expect(elements[0]).toMatchObject({ type: 'rectangle', ...BOX })
    await expect(page.getByTestId(`element-${elements[0].id}`)).toHaveAttribute('data-width', '200')
  })

  test('B1.2 ellipse has the same bounding box', async ({ page }) => {
    await page.getByTestId('tool-ellipse').click()
    await dragScene(page, [100, 100], [300, 200])
    const { elements } = await scene(page)
    expect(elements[0]).toMatchObject({ type: 'ellipse', ...BOX })
  })

  test('B1.3 dragging up-left normalizes the box', async ({ page }) => {
    await page.getByTestId('tool-rectangle').click()
    await dragScene(page, [300, 200], [100, 100])
    const { elements } = await scene(page)
    expect(elements[0]).toMatchObject({ type: 'rectangle', ...BOX })
  })

  test('B1.4 tool returns to Select after creating a shape', async ({ page }) => {
    await page.getByTestId('tool-rectangle').click()
    await dragScene(page, [100, 100], [300, 200])
    const { tool } = await scene(page)
    expect(tool).toBe('select')
  })
})
