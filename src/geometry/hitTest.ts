import type { Element, Shape } from '../types'
import { distToSegment } from './arrows'

export function hitsElement(el: Element, px: number, py: number, tolerance = 6): boolean {
  if (el.type === 'arrow') return distToSegment({ x: px, y: py }, el.start, el.end) <= tolerance
  if (el.type === 'rectangle') {
    return px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height
  }
  const rx = el.width / 2
  const ry = el.height / 2
  if (rx === 0 || ry === 0) return false
  const dx = (px - (el.x + rx)) / rx
  const dy = (py - (el.y + ry)) / ry
  return dx * dx + dy * dy <= 1
}

/** Topmost element under the point (last in array is on top). */
export function hitTest(elements: Element[], px: number, py: number, tolerance = 6): Element | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitsElement(elements[i], px, py, tolerance)) return elements[i]
  }
  return null
}

/** Topmost shape (arrows ignored) under the point. */
export function hitShape(elements: Element[], px: number, py: number): Shape | null {
  const shapes = elements.filter((e): e is Shape => e.type !== 'arrow')
  return hitTest(shapes, px, py) as Shape | null
}
