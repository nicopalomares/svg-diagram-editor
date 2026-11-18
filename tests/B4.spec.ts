import { expect, test, type Page } from '@playwright/test'
import { drawShape, scene } from './helpers'

const canvasBox = async (page: Page) => (await page.getByTestId('canvas').boundingBox())!

async function ctrlWheel(page: Page, at: [number, number], deltaY: number, times = 1) {
  const r = await canvasBox(page)
  await page.mouse.move(r.x + at[0], r.y + at[1])
  await page.keyboard.down('Control')
  for (let i = 0; i < times; i++) await page.mouse.wheel(0, deltaY)
  await page.keyboard.up('Control')
}

const sceneUnder = async (page: Page, sx: number, sy: number) => {
  const { zoom, scroll } = await scene(page)
  return { x: sx / zoom + scroll.x, y: sy / zoom + scroll.y }
}

test.describe('B4: Zoom and pan', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })

  test('B4.1 Ctrl + wheel up zooms in, wheel down zooms out', async ({ page }) => {
    await ctrlWheel(page, [400, 300], -100)
    expect((await scene(page)).zoom).toBeGreaterThan(1)
    await ctrlWheel(page, [400, 300], 100, 2)
    expect((await scene(page)).zoom).toBeLessThan(1)
  })

  test('B4.1b wheel without Ctrl never changes zoom', async ({ page }) => {
    const r = await canvasBox(page)
    await page.mouse.move(r.x + 400, r.y + 300)
    await page.mouse.wheel(0, -300)
    await page.mouse.wheel(0, 300)
    expect((await scene(page)).zoom).toBe(1)
  })

  test('B4.1c zoom is anchored on the cursor', async ({ page }) => {
    await ctrlWheel(page, [250, 180], -100, 3)
    const before = await sceneUnder(page, 250, 180)
    await ctrlWheel(page, [250, 180], -100, 4)
    const after = await sceneUnder(page, 250, 180)
    expect((await scene(page)).zoom).toBeGreaterThan(1.3)
    expect(after.x).toBeCloseTo(before.x, 6)
    expect(after.y).toBeCloseTo(before.y, 6)
  })

  test('B4.2 zoom percentage in the bottom-left, starts at 100%', async ({ page }) => {
    const ind = page.getByTestId('zoom-indicator')
    await expect(ind).toHaveText('100%')
    const box = (await ind.boundingBox())!
    const vp = page.viewportSize()!
    expect(box.x).toBeLessThan(vp.width / 4)
    expect(box.y).toBeGreaterThan(vp.height * 0.75)
    await ctrlWheel(page, [400, 300], -100, 10)
    await expect(ind).toHaveText('200%')
    await ctrlWheel(page, [400, 300], 100, 5)
    await expect(ind).toHaveText('150%')
  })

  test('B4.3 wheel scrolls vertically without zooming', async ({ page }) => {
    const r = await canvasBox(page)
    await page.mouse.move(r.x + 400, r.y + 300)
    await page.mouse.wheel(0, 120)
    let s = await scene(page)
    expect(s.scroll).toEqual({ x: 0, y: 120 })
    expect(s.zoom).toBe(1)
    await page.mouse.wheel(0, -50)
    s = await scene(page)
    expect(s.scroll).toEqual({ x: 0, y: 70 })
  })

  test('B4.3b Space + wheel scrolls horizontally', async ({ page }) => {
    const r = await canvasBox(page)
    await page.mouse.move(r.x + 400, r.y + 300)
    await page.keyboard.down('Space')
    await page.mouse.wheel(0, 100)
    await page.mouse.wheel(0, -30)
    await page.keyboard.up('Space')
    const s = await scene(page)
    expect(s.scroll).toEqual({ x: 70, y: 0 })
    expect(s.zoom).toBe(1)
  })

  test('B4.3d Shift + wheel scrolls vertically', async ({ page }) => {
    const r = await canvasBox(page)
    await page.mouse.move(r.x + 400, r.y + 300)
    await page.keyboard.down('Shift')
    await page.mouse.wheel(0, 100)
    await page.keyboard.up('Shift')
    const s = await scene(page)
    expect(s.scroll).toEqual({ x: 0, y: 100 })
    expect(s.zoom).toBe(1)
  })

  test('B4.3c Space + drag pans by exactly the drag distance', async ({ page }) => {
    const r = await canvasBox(page)
    await page.keyboard.down('Space')
    await page.mouse.move(r.x + 300, r.y + 300)
    await page.mouse.down()
    await page.mouse.move(r.x + 340, r.y + 280)
    await page.mouse.move(r.x + 380, r.y + 350)
    await page.mouse.up()
    await page.keyboard.up('Space')
    // Dragging right/down drags the content right/down: the view scrolls the other way.
    expect((await scene(page)).scroll).toEqual({ x: -80, y: -50 })
  })

  test('B4.4 shapes keep scene coordinates when zooming or panning', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    const before = (await scene(page)).elements
    await ctrlWheel(page, [200, 150], -100, 5)
    const r = await canvasBox(page)
    await page.mouse.wheel(0, 90)
    await page.keyboard.down('Space')
    await page.mouse.move(r.x + 600, r.y + 500)
    await page.mouse.down()
    await page.mouse.move(r.x + 650, r.y + 480)
    await page.mouse.up()
    await page.keyboard.up('Space')
    expect((await scene(page)).elements).toEqual(before)
  })

  test('B4.5 at 200%, a 100 px screen drag moves a shape 50 scene units', async ({ page }) => {
    await ctrlWheel(page, [0, 0], -100, 10)
    expect((await scene(page)).zoom).toBe(2)
    const r = await canvasBox(page)
    // Create: screen drag (200,200)->(600,400) = scene (100,100)->(300,200) with scroll at origin
    await page.getByTestId('tool-rectangle').click()
    await page.mouse.move(r.x + 200, r.y + 200)
    await page.mouse.down()
    await page.mouse.move(r.x + 400, r.y + 300)
    await page.mouse.move(r.x + 600, r.y + 400)
    await page.mouse.up()
    const s1 = (await scene(page)).elements[0]
    expect(s1).toMatchObject({ x: 100, y: 100, width: 200, height: 100 })
    // Move: 100 px screen drag
    await page.mouse.move(r.x + 400, r.y + 300)
    await page.mouse.down()
    await page.mouse.move(r.x + 450, r.y + 300)
    await page.mouse.move(r.x + 500, r.y + 300)
    await page.mouse.up()
    expect((await scene(page)).elements[0]).toMatchObject({ x: 150, y: 100, width: 200, height: 100 })
  })
})
