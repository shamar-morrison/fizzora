import type { PerformanceTier } from '../store/useAppStore'

const TIERS: PerformanceTier[] = ['low', 'mid', 'high']

export interface DeviceProfile {
  tier: PerformanceTier
  ceiling: PerformanceTier
  /** True when `?tier=` forced a tier, which also turns off automatic tier changes. */
  tierLocked: boolean
  isSmallScreen: boolean
  reducedMotion: boolean
  webglSupported: boolean
}

export const SMALL_SCREEN_QUERY = '(max-width: 767px)'
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return gl !== null
  } catch {
    return false
  }
}

/** Initial quality guess from the device; PerformanceMonitor refines it at runtime. */
export function detectDevice(): DeviceProfile {
  const params = new URLSearchParams(window.location.search)
  const small = window.matchMedia(SMALL_SCREEN_QUERY).matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const phone = small || (coarse && Math.min(window.screen.width, window.screen.height) < 820)
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8

  let tier: PerformanceTier = phone ? 'low' : cores <= 4 || memory <= 4 ? 'mid' : 'high'
  let ceiling: PerformanceTier = phone ? 'mid' : 'high'
  const forced = params.get('tier')
  const tierLocked = TIERS.includes(forced as PerformanceTier)
  if (tierLocked) {
    tier = forced as PerformanceTier
    ceiling = tier
  }

  return {
    tier,
    ceiling,
    tierLocked,
    isSmallScreen: small,
    reducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches || params.has('reduced-motion'),
    webglSupported: !params.has('no-webgl') && supportsWebGL(),
  }
}
