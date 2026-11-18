import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { byType, drawArrow, drawShape, scene } from './helpers'

// Must match src/export/exportPng.tsx
const PAD = 20
const SCALE = 2

async function buildDiagram(page: Page) {
  await page.goto('/')
  await drawShape(page, 'rectangle', [100, 100], [300, 200])
  await drawShape(page, 'ellipse', [500, 300], [700, 400])
  await drawArrow(page, [150, 150], [250, 180]) // both ends in the rectangle -> bound
  await drawArrow(page, [320, 250], [480, 350]) // free
}

async function download(page: Page, testId: string) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId(testId).click()])
  return dl
}

test.describe('B8: Export and import', () => {
  test('B8.1 JSON export contains every element with type, geometry and bindings', async ({ page }) => {
    await buildDiagram(page)
    const dl = await download(page, 'export-json')
    expect(dl.suggestedFilename()).toBe('diagram.json')
    const data = JSON.parse(readFileSync((await dl.path())!, 'utf8'))
    const { elements } = await scene(page)
    expect(data.elements).toHaveLength(4)
    expect(data.elements).toEqual(elements)
    for (const e of data.elements) {
      expect(typeof e.type).toBe('string')
      for (const k of ['x', 'y', 'width', 'height']) expect(typeof e[k]).toBe('number')
    }
    const bound = data.elements.filter((e: any) => e.type === 'arrow' && e.startBinding)
    expect(bound).toHaveLength(1)
    expect(bound[0].startBinding).toMatchObject({ shapeId: data.elements[0].id })
  })

  test('B8.2 importing the JSON into an empty canvas reproduces the scene', async ({ page }) => {
    await buildDiagram(page)
    const original = (await scene(page)).elements
    const dl = await download(page, 'export-json')
    const path = (await dl.path())!

    await page.goto('/') // fresh, empty canvas
    expect((await scene(page)).elements).toHaveLength(0)
    await page.getByTestId('import-json-input').setInputFiles(path)
    const { elements, selection } = await scene(page)
    expect(elements).toEqual(original)
    expect(selection).toEqual([])
    await expect(page.locator('[data-type="arrow"]')).toHaveCount(2)

    // Bindings still work after import: moving the rectangle drags the bound arrow start.
    const rect = byType({ elements }, 'rectangle')[0]
    const arrow = elements.find((e: any) => e.type === 'arrow' && e.startBinding)
    const r = (await page.getByTestId('canvas').boundingBox())!
    await page.mouse.move(r.x + rect.x + 5, r.y + rect.y + 90) // a spot of the rect away from the arrow
    await page.mouse.down()
    await page.mouse.move(r.x + rect.x + 30, r.y + rect.y + 100)
    await page.mouse.move(r.x + rect.x + 55, r.y + rect.y + 120)
    await page.mouse.up()
    const moved = (await scene(page)).elements.find((e: any) => e.id === arrow.id)
    expect(moved.start).toEqual({ x: arrow.start.x + 50, y: arrow.start.y + 30 })
  })

  test('B8.2 import can be undone and invalid files are rejected', async ({ page }) => {
    await buildDiagram(page)
    const dl = await download(page, 'export-json')
    const path = (await dl.path())!
    await page.goto('/')
    await page.getByTestId('import-json-input').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') })
    expect((await scene(page)).elements).toHaveLength(0)
    await page.getByTestId('import-json-input').setInputFiles(path)
    expect((await scene(page)).elements).toHaveLength(4)
    await page.keyboard.press('Control+z')
    expect((await scene(page)).elements).toHaveLength(0)
  })

  test('B8.3 PNG is cropped to the bounding box plus padding', async ({ page }) => {
    await buildDiagram(page)
    const dl = await download(page, 'export-png')
    expect(dl.suggestedFilename()).toBe('diagram.png')
    const buf = readFileSync((await dl.path())!)
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    // Elements span x 100..700, y 100..400 in scene units.
    expect(width).toBe((600 + PAD * 2) * SCALE)
    expect(height).toBe((300 + PAD * 2) * SCALE)
  })

  test('B8.4 PNG has an opaque white background and shows the drawing', async ({ page }) => {
    await buildDiagram(page)
    const dl = await download(page, 'export-png')
    const b64 = readFileSync((await dl.path())!).toString('base64')
    const px = await page.evaluate(async (data) => {
      const img = new Image()
      img.src = `data:image/png;base64,${data}`
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const at = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data)
      const all = ctx.getImageData(0, 0, c.width, c.height).data
      let dark = 0
      for (let i = 0; i < all.length; i += 4) if (all[i] < 100 && all[i + 3] === 255) dark++
      return { corners: [at(0, 0), at(c.width - 1, 0), at(0, c.height - 1), at(c.width - 1, c.height - 1)], dark }
    }, b64)
    for (const corner of px.corners) expect(corner).toEqual([255, 255, 255, 255])
    expect(px.dark).toBeGreaterThan(100)
  })

  test('B8 PNG export of an empty canvas does nothing', async ({ page }) => {
    await page.goto('/')
    let downloaded = false
    page.on('download', () => { downloaded = true })
    await page.getByTestId('export-png').click()
    await page.waitForTimeout(300)
    expect(downloaded).toBe(false)
  })
})
