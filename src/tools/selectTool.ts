import { syncArrows, withPoints } from '../geometry/arrows'
import { boxFromPoints } from '../geometry/bounds'
import { hitTest } from '../geometry/hitTest'
import { commit } from '../store/history'
import { getState, setState } from '../store/sceneStore'
import type { Element, Point } from '../types'

type Drag =
  | { kind: 'move'; start: Point; originals: Map<string, Element>; detached: boolean; moved: boolean; toggleOnUp: string | null }
  | { kind: 'marquee'; start: Point; base: string[] }

let drag: Drag | null = null

export function selectDown(p: Point, shift = false) {
  const { elements, selection, zoom } = getState()
  const hit = hitTest(elements, p.x, p.y, 6 / zoom)

  if (!hit) {
    // Empty canvas: start a selection box (Shift keeps the current selection).
    const base = shift ? selection : []
    setState({ selection: base })
    drag = { kind: 'marquee', start: p, base }
    return
  }

  let sel = selection
  let toggleOnUp: string | null = null
  if (shift) {
    if (selection.includes(hit.id)) toggleOnUp = hit.id // removed on release if it was a click, not a drag
    else sel = [...selection, hit.id]
  } else if (!selection.includes(hit.id)) {
    sel = [hit.id]
  }
  setState({ selection: sel })
  drag = {
    kind: 'move',
    start: p,
    originals: new Map(elements.filter((e) => sel.includes(e.id)).map((e) => [e.id, e])),
    detached: false,
    moved: false,
    toggleOnUp,
  }
}

export function selectMove(p: Point) {
  if (!drag) return
  if (drag.kind === 'marquee') return marqueeMove(drag, p)

  const dx = p.x - drag.start.x
  const dy = p.y - drag.start.y
  if (dx === 0 && dy === 0) return
  drag.toggleOnUp = null
  drag.moved = true
  const { elements, selection } = getState()
  const sel = new Set(selection)

  // An arrow dragged on its own detaches from shapes that are not moving with it.
  let base = elements
  if (!drag.detached) {
    drag.detached = true
    base = elements.map((e) => {
      if (e.type !== 'arrow' || !sel.has(e.id)) return e
      const keep = (b: typeof e.startBinding) => (b && sel.has(b.shapeId) ? b : null)
      return { ...e, startBinding: keep(e.startBinding), endBinding: keep(e.endBinding) }
    })
  }

  const originals = drag.originals
  const moved = base.map((e) => {
    const o = originals.get(e.id)
    if (!o) return e
    if (e.type === 'arrow' && o.type === 'arrow') {
      return withPoints(
        e,
        { x: o.start.x + dx, y: o.start.y + dy },
        { x: o.end.x + dx, y: o.end.y + dy },
      )
    }
    return { ...e, x: o.x + dx, y: o.y + dy }
  })
  setState({ elements: syncArrows(moved) })
}

function marqueeMove(d: Extract<Drag, { kind: 'marquee' }>, p: Point) {
  const box = boxFromPoints(d.start.x, d.start.y, p.x, p.y)
  const inside = getState()
    .elements.filter(
      (e) =>
        e.x >= box.x && e.y >= box.y &&
        e.x + e.width <= box.x + box.width && e.y + e.height <= box.y + box.height,
    )
    .map((e) => e.id)
  setState({ marquee: box, selection: [...new Set([...d.base, ...inside])] })
}

export function selectUp() {
  if (drag?.kind === 'move' && drag.moved) commit() // one drag = one history step
  if (drag?.kind === 'move' && drag.toggleOnUp) {
    const id = drag.toggleOnUp
    setState({ selection: getState().selection.filter((s) => s !== id) })
  }
  if (drag?.kind === 'marquee') setState({ marquee: null })
  drag = null
}
