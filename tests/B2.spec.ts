import { expect, test } from '@playwright/test'
import { dragScene, scene } from './helpers'

test.describe('B2: Select and move', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('tool-rectangle').click()
    await dragScene(page, [100, 100], [300, 200])
  })

  test('B2.1 click selects and shows outline; empty click clears', async ({ page }) => {
    await dragScene(page, [600, 500], [600, 500]) // empty click -> clear
    expect((await scene(page)).selection).toEqual([])

    await dragScene(page, [200, 150], [200, 150])
    const { elements, selection } = await scene(page)
    expect(selection).toEqual([elements[0].id])
    await expect(page.getByTestId(`selection-${elements[0].id}`)).toBeVisible()

    await dragScene(page, [600, 500], [600, 500])
    expect((await scene(page)).selection).toEqual([])
    await expect(page.getByTestId(`selection-${elements[0].id}`)).toHaveCount(0)
  })

  test('B2.2 dragging by (+50,+30) moves x,y exactly; size unchanged', async ({ page }) => {
    await dragScene(page, [200, 150], [250, 180])
    const { elements } = await scene(page)
    expect(elements[0]).toMatchObject({ x: 150, y: 130, width: 200, height: 100 })
    await expect(page.getByTestId(`element-${elements[0].id}`)).toHaveAttribute('data-x', '150')
  })

  test('ellipse is hit only inside its curve', async ({ page }) => {
    await page.getByTestId('tool-ellipse').click()
    await dragScene(page, [500, 300], [700, 400])
    await dragScene(page, [600, 500], [600, 500]) // clear
    await dragScene(page, [502, 302], [502, 302]) // bbox corner, outside ellipse
    expect((await scene(page)).selection).toEqual([])
    await dragScene(page, [600, 350], [600, 350]) // center
    expect((await scene(page)).selection).toHaveLength(1)
  })
})
