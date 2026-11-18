import { expect, test } from '@playwright/test'
import { byType, dragScene, drawArrow, drawShape, scene } from './helpers'

const click = (page: any, x: number, y: number) => dragScene(page, [x, y], [x, y])

test.describe('B6: Delete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await drawShape(page, 'rectangle', [100, 100], [200, 200]) // A
    await drawShape(page, 'rectangle', [300, 100], [400, 200]) // B
    await drawShape(page, 'ellipse', [600, 500], [700, 600]) // C
    await click(page, 900, 700)
  })

  for (const key of ['Delete', 'Backspace']) {
    test(`B6.1 ${key} removes all selected elements`, async ({ page }) => {
      const [A, B, C] = (await scene(page)).elements.map((e: any) => e.id)
      await click(page, 150, 150)
      await page.keyboard.down('Shift')
      await click(page, 350, 150)
      await page.keyboard.up('Shift')
      await page.keyboard.press(key)
      const s = await scene(page)
      expect(s.elements.map((e: any) => e.id)).toEqual([C])
      expect(s.selection).toEqual([])
      expect([A, B]).not.toContain(s.elements[0].id)
    })
  }

  test('B6.2 unselected elements are not affected', async ({ page }) => {
    const before = (await scene(page)).elements
    await click(page, 150, 150)
    await page.keyboard.press('Delete')
    expect((await scene(page)).elements).toEqual(before.slice(1))
  })

  test('B6.2 deleting with nothing selected does nothing', async ({ page }) => {
    const before = (await scene(page)).elements
    await page.keyboard.press('Delete')
    expect((await scene(page)).elements).toEqual(before)
  })

  test('B6.2 arrows attached to a deleted shape stay, unbound', async ({ page }) => {
    await drawArrow(page, [150, 150], [500, 400])
    const arrow = byType(await scene(page), 'arrow')[0]
    await click(page, 120, 180)
    await page.keyboard.press('Delete')
    const after = byType(await scene(page), 'arrow')[0]
    expect(after).toMatchObject({ start: arrow.start, end: arrow.end, startBinding: null })
  })
})
