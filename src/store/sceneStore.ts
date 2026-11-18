import { useSyncExternalStore } from 'react'
import type { SceneState, Tool } from '../types'

let state: SceneState = {
  elements: [],
  selection: [],
  tool: 'select',
  draft: null,
  marquee: null,
  zoom: 1,
  scrollX: 0,
  scrollY: 0,
  spaceHeld: false,
}

const listeners = new Set<() => void>()

export const getState = () => state

export function setState(patch: Partial<SceneState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Selector must return a stable reference (no fresh objects). */
export function useScene<T>(selector: (s: SceneState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

export const setTool = (tool: Tool) => setState({ tool })

export const newId = () => Math.random().toString(36).slice(2, 10)
