import { renderToStaticMarkup } from 'react-dom/server'
import { ElementView } from '../svg/ElementView'
import { getState } from '../store/sceneStore'
import { downloadBlob } from './download'

export const PNG_PADDING = 20
export const PNG_SCALE = 2

export function sceneBounds() {
  const { elements } = getState()
  if (elements.length === 0) return null
  const x0 = Math.min(...elements.map((e) => e.x))
  const y0 = Math.min(...elements.map((e) => e.y))
  const x1 = Math.max(...elements.map((e) => e.x + e.width))
  const y1 = Math.max(...elements.map((e) => e.y + e.height))
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

function buildSvg() {
  const b = sceneBounds()
  if (!b) return null
  const x = b.x - PNG_PADDING
  const y = b.y - PNG_PADDING
  const w = b.width + PNG_PADDING * 2
  const h = b.height + PNG_PADDING * 2
  const body = getState().elements.map((el) => renderToStaticMarkup(<ElementView el={el} />)).join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * PNG_SCALE}" height="${h * PNG_SCALE}" viewBox="${x} ${y} ${w} ${h}">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff"/>${body}</svg>`
  return { svg, width: w * PNG_SCALE, height: h * PNG_SCALE }
}

export async function exportPng() {
  const built = buildSvg()
  if (!built) return
  const url = URL.createObjectURL(new Blob([built.svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(built.width)
    canvas.height = Math.round(built.height)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff' // opaque white even if the SVG background fails to paint
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
    if (blob) downloadBlob(blob, 'diagram.png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
