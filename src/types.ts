export type ShapeType = 'rectangle' | 'ellipse'
export type Tool = 'select' | ShapeType | 'arrow'

export interface Point { x: number; y: number }

export interface Shape {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
}

/** Endpoint attached to a shape: point = shape origin + offset. */
export interface Binding {
  shapeId: string
  offsetX: number
  offsetY: number
}

export interface Arrow {
  id: string
  type: 'arrow'
  /** Bounding box of start/end (kept in sync, used for data-* and selection). */
  x: number
  y: number
  width: number
  height: number
  start: Point
  end: Point
  startBinding: Binding | null
  endBinding: Binding | null
}

export type Element = Shape | Arrow

export interface Box { x: number; y: number; width: number; height: number }

export interface SceneState {
  elements: Element[]
  selection: string[]
  tool: Tool
  /** Element being drawn right now (not yet committed). */
  draft: Element | null
  /** Selection rectangle being dragged on empty canvas (scene coordinates). */
  marquee: Box | null
  zoom: number
  scrollX: number
  scrollY: number
  /** Space bar is held: drag pans the canvas. */
  spaceHeld: boolean
}
