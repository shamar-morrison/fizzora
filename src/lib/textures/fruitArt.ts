import type { FruitKind } from '../../data/drinks'

type Ctx = CanvasRenderingContext2D

const TAU = Math.PI * 2

function glossyBall(ctx: Ctx, x: number, y: number, r: number, light: string, mid: string, dark: string) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r)
  g.addColorStop(0, light)
  g.addColorStop(0.45, mid)
  g.addColorStop(1, dark)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
  ctx.save()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, TAU)
  ctx.fill()
  ctx.restore()
}

function leaf(ctx: Ctx, x: number, y: number, len: number, angle: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const g = ctx.createLinearGradient(0, 0, len, 0)
  g.addColorStop(0, '#2f8a2a')
  g.addColorStop(1, '#8fd14f')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0)
  ctx.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0)
  ctx.fill()
  ctx.strokeStyle = 'rgba(20,70,20,0.6)'
  ctx.lineWidth = len * 0.03
  ctx.beginPath()
  ctx.moveTo(len * 0.05, 0)
  ctx.lineTo(len * 0.9, 0)
  ctx.stroke()
  ctx.restore()
}

function drawCherries(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#4d6b1f'
  ctx.lineWidth = s * 0.045
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.42, cy + s * 0.18)
  ctx.quadraticCurveTo(cx - s * 0.25, cy - s * 0.55, cx + s * 0.08, cy - s * 0.82)
  ctx.moveTo(cx + s * 0.38, cy + s * 0.28)
  ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.45, cx + s * 0.08, cy - s * 0.82)
  ctx.stroke()
  leaf(ctx, cx + s * 0.08, cy - s * 0.82, s * 0.6, -0.35)
  glossyBall(ctx, cx - s * 0.42, cy + s * 0.48, s * 0.4, '#ff7a8a', '#c4102c', '#4a0010')
  glossyBall(ctx, cx + s * 0.38, cy + s * 0.58, s * 0.42, '#ff7a8a', '#d0122f', '#4a0010')
}

function drawCitrusWheel(ctx: Ctx, cx: number, cy: number, r: number, peel: string, peelDark: string, flesh: string, fleshLight: string, segments: number) {
  ctx.fillStyle = peelDark
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, TAU)
  ctx.fill()
  ctx.fillStyle = peel
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.95, 0, TAU)
  ctx.fill()
  ctx.fillStyle = '#fbf6df'
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.86, 0, TAU)
  ctx.fill()
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * TAU + 0.05
    const a1 = ((i + 1) / segments) * TAU - 0.05
    const g = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r * 0.8)
    g.addColorStop(0, fleshLight)
    g.addColorStop(1, flesh)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos((a0 + a1) / 2) * r * 0.09, cy + Math.sin((a0 + a1) / 2) * r * 0.09)
    ctx.arc(cx, cy, r * 0.8, a0, a1)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = r * 0.012
    for (let k = 0; k < 5; k++) {
      const a = a0 + ((a1 - a0) * (k + 0.5)) / 5
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25)
      ctx.lineTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72)
      ctx.stroke()
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.12, -0.7, 0, TAU)
  ctx.fill()
}

function drawLime(ctx: Ctx, cx: number, cy: number, s: number) {
  drawCitrusWheel(ctx, cx + s * 0.18, cy + s * 0.1, s * 0.78, '#4caf2a', '#1f6d14', '#9be04e', '#e4ffb3', 10)
  leaf(ctx, cx - s * 0.45, cy - s * 0.55, s * 0.62, -2.4)
}

function drawOrange(ctx: Ctx, cx: number, cy: number, s: number) {
  drawCitrusWheel(ctx, cx, cy + s * 0.05, s * 0.8, '#ff8a00', '#c24e00', '#ff9a1f', '#ffe08a', 11)
  leaf(ctx, cx + s * 0.35, cy - s * 0.7, s * 0.55, -0.6)
}

function drawBlueberries(ctx: Ctx, cx: number, cy: number, s: number) {
  const berries: [number, number, number][] = [
    [-0.42, 0.1, 0.36],
    [0.3, -0.05, 0.4],
    [-0.05, 0.5, 0.38],
    [0.42, 0.55, 0.3],
    [-0.12, -0.42, 0.3],
  ]
  for (const [bx, by, br] of berries) {
    const x = cx + bx * s
    const y = cy + by * s
    const r = br * s
    glossyBall(ctx, x, y, r, '#9db8ff', '#2c47b8', '#0b1240')
    ctx.fillStyle = 'rgba(160,180,255,0.18)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, TAU)
    ctx.fill()
    ctx.fillStyle = '#121a4a'
    ctx.beginPath()
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU - Math.PI / 2
      ctx.lineTo(x + r * 0.05 + Math.cos(a) * r * 0.2, y - r * 0.45 + Math.sin(a) * r * 0.2)
      ctx.lineTo(x + r * 0.05 + Math.cos(a + TAU / 10) * r * 0.08, y - r * 0.45 + Math.sin(a + TAU / 10) * r * 0.08)
    }
    ctx.fill()
  }
  leaf(ctx, cx + s * 0.1, cy - s * 0.7, s * 0.5, -0.9)
}

function drawGrapes(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.strokeStyle = '#5a7a24'
  ctx.lineWidth = s * 0.05
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy - s * 0.55)
  ctx.quadraticCurveTo(cx + s * 0.05, cy - s * 0.8, cx - s * 0.12, cy - s * 0.95)
  ctx.stroke()
  leaf(ctx, cx + s * 0.02, cy - s * 0.78, s * 0.62, -0.45)
  const rows = [4, 4, 3, 3, 2, 1]
  const r = s * 0.17
  rows.forEach((count, row) => {
    for (let i = 0; i < count; i++) {
      const x = cx + (i - (count - 1) / 2) * r * 1.75 + (row % 2) * r * 0.2
      const y = cy - s * 0.42 + row * r * 1.5
      glossyBall(ctx, x, y, r, '#e3b8ff', '#7a1fc4', '#2a0646')
    }
  })
}

/** Flat-but-glossy fruit illustration used on can labels. */
export function drawFruitArt(ctx: Ctx, kind: FruitKind, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = size * 0.12
  ctx.shadowOffsetY = size * 0.05
  switch (kind) {
    case 'cherry':
      drawCherries(ctx, cx, cy, size)
      break
    case 'lime':
      drawLime(ctx, cx, cy, size)
      break
    case 'orange':
      drawOrange(ctx, cx, cy, size)
      break
    case 'blueberry':
      drawBlueberries(ctx, cx, cy, size)
      break
    case 'grape':
      drawGrapes(ctx, cx, cy, size)
      break
  }
  ctx.restore()
}
