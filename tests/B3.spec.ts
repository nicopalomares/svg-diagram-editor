import { expect, test } from '@playwright/test'
import { byType, dragScene, drawArrow, drawShape, scene } from './helpers'

const pt = (x: number, y: number) => ({ x, y })

test.describe('B3: Arrows attached to shapes', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })

  test('B3.1 no visual indicator while dragging an arrow over a shape', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    const before = await page.getByTestId('canvas').innerHTML()
    await page.getByTestId('tool-arrow').click()
    const r = (await page.getByTestId('canvas').boundingBox())!
    await page.mouse.move(r.x + 500, r.y + 400)
    await page.mouse.down()
    await page.mouse.move(r.x + 200, r.y + 150)
    const during = await page.getByTestId('canvas').innerHTML()
    await page.mouse.up()
    // Only the draft arrow was added; the shape markup is untouched and nothing is highlighted.
    const rect = page.locator('[data-type="rectangle"] rect')
    await expect(rect).toHaveAttribute('stroke', '#1e1e1e')
    expect(during.replace(/<g data-testid="draft".*?<\/g>/s, '')).toBe(before)
  })

  test('B3.2 arrow fully inside a shape moves with it', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [400, 300])
    await drawArrow(page, [150, 150], [250, 200])
    await dragScene(page, [350, 250], [400, 280])
    const [arrow] = byType(await scene(page), 'arrow')
    expect(arrow.start).toEqual(pt(200, 180))
    expect(arrow.end).toEqual(pt(300, 230))
  })

  test('B3.3 start inside, end outside: only start follows the shape', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawArrow(page, [150, 150], [500, 400])
    await dragScene(page, [120, 180], [170, 210])
    const [arrow] = byType(await scene(page), 'arrow')
    expect(arrow.start).toEqual(pt(200, 180))
    expect(arrow.end).toEqual(pt(500, 400))
  })

  test('B3.4 arrow on empty canvas is unaffected by moving shapes', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawArrow(page, [500, 400], [700, 500])
    await dragScene(page, [150, 150], [250, 250])
    const s = await scene(page)
    const [arrow] = byType(s, 'arrow')
    expect(arrow.start).toEqual(pt(500, 400))
    expect(arrow.end).toEqual(pt(700, 500))
    expect(arrow.startBinding).toBeNull()
    expect(arrow.endBinding).toBeNull()
  })

  test('B3.5 an arrow can be selected and moved on its own', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawArrow(page, [150, 150], [550, 350])
    await dragScene(page, [350, 250], [390, 270]) // grab the line mid-way
    let [arrow] = byType(await scene(page), 'arrow')
    expect(arrow.start).toEqual(pt(190, 170))
    expect(arrow.end).toEqual(pt(590, 370))
    expect(arrow.startBinding).toBeNull()
    // The shape did not move, and moving it no longer drags the arrow.
    expect(byType(await scene(page), 'rectangle')[0]).toMatchObject({ x: 100, y: 100 })
    await dragScene(page, [110, 110], [160, 140])
    ;[arrow] = byType(await scene(page), 'arrow')
    expect(arrow.start).toEqual(pt(190, 170))
  })

  test('B3.6 A→B: moving A moves only the start; moving B does not move the arrow', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawShape(page, 'ellipse', [500, 300], [700, 400])
    await drawArrow(page, [150, 150], [600, 350])
    const a = (await scene(page)).elements.find((e: any) => e.type === 'rectangle')

    await dragScene(page, [120, 180], [170, 210]) // move A by (+50,+30)
    let [arrow] = byType(await scene(page), 'arrow')
    expect(arrow.start).toEqual(pt(200, 180))
    expect(arrow.end).toEqual(pt(600, 350))

    await dragScene(page, [560, 380], [580, 400]) // move B by (+20,+20)
    const [after] = byType(await scene(page), 'arrow')
    expect(after).toEqual(arrow)
    expect(after.startBinding.shapeId).toBe(a.id)
    expect(after.endBinding).toBeNull()
    expect(byType(await scene(page), 'ellipse')[0]).toMatchObject({ x: 520, y: 320 })
  })

  test('B3.7 deleting an attached shape leaves the arrow intact', async ({ page }) => {
    await drawShape(page, 'rectangle', [100, 100], [300, 200])
    await drawArrow(page, [150, 150], [500, 400])
    const before = byType(await scene(page), 'arrow')[0]
    await dragScene(page, [120, 180], [120, 180]) // select the shape
    await page.keyboard.press('Delete')
    const s = await scene(page)
    expect(byType(s, 'rectangle')).toHaveLength(0)
    const [arrow] = byType(s, 'arrow')
    expect(arrow).toMatchObject({
      x: before.x, y: before.y, width: before.width, height: before.height,
      start: before.start, end: before.end,
    })
  })
})
