import { getState, setState } from '../store/sceneStore'

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 5

type View = { zoom: number; scrollX: number; scrollY: number }

/** scene = screen / zoom + scroll */
export function screenToScene(sx: number, sy: number, v: View) {
  return { x: sx / v.zoom + v.scrollX, y: sy / v.zoom + v.scrollY }
}

/** Zoom by a wheel delta (deltaY 100 = 10 points), keeping the scene point under (sx, sy) fixed. */
export function zoomAt(sx: number, sy: number, deltaY: number) {
  const v = getState()
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((v.zoom - deltaY / 1000) * 1000) / 1000))
  if (next === v.zoom) return
  const anchor = screenToScene(sx, sy, v)
  setState({ zoom: next, scrollX: anchor.x - sx / next, scrollY: anchor.y - sy / next })
}

/** Scroll the view by screen pixels. */
export function scrollByScreen(dx: number, dy: number) {
  const { zoom, scrollX, scrollY } = getState()
  setState({ scrollX: scrollX + dx / zoom, scrollY: scrollY + dy / zoom })
}

/** Route a wheel event: Ctrl zooms; Space scrolls horizontally; otherwise vertically. */
export function handleWheel(e: { ctrlKey: boolean; shiftKey: boolean; deltaX: number; deltaY: number }, sx: number, sy: number) {
  if (e.ctrlKey) return zoomAt(sx, sy, e.deltaY)
  const main = e.deltaY || e.deltaX
  if (getState().spaceHeld) return scrollByScreen(main, 0)
  if (e.shiftKey) return scrollByScreen(0, main)
  scrollByScreen(e.deltaX, e.deltaY)
}
