import { bindTo, makeArrow } from '../geometry/arrows'
import { hitShape } from '../geometry/hitTest'
import { commit } from '../store/history'
import { getState, newId, setState } from '../store/sceneStore'
import type { Binding, Point } from '../types'

const MIN_LENGTH = 2
let origin: { p: Point; binding: Binding | null } | null = null

export function arrowDown(p: Point) {
  origin = { p, binding: bindTo(hitShape(getState().elements, p.x, p.y), p) }
}

export function arrowMove(p: Point) {
  if (!origin) return
  setState({ draft: makeArrow('draft', origin.p, p, origin.binding, null) })
}

export function arrowUp(p: Point) {
  if (!origin) return
  const { elements } = getState()
  const startPoint = origin.p
  const startBinding = origin.binding
  // The end only attaches when it lands inside the same shape the arrow started in.
  const endShape = hitShape(elements, p.x, p.y)
  const endBinding = startBinding && endShape?.id === startBinding.shapeId ? bindTo(endShape, p) : null
  origin = null
  if (Math.hypot(p.x - startPoint.x, p.y - startPoint.y) < MIN_LENGTH) {
    setState({ draft: null })
    return
  }
  const arrow = makeArrow(newId(), startPoint, p, startBinding, endBinding)
  setState({ elements: [...elements, arrow], selection: [arrow.id], tool: 'select', draft: null })
  commit()
}
