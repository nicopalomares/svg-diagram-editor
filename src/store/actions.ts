import { removeElements } from '../geometry/arrows'
import { commit } from './history'
import { getState, setState } from './sceneStore'

export function deleteSelection() {
  const { elements, selection } = getState()
  if (selection.length === 0) return
  setState({ elements: removeElements(elements, selection), selection: [] })
  commit()
}
