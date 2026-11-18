/** Brand mark in the top-left corner. Ignores pointer events so it never blocks the canvas. */
export function Logo() {
  return (
    <div
      data-testid="logo"
      style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', pointerEvents: 'none' }}
    >
      <img src="/logo.svg" alt="" width={32} height={32} />
      <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: '#1e1e1e' }}>SVG Diagram Editor</span>
    </div>
  )
}
