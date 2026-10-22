import { createRandom } from '../random'
import { createCanvas, heightToNormal, stampDome, wrapDraw } from './canvas'

export interface CitrusPalette {
  rind: string
  rindDark: string
  flesh: string
  fleshLight: string
  segments: number
}

export const CITRUS_PALETTES: Record<'lime' | 'orange', CitrusPalette> = {
  lime: { rind: '#3d9a1f', rindDark: '#1c5c0e', flesh: '#8fd23f', fleshLight: '#e8ffb8', segments: 10 },
  orange: { rind: '#ff8200', rindDark: '#b84a00', flesh: '#ff9418', fleshLight: '#ffe08f', segments: 11 },
}

/** Juice vesicles: many tiny teardrops pointing to the center of the fruit. */
function drawVesicles(ctx: CanvasRenderingContext2D, cx: number, cy: number, a0: number, a1: number, r0: number, r1: number, seed: number) {
  const rand = createRandom(seed)
  for (let i = 0; i < 120; i++) {
    const a = rand.range(a0, a1)
    const r = rand.range(r0, r1)
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.fillStyle = `rgba(255,255,255,${rand.range(0.08, 0.3)})`
    ctx.beginPath()
    ctx.ellipse(0, 0, rand.range(6, 16), rand.range(1.5, 3.5), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/** Cross-section of a citrus wheel, used as color map on slice faces (UVs map the face disc to the full canvas). */
export function drawCitrusFace(p: CitrusPalette, size = 512) {
  const { canvas, ctx } = createCanvas(size, size)
  const c = size / 2
  const r = size / 2
  ctx.fillStyle = p.rindDark
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = p.rind
  ctx.beginPath()
  ctx.arc(c, c, r * 0.97, 0, Math.PI * 2)
  ctx.fill()
  const pith = ctx.createRadialGradient(c, c, r * 0.8, c, c, r * 0.92)
  pith.addColorStop(0, '#fffbe8')
  pith.addColorStop(1, '#f2ead0')
  ctx.fillStyle = pith
  ctx.beginPath()
  ctx.arc(c, c, r * 0.9, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < p.segments; i++) {
    const gap = 0.035
    const a0 = (i / p.segments) * Math.PI * 2 + gap
    const a1 = ((i + 1) / p.segments) * Math.PI * 2 - gap
    const g = ctx.createRadialGradient(c, c, r * 0.1, c, c, r * 0.82)
    g.addColorStop(0, p.fleshLight)
    g.addColorStop(0.5, p.flesh)
    g.addColorStop(1, p.flesh)
    ctx.fillStyle = g
    ctx.beginPath()
    const mid = (a0 + a1) / 2
    ctx.moveTo(c + Math.cos(mid) * r * 0.1, c + Math.sin(mid) * r * 0.1)
    ctx.arc(c, c, r * 0.82, a0, a1)
    ctx.closePath()
    ctx.fill()
    drawVesicles(ctx, c, c, a0 + 0.04, a1 - 0.04, r * 0.18, r * 0.78, i * 31 + p.segments)
  }
  ctx.fillStyle = '#fff7df'
  ctx.beginPath()
  ctx.arc(c, c, r * 0.09, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

/** Lengthwise cut face of a citrus wedge: rind along the top arc, pulp fanning down to the core. */
export function drawCitrusWedgeFace(p: CitrusPalette, size = 512) {
  const { canvas, ctx } = createCanvas(size, size)
  ctx.fillStyle = p.flesh
  ctx.fillRect(0, 0, size, size)
  const g = ctx.createLinearGradient(0, 0, 0, size)
  g.addColorStop(0, p.flesh)
  g.addColorStop(1, p.fleshLight)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const rand = createRandom(9)
  for (let i = 0; i < 260; i++) {
    const x = rand.next() * size
    const y = rand.next() * size
    ctx.fillStyle = `rgba(255,255,255,${rand.range(0.08, 0.3)})`
    ctx.beginPath()
    ctx.ellipse(x, y, rand.range(2, 4), rand.range(8, 18), 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(255,250,230,0.7)'
  ctx.lineWidth = size * 0.012
  for (let i = 1; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo((i / 4) * size, size * 0.12)
    ctx.lineTo(size * 0.5, size)
    ctx.stroke()
  }
  // Pith and rind band at the top of the canvas, which maps to the curved outer edge.
  ctx.fillStyle = '#fbf3da'
  ctx.fillRect(0, 0, size, size * 0.12)
  ctx.fillStyle = p.rind
  ctx.fillRect(0, 0, size, size * 0.05)
  return canvas
}

/** Dimpled citrus peel with water beads. Tileable. */
export function createPeelNormal(size = 512) {
  const { canvas, ctx } = createCanvas(size, size)
  ctx.fillStyle = 'rgb(150,150,150)'
  ctx.fillRect(0, 0, size, size)
  const rand = createRandom(321)
  ctx.globalCompositeOperation = 'darken'
  for (let i = 0; i < 2600; i++) {
    const r = rand.range(2, 5)
    const x = rand.next() * size
    const y = rand.next() * size
    wrapDraw(size, size, x, y, r, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r)
      g.addColorStop(0, 'rgb(70,70,70)')
      g.addColorStop(1, 'rgba(150,150,150,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  ctx.globalCompositeOperation = 'lighten'
  addBeads(ctx, size, 90, 4, 11, 99)
  ctx.globalCompositeOperation = 'source-over'
  return heightToNormal(canvas, 3)
}

/** Smooth skin with water beads, for berries and cherries. Tileable. */
export function createSkinNormal(size = 512) {
  const { canvas, ctx } = createCanvas(size, size)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'lighten'
  addBeads(ctx, size, 160, 2, 9, 7)
  ctx.globalCompositeOperation = 'source-over'
  return heightToNormal(canvas, 4)
}

function addBeads(ctx: CanvasRenderingContext2D, size: number, count: number, rMin: number, rMax: number, seed: number) {
  const rand = createRandom(seed)
  for (let i = 0; i < count; i++) {
    const r = rand.range(rMin, rMax)
    const x = rand.next() * size
    const y = rand.next() * size
    wrapDraw(size, size, x, y, r, (px, py) => stampDome(ctx, px, py, r, r * rand.range(1, 1.25), 1))
  }
}
