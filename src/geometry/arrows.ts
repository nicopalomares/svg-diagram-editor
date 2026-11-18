import type { Arrow, Binding, Element, Point, Shape } from '../types'

export function makeArrow(
  id: string, start: Point, end: Point,
  startBinding: Binding | null, endBinding: Binding | null,
): Arrow {
  return {
    id, type: 'arrow', start, end, startBinding, endBinding,
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

export const withPoints = (a: Arrow, start: Point, end: Point): Arrow =>
  makeArrow(a.id, start, end, a.startBinding, a.endBinding)

export function bindTo(shape: Shape | null, p: Point): Binding | null {
  return shape ? { shapeId: shape.id, offsetX: p.x - shape.x, offsetY: p.y - shape.y } : null
}

/** Recompute bound endpoints from their shapes' current positions. */
export function syncArrows(elements: Element[]): Element[] {
  const byId = new Map(elements.map((e) => [e.id, e]))
  const resolve = (b: Binding | null, fallback: Point): Point => {
    const s = b && byId.get(b.shapeId)
    return s ? { x: s.x + b!.offsetX, y: s.y + b!.offsetY } : fallback
  }
  return elements.map((e) => {
    if (e.type !== 'arrow') return e
    const start = resolve(e.startBinding, e.start)
    const end = resolve(e.endBinding, e.end)
    if (start.x === e.start.x && start.y === e.start.y && end.x === e.end.x && end.y === e.end.y) return e
    return withPoints(e, start, end)
  })
}

/** Remove elements by id; arrows attached to removed shapes keep their points, just unbound. */
export function removeElements(elements: Element[], ids: string[]): Element[] {
  const gone = new Set(ids)
  return elements
    .filter((e) => !gone.has(e.id))
    .map((e) => {
      if (e.type !== 'arrow') return e
      const sb = e.startBinding && gone.has(e.startBinding.shapeId)
      const eb = e.endBinding && gone.has(e.endBinding.shapeId)
      return sb || eb
        ? { ...e, startBinding: sb ? null : e.startBinding, endBinding: eb ? null : e.endBinding }
        : e
    })
}

export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}
