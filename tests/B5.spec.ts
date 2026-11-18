import { expect, test } from '@playwright/test'
import { byType, dragScene, drawArrow, drawShape, scene } from './helpers'

const click = (page: any, x: number, y: number) => dragScene(page, [x, y], [x, y])

test.describe('B5: Multi-selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await drawShape(page, 'rectangle', [100, 100], [200, 200]) // A
    await drawShape(page, 'rectangle', [300, 100], [400, 200]) // B
    await drawShape(page, 'ellipse', [400, 150], [500, 300]) // D (sticks out of the box below)
    await drawShape(page, 'rectangle', [600, 500], [700, 600]) // C (far away)
    await click(page, 900, 700) // clear selection
  })

  const ids = async (page: any) => {
    const els = (await scene(page)).elements
    const [A, B, D, C] = els.map((e: any) => e.id)
    return { A, B, D, C }
  }

  test('B5.1 selection box selects only elements fully inside it', async ({ page }) => {
    await drawArrow(page, [120, 320], [180, 360]) // empty canvas, fully inside the box
    await click(page, 900, 700)
    const { A, B } = await ids(page)
    const arrow = byType(await scene(page), 'arrow')[0]

    const r = (await page.getByTestId('canvas').boundingBox())!
    await page.mouse.move(r.x + 50, r.y + 50)
    await page.mouse.down()
    await page.mouse.move(r.x + 300, r.y + 200)
    await expect(page.getByTestId('selection-box')).toBeVisible()
    await page.mouse.move(r.x + 450, r.y + 400)
    await page.mouse.up()

    const { selection } = await scene(page)
    expect([...selection].sort()).toEqual([A, B, arrow.id].sort())
    await expect(page.getByTestId('selection-box')).toHaveCount(0)
  })

  test('B5.1 box dragged up-left works too', async ({ page }) => {
    const { A, B } = await ids(page)
    await dragScene(page, [450, 320], [50, 50])
    expect([...(await scene(page)).selection].sort()).toEqual([A, B].sort())
  })

  test('B5.2 Shift + click adds and removes a shape', async ({ page }) => {
    const { A, B } = await ids(page)
    await click(page, 150, 150)
    expect((await scene(page)).selection).toEqual([A])

    await page.keyboard.down('Shift')
    await click(page, 350, 150)
    expect((await scene(page)).selection).toEqual([A, B])

    await click(page, 150, 150)
    expect((await scene(page)).selection).toEqual([B])
    await page.keyboard.up('Shift')

    await click(page, 150, 150) // plain click replaces the selection
    expect((await scene(page)).selection).toEqual([A])
  })

  test('B5.3 dragging any selected shape moves all selected by the same offset', async ({ page }) => {
    const { A, B, C } = await ids(page)
    await click(page, 150, 150)
    await page.keyboard.down('Shift')
    await click(page, 350, 150)
    await page.keyboard.up('Shift')

    await dragScene(page, [350, 150], [380, 170]) // drag B by (+30,+20)
    const get = async (id: string) => (await scene(page)).elements.find((e: any) => e.id === id)
    expect(await get(A)).toMatchObject({ x: 130, y: 120 })
    expect(await get(B)).toMatchObject({ x: 330, y: 120 })
    expect(await get(C)).toMatchObject({ x: 600, y: 500 })
    expect((await scene(page)).selection).toEqual([A, B])
  })
})
