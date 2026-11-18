import type { Page } from '@playwright/test'

export interface Box { x: number; y: number; width: number; height: number }

/** Drag using scene coordinates (assumes zoom 1, scroll 0 unless told otherwise). */
export async function dragScene(
  page: Page,
  from: [number, number],
  to: [number, number],
) {
  const r = (await page.getByTestId('canvas').boundingBox())!
  await page.mouse.move(r.x + from[0], r.y + from[1])
  await page.mouse.down()
  await page.mouse.move(r.x + (from[0] + to[0]) / 2, r.y + (from[1] + to[1]) / 2)
  await page.mouse.move(r.x + to[0], r.y + to[1])
  await page.mouse.up()
}

export const scene = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__scene
    return { elements: s.elements, selection: s.selection, tool: s.tool, zoom: s.zoom, scroll: s.scroll }
  })

export async function drawShape(page: Page, tool: 'rectangle' | 'ellipse', from: [number, number], to: [number, number]) {
  await page.getByTestId(`tool-${tool}`).click()
  await dragScene(page, from, to)
}

export async function drawArrow(page: Page, from: [number, number], to: [number, number]) {
  await page.getByTestId('tool-arrow').click()
  await dragScene(page, from, to)
}

export const byType = (s: { elements: any[] }, type: string) => s.elements.filter((e) => e.type === type)
