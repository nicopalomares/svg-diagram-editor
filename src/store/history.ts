import { getState, setState } from './sceneStore'
import type { Element } from '../types'

/** Undoable part of the scene. Zoom, scroll and tool are deliberately not included. */
interface Snapshot { elements: Element[] }

let past: Snapshot[] = []
let future: Snapshot[] = []
let present: Snapshot = { elements: [] }

/** Call once after each completed user action (create, move, delete, connect). */
export function commit() {
  past.push(present)
  future = []
  present = { elements: getState().elements }
}

function restore(snap: Snapshot) {
  const ids = new Set(snap.elements.map((e) => e.id))
  setState({
    elements: snap.elements,
    selection: getState().selection.filter((id) => ids.has(id)),
  })
}

export function undo() {
  const prev = past.pop()
  if (!prev) return
  future.push(present)
  present = prev
  restore(present)
}

export function redo() {
  const next = future.pop()
  if (!next) return
  past.push(present)
  present = next
  restore(present)
}

/** Reset history to the current scene (e.g. after import). */
export function resetHistory() {
  past = []
  future = []
  present = { elements: getState().elements }
}
