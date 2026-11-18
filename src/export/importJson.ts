import { commit } from '../store/history'
import { setState } from '../store/sceneStore'
import type { Element } from '../types'
import { FILE_TYPE, LEGACY_FILE_TYPE } from './exportJson'

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const point = (p: any) => p && num(p.x) && num(p.y)
const binding = (b: any) => b === null || (b && typeof b.shapeId === 'string' && num(b.offsetX) && num(b.offsetY))

function isElement(e: any): e is Element {
  if (!e || typeof e.id !== 'string' || ![e.x, e.y, e.width, e.height].every(num)) return false
  if (e.type === 'rectangle' || e.type === 'ellipse') return true
  return e.type === 'arrow' && point(e.start) && point(e.end) && binding(e.startBinding) && binding(e.endBinding)
}

/** Parse a diagram file. Returns the elements, or null if the file is not a valid diagram. */
export function parseScene(text: string): Element[] | null {
  try {
    const data = JSON.parse(text)
    if ((data?.type !== FILE_TYPE && data?.type !== LEGACY_FILE_TYPE) || !Array.isArray(data.elements)) return null
    return data.elements.every(isElement) ? data.elements : null
  } catch {
    return null
  }
}

export async function importJson(file: File) {
  const elements = parseScene(await file.text())
  if (!elements) {
    console.error('Import failed: not a valid diagram file')
    return false
  }
  setState({ elements, selection: [], draft: null, marquee: null })
  commit() // undoable; zoom and pan are left alone
  return true
}
