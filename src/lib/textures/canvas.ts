import * as THREE from 'three'

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas is not available')
  return { canvas, ctx }
}

interface TextureOptions {
  srgb?: boolean
  repeat?: [number, number]
  anisotropy?: number
}

export function toTexture(canvas: HTMLCanvasElement, { srgb = false, repeat, anisotropy = 8 }: TextureOptions = {}) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.anisotropy = anisotropy
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  if (repeat) texture.repeat.set(repeat[0], repeat[1])
  texture.needsUpdate = true
  return texture
}

/**
 * Converts a grayscale height canvas (red channel) into a tangent-space normal map.
 * Edges wrap so tileable height maps stay seamless.
 */
export function heightToNormal(source: HTMLCanvasElement, strength: number) {
  const { width, height } = source
  const srcCtx = source.getContext('2d', { willReadFrequently: true })
  if (!srcCtx) throw new Error('2D canvas is not available')
  const src = srcCtx.getImageData(0, 0, width, height).data
  const { canvas, ctx } = createCanvas(width, height)
  const out = ctx.createImageData(width, height)
  const h = (x: number, y: number) => {
    const xi = (x + width) % width
    const yi = (y + height) % height
    return src[(yi * width + xi) * 4] / 255
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength
      // Canvas rows run top-down while texture v runs bottom-up, hence the flipped sign.
      const dy = (h(x, y - 1) - h(x, y + 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * width + x) * 4
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      out.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return canvas
}

/** Soft dome stamp used for droplets, bumps and pores on height maps. */
export function stampDome(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, peak = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, ry / rx)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
  const v = Math.round(255 * peak)
  g.addColorStop(0, `rgb(${v},${v},${v})`)
  g.addColorStop(0.55, `rgba(${v},${v},${v},0.8)`)
  g.addColorStop(0.85, `rgba(${v},${v},${v},0.3)`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Draws at x and, when near an edge, at the wrapped position too so tiles stay seamless. */
export function wrapDraw(width: number, height: number, x: number, y: number, r: number, draw: (x: number, y: number) => void) {
  const xs = [x]
  const ys = [y]
  if (x < r) xs.push(x + width)
  if (x > width - r) xs.push(x - width)
  if (y < r) ys.push(y + height)
  if (y > height - r) ys.push(y - height)
  for (const px of xs) for (const py of ys) draw(px, py)
}
