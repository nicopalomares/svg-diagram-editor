import { useEffect, useRef } from 'react'
import { getState, useScene } from '../store/sceneStore'
import { arrowDown, arrowMove, arrowUp } from '../tools/arrowTool'
import { isPanning, panDown, panMove, panUp } from '../tools/panTool'
import { selectDown, selectMove, selectUp } from '../tools/selectTool'
import { shapeDown, shapeMove, shapeUp } from '../tools/shapeTool'
import { ElementView } from './ElementView'
import { SelectionOutline } from './SelectionBox'
import { handleWheel, screenToScene } from './viewTransform'

export function Canvas() {
  const ref = useRef<SVGSVGElement>(null)
  const elements = useScene((s) => s.elements)
  const selection = useScene((s) => s.selection)
  const draft = useScene((s) => s.draft)
  const marquee = useScene((s) => s.marquee)
  const zoom = useScene((s) => s.zoom)
  const scrollX = useScene((s) => s.scrollX)
  const scrollY = useScene((s) => s.scrollY)
  const spaceHeld = useScene((s) => s.spaceHeld)

  // Non-passive so Ctrl + wheel does not zoom the browser page.
  useEffect(() => {
    const svg = ref.current!
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = svg.getBoundingClientRect()
      handleWheel(e, e.clientX - r.left, e.clientY - r.top)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  const local = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const toScene = (e: React.PointerEvent) => {
    const p = local(e)
    return screenToScene(p.x, p.y, getState())
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ref.current!.setPointerCapture(e.pointerId)
    if (getState().spaceHeld) return panDown(local(e))
    const { tool } = getState()
    if (tool === 'rectangle' || tool === 'ellipse') shapeDown(toScene(e))
    else if (tool === 'arrow') arrowDown(toScene(e))
    else selectDown(toScene(e), e.shiftKey)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanning()) return panMove(local(e))
    const { tool } = getState()
    if (tool === 'rectangle' || tool === 'ellipse') shapeMove(tool, toScene(e))
    else if (tool === 'arrow') arrowMove(toScene(e))
    else selectMove(toScene(e))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning()) return panUp()
    const { tool } = getState()
    if (tool === 'rectangle' || tool === 'ellipse') shapeUp()
    else if (tool === 'arrow') arrowUp(toScene(e))
    else selectUp()
  }

  return (
    <svg
      ref={ref}
      data-testid="canvas"
      width="100%"
      height="100%"
      style={{ display: 'block', background: '#fff', touchAction: 'none', cursor: spaceHeld ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <g transform={`scale(${zoom}) translate(${-scrollX} ${-scrollY})`}>
        {elements.map((el) => <ElementView key={el.id} el={el} />)}
        {elements.filter((el) => selection.includes(el.id)).map((el) => <SelectionOutline key={el.id} el={el} />)}
        {marquee && (
          <rect
            data-testid="selection-box"
            x={marquee.x} y={marquee.y} width={marquee.width} height={marquee.height}
            fill="rgba(77,171,247,0.12)" stroke="#4dabf7" strokeWidth={1 / zoom}
            pointerEvents="none"
          />
        )}
        {draft && <ElementView el={draft} testId="draft" />}
      </g>
    </svg>
  )
}
