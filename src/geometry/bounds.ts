/** Normalized box from two corner points (any drag direction). */
export function boxFromPoints(ax: number, ay: number, bx: number, by: number) {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  }
}
