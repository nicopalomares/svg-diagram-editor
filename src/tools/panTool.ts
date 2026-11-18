import { getState, setState } from '../store/sceneStore'
import type { Point } from '../types'

let pan: { screen: Point; scrollX: number; scrollY: number } | null = null

/** Screen-space points: the view follows the pointer by exactly the drag distance. */
export function panDown(screen: Point) {
  const { scrollX, scrollY } = getState()
  pan = { screen, scrollX, scrollY }
}

export function panMove(screen: Point) {
  if (!pan) return
  const { zoom } = getState()
  setState({
    scrollX: pan.scrollX - (screen.x - pan.screen.x) / zoom,
    scrollY: pan.scrollY - (screen.y - pan.screen.y) / zoom,
  })
}

export function panUp() {
  pan = null
}

export const isPanning = () => pan !== null
