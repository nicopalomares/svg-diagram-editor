import { boxFromPoints } from '../geometry/bounds'
import { commit } from '../store/history'
import { getState, newId, setState } from '../store/sceneStore'
import type { ShapeType } from '../types'

const MIN_SIZE = 2
let origin: { x: number; y: number } | null = null

export function shapeDown(p: { x: number; y: number }) {
  origin = p
}

export function shapeMove(type: ShapeType, p: { x: number; y: number }) {
  if (!origin) return
  setState({ draft: { id: 'draft', type, ...boxFromPoints(origin.x, origin.y, p.x, p.y) } })
}

export function shapeUp() {
  const { draft, elements } = getState()
  origin = null
  if (!draft || (draft.width < MIN_SIZE && draft.height < MIN_SIZE)) {
    setState({ draft: null })
    return
  }
  const shape = { ...draft, id: newId() }
  setState({ elements: [...elements, shape], selection: [shape.id], tool: 'select', draft: null })
  commit()
}
