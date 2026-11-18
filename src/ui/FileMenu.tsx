import { useRef } from 'react'
import { exportJson } from '../export/exportJson'
import { exportPng } from '../export/exportPng'
import { importJson } from '../export/importJson'

const btn: React.CSSProperties = { padding: '6px 10px', border: 0, borderRadius: 6, cursor: 'pointer', background: 'transparent' }

export function FileMenu() {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, padding: 4, background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
      <button data-testid="export-json" style={btn} onClick={exportJson}>Export JSON</button>
      <button data-testid="export-png" style={btn} onClick={() => void exportPng()}>Export PNG</button>
      <button data-testid="import-json" style={btn} onClick={() => input.current?.click()}>Import JSON</button>
      <input
        ref={input}
        data-testid="import-json-input"
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await importJson(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
