export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Frame-rate independent exponential damping toward a target. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3)

export const easeInOutCubic = (t: number) => {
  const x = clamp(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export interface SpringState {
  value: number
  velocity: number
}

/** Semi-implicit spring step. Lower damping ratios give a little overshoot. */
export function stepSpring(s: SpringState, target: number, dt: number, stiffness = 120, damping = 18) {
  const step = Math.min(dt, 1 / 30)
  s.velocity += ((target - s.value) * stiffness - s.velocity * damping) * step
  s.value += s.velocity * step
  return s.value
}

/** Wraps an angle into [-PI, PI]. */
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
