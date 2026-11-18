import type { Element } from '../types'

const PAD = 4

export function SelectionOutline({ el }: { el: Element }) {
  return (
    <rect
      data-testid={`selection-${el.id}`}
      x={el.x - PAD}
      y={el.y - PAD}
      width={el.width + PAD * 2}
      height={el.height + PAD * 2}
      fill="none"
      stroke="#4dabf7"
      strokeWidth={1.5}
      strokeDasharray="5 3"
      pointerEvents="none"
    />
  )
}
