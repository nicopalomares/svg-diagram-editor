import { getState } from '../store/sceneStore'
import { downloadBlob } from './download'

export const FILE_TYPE = 'svg-diagram-editor'
/** Files exported before the project was renamed. Still accepted on import. */
export const LEGACY_FILE_TYPE = 'draw-test'

export function serializeScene() {
  return JSON.stringify({ type: FILE_TYPE, version: 1, elements: getState().elements }, null, 2)
}

export function exportJson() {
  downloadBlob(new Blob([serializeScene()], { type: 'application/json' }), 'diagram.json')
}
