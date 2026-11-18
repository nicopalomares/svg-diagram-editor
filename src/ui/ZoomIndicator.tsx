import { useScene } from '../store/sceneStore'

export function ZoomIndicator() {
  const zoom = useScene((s) => s.zoom)
  return (
    <div
      data-testid="zoom-indicator"
      style={{ position: 'absolute', left: 12, bottom: 12, padding: '4px 10px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, userSelect: 'none', pointerEvents: 'none' }}
    >
      {Math.round(zoom * 100)}%
    </div>
  )
}
