import type { Element } from '../types'

const common = { fill: 'none', stroke: '#1e1e1e', strokeWidth: 2 }

function arrowHead(from: { x: number; y: number }, to: { x: number; y: number }) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const size = 14
  const spread = Math.PI / 7
  const p = (a: number) => `${to.x - size * Math.cos(a)},${to.y - size * Math.sin(a)}`
  return `M ${p(angle - spread)} L ${to.x},${to.y} L ${p(angle + spread)}`
}

export function ElementView({ el, testId }: { el: Element; testId?: string }) {
  return (
    <g
      data-testid={testId ?? `element-${el.id}`}
      data-type={el.type}
      data-x={el.x}
      data-y={el.y}
      data-width={el.width}
      data-height={el.height}
    >
      {el.type === 'rectangle' && (
        <rect x={el.x} y={el.y} width={el.width} height={el.height} {...common} />
      )}
      {el.type === 'ellipse' && (
        <ellipse
          cx={el.x + el.width / 2}
          cy={el.y + el.height / 2}
          rx={el.width / 2}
          ry={el.height / 2}
          {...common}
        />
      )}
      {el.type === 'arrow' && (
        <>
          <line x1={el.start.x} y1={el.start.y} x2={el.end.x} y2={el.end.y} {...common} strokeLinecap="round" />
          <path d={arrowHead(el.start, el.end)} {...common} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </g>
  )
}
