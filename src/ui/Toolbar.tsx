import { setTool, useScene } from '../store/sceneStore'
import type { Tool } from '../types'

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'arrow', label: 'Arrow' },
]

export function Toolbar() {
  const tool = useScene((s) => s.tool)
  return (
    <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, padding: 4, background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          data-testid={`tool-${t.id}`}
          aria-pressed={tool === t.id}
          onClick={() => setTool(t.id)}
          style={{ padding: '6px 10px', border: 0, borderRadius: 6, cursor: 'pointer', background: tool === t.id ? '#d0ebff' : 'transparent' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
