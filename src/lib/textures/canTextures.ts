import { createRandom } from '../random'
import { createCanvas, heightToNormal, stampDome, wrapDraw } from './canvas'
import { LABEL_LAYOUT } from './labelTexture'

/** Height map of condensation droplets in label UV space (2:1, wraps horizontally). */
function drawCondensationHeight(width: number) {
  const w = width
  const h = width / 2
  const { canvas, ctx } = createCanvas(w, h)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'lighten'
  const rand = createRandom(4242)
  const s = w / 1024

  const scatter = (count: number, rMin: number, rMax: number, peakMin: number, stretch: number) => {
    for (let i = 0; i < count; i++) {
      const r = rand.range(rMin, rMax) * s
      const x = rand.next() * w
      const y = rand.next() * h
      const peak = rand.range(peakMin, 1)
      wrapDraw(w, h, x, y, r * 2, (px, py) => stampDome(ctx, px, py, r, r * rand.range(1, stretch), peak))
    }
  }
  scatter(2600, 0.6, 1.4, 0.3, 1.05)
  scatter(900, 1.4, 3.2, 0.55, 1.15)
  scatter(170, 3.5, 7.5, 0.75, 1.3)

  // Running drips: a fat bead with a thinning trail above it.
  for (let i = 0; i < 16; i++) {
    const x = rand.next() * w
    const yEnd = rand.range(0.35, 0.95) * h
    const len = rand.range(0.08, 0.3) * h
    const r = rand.range(4, 7) * s
    for (let t = 0; t <= 1; t += 0.02) {
      const y = yEnd - t * len
      const wobble = Math.sin(t * 9 + i) * 1.5 * s
      stampDome(ctx, x + wobble, y, r * (0.45 + 0.25 * (1 - t)), r * 0.8, 0.55)
    }
    stampDome(ctx, x, yEnd, r * 1.15, r * 1.35, 1)
  }

  // Frost: dense micro-texture near the rims of the label.
  const frost = (y0: number, y1: number) => {
    for (let i = 0; i < 4000; i++) {
      const t = Math.pow(rand.next(), 2)
      const y = y0 + (y1 - y0) * t
      const r = rand.range(0.5, 1.2) * s
      stampDome(ctx, rand.next() * w, y, r, r, rand.range(0.2, 0.6))
    }
  }
  frost(h * LABEL_LAYOUT.bandTop, h * (LABEL_LAYOUT.bandTop + LABEL_LAYOUT.frostDepth))
  frost(h * LABEL_LAYOUT.bandBottom, h * (LABEL_LAYOUT.bandBottom - LABEL_LAYOUT.frostDepth))
  ctx.globalCompositeOperation = 'source-over'
  return canvas
}

export interface LabelSurfaceMaps {
  normal: HTMLCanvasElement
  /** Packed roughness (G) and metalness (B), as three.js reads them. */
  surface: HTMLCanvasElement
}

export function createLabelSurfaceMaps(labelWidth: number, metalMask: HTMLCanvasElement): LabelSurfaceMaps {
  const dropWidth = Math.min(1024, labelWidth)
  const height = drawCondensationHeight(dropWidth)
  const normal = heightToNormal(height, 5)

  const w = labelWidth
  const h = labelWidth / 2
  const { canvas, ctx } = createCanvas(w, h)
  const out = ctx.createImageData(w, h)
  const drops = height.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, height.width, height.height).data
  const mask = metalMask.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, w, h).data
  if (!drops || !mask) throw new Error('2D canvas is not available')
  const ratio = height.width / w
  const frostDepth = LABEL_LAYOUT.frostDepth

  for (let y = 0; y < h; y++) {
    const v = y / h
    const distTop = (v - LABEL_LAYOUT.bandTop) / frostDepth
    const distBottom = (LABEL_LAYOUT.bandBottom - v) / frostDepth
    const frost = Math.max(0, 1 - Math.min(Math.abs(distTop), Math.abs(distBottom)))
    const dy = Math.min(height.height - 1, Math.floor(y * ratio))
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const metal = mask[i] / 255
      const drop = drops[(dy * height.width + Math.floor(x * ratio)) * 4] / 255
      const paintedRough = 0.34
      const metalRough = 0.2
      let rough = paintedRough * (1 - metal) + metalRough * metal
      rough = rough * (1 - frost) + 0.62 * frost
      rough = rough * (1 - drop * 0.85)
      out.data[i] = 255
      out.data[i + 1] = Math.round(rough * 255)
      out.data[i + 2] = Math.round((0.18 + metal * 0.82) * (1 - frost * 0.5) * 255)
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return { normal, surface: canvas }
}

/** Fine circumferential brushing for the bare aluminium parts. Tileable. */
export function createBrushedNormal(size = 512) {
  const { canvas, ctx } = createCanvas(size, size)
  const rand = createRandom(77)
  const img = ctx.createImageData(size, size)
  let rowValue = 0.5
  const rows: number[] = []
  for (let y = 0; y < size; y++) {
    rowValue = rowValue * 0.6 + rand.next() * 0.4
    rows.push(rowValue)
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (rows[y] * 0.8 + rand.next() * 0.2) * 255
      const i = (y * size + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return heightToNormal(canvas, 1.2)
}

/** Roughness strip for neck and base: frosty near both ends of the lathe profile. */
export function createMetalRoughness() {
  const w = 64
  const h = 256
  const { canvas, ctx } = createCanvas(w, h)
  const rand = createRandom(5)
  const img = ctx.createImageData(w, h)
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1)
    const edge = Math.min(v, 1 - v)
    const frost = Math.max(0, 1 - edge / 0.3)
    for (let x = 0; x < w; x++) {
      const speckle = rand.next() < frost * 0.5 ? 0.25 : 0
      const rough = 0.18 + frost * 0.35 + speckle
      const i = (y * w + x) * 4
      img.data[i] = 255
      img.data[i + 1] = Math.min(255, rough * 255)
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

/** Lid detail in planar UVs: countersink rings, the opening score and the rivet. Front of the can is canvas bottom. */
export function createLidNormal(size = 512) {
  const { canvas, ctx } = createCanvas(size, size)
  const c = size / 2
  ctx.fillStyle = 'rgb(128,128,128)'
  ctx.fillRect(0, 0, size, size)

  const ring = (r: number, width: number, value: number) => {
    ctx.strokeStyle = `rgb(${value},${value},${value})`
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ring(size * 0.47, size * 0.02, 60)
  ring(size * 0.44, size * 0.012, 200)
  ring(size * 0.4, size * 0.008, 165)

  // Raised panel around the opening, then the score line itself.
  ctx.fillStyle = 'rgb(150,150,150)'
  ctx.beginPath()
  ctx.ellipse(c, c + size * 0.24, size * 0.16, size * 0.13, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgb(70,70,70)'
  ctx.lineWidth = size * 0.008
  ctx.beginPath()
  ctx.moveTo(c - size * 0.1, c + size * 0.15)
  ctx.quadraticCurveTo(c - size * 0.15, c + size * 0.33, c, c + size * 0.35)
  ctx.quadraticCurveTo(c + size * 0.15, c + size * 0.33, c + size * 0.1, c + size * 0.15)
  ctx.quadraticCurveTo(c, c + size * 0.12, c - size * 0.1, c + size * 0.15)
  ctx.stroke()

  stampDome(ctx, c, c, size * 0.05, size * 0.05, 0.9)
  ring(size * 0.075, size * 0.01, 95)

  // A little radial brushing.
  const rand = createRandom(11)
  ctx.globalAlpha = 0.06
  for (let i = 0; i < 600; i++) {
    const a = rand.next() * Math.PI * 2
    const r0 = rand.range(0.05, 0.3) * size
    ctx.strokeStyle = rand.next() > 0.5 ? '#fff' : '#000'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0)
    ctx.lineTo(c + Math.cos(a) * (r0 + size * 0.15), c + Math.sin(a) * (r0 + size * 0.15))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return heightToNormal(canvas, 3)
}
