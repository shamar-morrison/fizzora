import type { Drink } from '../../data/drinks'
import { createRandom } from '../random'
import { createCanvas } from './canvas'
import { drawFruitArt } from './fruitArt'

export const DISPLAY_FONT = '"Unbounded Variable", "Arial Black", sans-serif'
export const BODY_FONT = '"Inter Variable", "Helvetica Neue", Arial, sans-serif'

/**
 * Label layout in a 2:1 canvas wrapped once around the can body.
 * x = 0.5 is the front of the can; the seam sits at the back.
 */
export const LABEL_LAYOUT = {
  bandTop: 0.065,
  bandBottom: 0.935,
  frostDepth: 0.09,
  brandY: 0.25,
  fruitY: 0.55,
  nameY: 0.8,
}

/** Sets the largest font (up to `maxSize`) at which `text` fits in `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, maxSize: number, maxWidth: number) {
  ctx.font = `${weight} ${maxSize}px ${family}`
  const size = Math.min(maxSize, (maxSize * maxWidth) / ctx.measureText(text).width)
  ctx.font = `${weight} ${Math.floor(size)}px ${family}`
}

function drawBrand(ctx: CanvasRenderingContext2D, w: number, h: number, fill: string) {
  ctx.save()
  fitFont(ctx, 'FIZZORA', 800, DISPLAY_FONT, h * 0.13, w * 0.32)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fill
  ctx.fillText('FIZZORA', w * 0.5, h * LABEL_LAYOUT.brandY)
  ctx.restore()
}

function drawBands(ctx: CanvasRenderingContext2D, w: number, h: number, fill: string) {
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, w, h * LABEL_LAYOUT.bandTop)
  ctx.fillRect(0, h * LABEL_LAYOUT.bandBottom, w, h * (1 - LABEL_LAYOUT.bandBottom))
}

function drawBackPanel(ctx: CanvasRenderingContext2D, drink: Drink, w: number, h: number) {
  // The back of the can spans both ends of the canvas; keep everything clear of the seam.
  const x = w * 0.12
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = `600 ${Math.round(h * 0.03)}px ${BODY_FONT}`
  ctx.textAlign = 'center'
  ctx.fillText('SPARKLING WATER + REAL FRUIT', x, h * 0.3)
  ctx.font = `400 ${Math.round(h * 0.024)}px ${BODY_FONT}`
  const lines = [
    drink.ingredients.map((i) => i.name).join(', ').toUpperCase().slice(0, 44),
    `${drink.nutrition.calories} KCAL · ${drink.nutrition.sugarG} G SUGAR · ${drink.nutrition.servingMl} ML`,
    'KEEP COLD · BEST SERVED AT 2 °C',
  ]
  lines.forEach((line, i) => ctx.fillText(line, x, h * (0.37 + i * 0.045)))

  // Barcode
  const rand = createRandom(drink.id.length * 977)
  const bx = x - w * 0.045
  const by = h * 0.55
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(bx - 12, by - 12, w * 0.09 + 24, h * 0.17 + 24)
  ctx.fillStyle = '#111111'
  let cursor = bx
  while (cursor < bx + w * 0.09) {
    const bar = rand.int(2, 7)
    if (rand.next() > 0.4) ctx.fillRect(cursor, by, bar, h * 0.15)
    cursor += bar + rand.int(1, 4)
  }
  ctx.restore()

  // Large vertical flavor word on the sides for a bold silhouette while the can spins.
  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${Math.round(h * 0.2)}px ${DISPLAY_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const sx of [0.27, 0.73]) {
    ctx.save()
    ctx.translate(w * sx, h * 0.5)
    ctx.rotate(sx < 0.5 ? -Math.PI / 2 : Math.PI / 2)
    ctx.fillText(drink.shortName.toUpperCase(), 0, 0)
    ctx.restore()
  }
  ctx.restore()

  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = `700 ${Math.round(h * 0.035)}px ${DISPLAY_FONT}`
  ctx.textAlign = 'center'
  ctx.fillText('330 ML', w * 0.88, h * 0.82)
  ctx.font = `500 ${Math.round(h * 0.022)}px ${BODY_FONT}`
  ctx.fillText('FIZZORA DRINKS CO. · PLEASE RECYCLE', w * 0.88, h * 0.87)
  ctx.restore()
}

function drawFrost(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const depth = h * LABEL_LAYOUT.frostDepth
  const top = h * LABEL_LAYOUT.bandTop
  const bottom = h * LABEL_LAYOUT.bandBottom
  const gTop = ctx.createLinearGradient(0, top, 0, top + depth)
  gTop.addColorStop(0, 'rgba(235,245,255,0.28)')
  gTop.addColorStop(1, 'rgba(235,245,255,0)')
  ctx.fillStyle = gTop
  ctx.fillRect(0, top, w, depth)
  const gBottom = ctx.createLinearGradient(0, bottom, 0, bottom - depth)
  gBottom.addColorStop(0, 'rgba(235,245,255,0.28)')
  gBottom.addColorStop(1, 'rgba(235,245,255,0)')
  ctx.fillStyle = gBottom
  ctx.fillRect(0, bottom - depth, w, depth)

  const rand = createRandom(seed)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  for (let i = 0; i < 1400; i++) {
    const nearTop = rand.next() < 0.5
    const t = Math.pow(rand.next(), 2.2) * depth
    const y = nearTop ? top + t : bottom - t
    ctx.fillRect(rand.next() * w, y, rand.range(1, 3), rand.range(1, 3))
  }
}

/** Full-color printed label for one flavor. */
export function drawLabel(drink: Drink, width: number) {
  const w = width
  const h = width / 2
  const { canvas, ctx } = createCanvas(w, h)
  const { accent, accentLight, accentDeep } = drink.colors

  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, accentLight)
  bg.addColorStop(0.42, accent)
  bg.addColorStop(1, accentDeep)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Soft spotlight behind the fruit on the front panel.
  const glow = ctx.createRadialGradient(w * 0.5, h * LABEL_LAYOUT.fruitY, 0, w * 0.5, h * LABEL_LAYOUT.fruitY, h * 0.45)
  glow.addColorStop(0, 'rgba(255,255,255,0.45)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Diagonal swooshes that wrap around the whole can.
  ctx.save()
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'
    ctx.beginPath()
    const y0 = h * (0.62 + i * 0.09)
    ctx.moveTo(0, y0)
    ctx.bezierCurveTo(w * 0.3, y0 - h * 0.18, w * 0.7, y0 + h * 0.16, w, y0)
    ctx.lineTo(w, y0 + h * 0.06)
    ctx.bezierCurveTo(w * 0.7, y0 + h * 0.22, w * 0.3, y0 - h * 0.12, 0, y0 + h * 0.06)
    ctx.fill()
  }
  ctx.restore()

  // Bubble pattern
  const rand = createRandom(drink.name.length * 131)
  ctx.save()
  for (let i = 0; i < 120; i++) {
    const r = rand.range(3, 22)
    const x = rand.next() * w
    const y = rand.range(0.1, 0.9) * h
    if (Math.abs(x - w * 0.5) < w * 0.14 && Math.abs(y - h * 0.5) < h * 0.38) continue
    ctx.strokeStyle = `rgba(255,255,255,${rand.range(0.12, 0.35)})`
    ctx.lineWidth = Math.max(1.5, r * 0.18)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  drawBackPanel(ctx, drink, w, h)
  drawFruitArt(ctx, drink.fruit, w * 0.5, h * LABEL_LAYOUT.fruitY, h * 0.21)

  // Brand: dark drop shadow, then bright pearl-white letters.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = h * 0.02
  ctx.shadowOffsetY = h * 0.008
  drawBrand(ctx, w, h, '#f4f6f8')
  ctx.restore()

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  fitFont(ctx, drink.name.toUpperCase(), 800, DISPLAY_FONT, h * 0.07, w * 0.3)
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = h * 0.015
  ctx.fillStyle = '#ffffff'
  ctx.fillText(drink.name.toUpperCase(), w * 0.5, h * LABEL_LAYOUT.nameY)
  ctx.shadowBlur = 0
  ctx.font = `600 ${Math.round(h * 0.026)}px ${BODY_FONT}`
  ctx.letterSpacing = `${Math.round(h * 0.006)}px`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('SPARKLING · ZERO SUGAR · REAL FRUIT', w * 0.5, h * (LABEL_LAYOUT.nameY + 0.075))
  ctx.restore()

  drawFrost(ctx, w, h, drink.id.charCodeAt(0))
  drawBands(ctx, w, h, '#d9dee4')
  return canvas
}

/** White where the label shows bare aluminium (the rim bands), black where it is painted. */
export function drawLabelMetalMask(width: number) {
  const w = width
  const h = width / 2
  const { canvas, ctx } = createCanvas(w, h)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  drawBands(ctx, w, h, '#ffffff')
  return canvas
}
