import { expect, test, type Page } from '@playwright/test'
import { byType, dragScene, drawArrow, drawShape, scene } from './helpers'

const click = (page: Page, x: number, y: number) => dragScene(page, [x, y], [x, y])
const count = async (page: Page) => (await scene(page)).elements.length
const undo = (page: Page) => page.keyboard.press('Control+z')
const redo = (page: Page) => page.keyboard.press('Control+Shift+z')

test.describe('B7: Undo and redo', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })

  test('B7.1 undo create, move, delete and connect', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawArrow(page, [150, 150], [500, 400]) // connect
    expect(await count(page)).toBe(2)
    await undo(page) // arrow
    expect(await count(page)).toBe(1)

    await dragScene(page, [200, 150], [250, 180]) // move
    expect((await scene(page)).elements[0]).toMatchObject({ x: 150, y: 130 })
    await undo(page)
    expect((await scene(page)).elements[0]).toMatchObject({ x: 100, y: 100 })

    await page.keyboard.press('Delete') // shape is still selected
    expect(await count(page)).toBe(0)
    await undo(page)
    expect(await count(page)).toBe(1)

    await undo(page) // create
    expect(await count(page)).toBe(0)
    await undo(page) // nothing left: no-op
    expect(await count(page)).toBe(0)
  })

  test('B7.1 undoing a delete restores the arrow binding', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawArrow(page, [150, 150], [500, 400])
    const before = byType(await scene(page), 'arrow')[0]
    await click(page, 120, 180)
    await page.keyboard.press('Delete')
    await undo(page)
    expect(byType(await scene(page), 'arrow')[0]).toEqual(before)
  })

  test('B7.2 Ctrl+Shift+Z redoes', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await undo(page)
    expect(await count(page)).toBe(0)
    await redo(page)
    expect(await count(page)).toBe(1)
    await redo(page) // nothing to redo: no-op
    expect(await count(page)).toBe(1)
  })

  test('B7.3 a drag is one undo step', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    const r = (await page.getByTestId('canvas').boundingBox())!
    await page.mouse.move(r.x + 200, r.y + 150)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) await page.mouse.move(r.x + 200 + i * 5, r.y + 150 + i * 2)
    await page.mouse.up()
    expect((await scene(page)).elements[0]).toMatchObject({ x: 200, y: 140 })
    await undo(page)
    expect((await scene(page)).elements[0]).toMatchObject({ x: 100, y: 100 })
    await redo(page)
    expect((await scene(page)).elements[0]).toMatchObject({ x: 200, y: 140 })
  })

  test('B7.3 a plain click is not a history step', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await click(page, 200, 150)
    await undo(page)
    expect(await count(page)).toBe(0)
  })

  test('B7.4 a new action after undo clears redo', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [200, 200])
    await drawShape(page, 'rectangle', [300, 100], [400, 200])
    await undo(page)
    expect(await count(page)).toBe(1)
    await drawShape(page, 'ellipse', [500, 300], [600, 400])
    expect(await count(page)).toBe(2)
    await redo(page)
    expect(await count(page)).toBe(2)
    expect(byType(await scene(page), 'ellipse')).toHaveLength(1)
  })

  test('B7.5 undo and redo do not change zoom or pan', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    const r = (await page.getByTestId('canvas').boundingBox())!
    await page.mouse.move(r.x + 300, r.y + 300)
    await page.keyboard.down('Control')
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -100)
    await page.keyboard.up('Control')
    await page.mouse.wheel(0, 80)
    const view = async () => { const s = await scene(page); return { zoom: s.zoom, scroll: s.scroll } }
    const before = await view()
    expect(before.zoom).not.toBe(1)
    await undo(page)
    expect(await view()).toEqual(before)
    await redo(page)
    expect(await view()).toEqual(before)
  })
})
