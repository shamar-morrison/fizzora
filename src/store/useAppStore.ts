import { create } from 'zustand'
import { DRINK_COUNT, DRINKS, type Drink } from '../data/drinks'

export type PerformanceTier = 'low' | 'mid' | 'high'
export type WebGLStatus = 'pending' | 'ok' | 'failed'
export type BurstSize = 'small' | 'big' | 'finale'

export interface BurstEvent {
  id: number
  size: BurstSize
}

interface AppState {
  /** Index of the drink in focus. Drives theme, carousel and every section. */
  activeIndex: number
  /** Unwrapped carousel position so rotation always takes the short way round. */
  carouselTarget: number
  /** True once the user has picked a drink; unlocks scrolling below the hero. */
  hasSelected: boolean
  /** Bumped on each explicit pick so the scene can replay the lift and spin. */
  selectionNonce: number
  burst: BurstEvent
  tier: PerformanceTier
  /** Highest tier the device is allowed to climb back to. */
  tierCeiling: PerformanceTier
  isSmallScreen: boolean
  reducedMotion: boolean
  webgl: WebGLStatus
  sceneReady: boolean
  /** Continuous section position: 0 = hero, 1 = flavor story ... 6 = closing CTA. */
  sectionProgress: number
  /** 0..1 over the whole page. */
  scrollProgress: number

  rotateBy: (delta: number) => void
  focusIndex: (index: number) => void
  select: (index: number) => void
  switchDrink: (index: number) => void
  fireBurst: (size: BurstSize) => void
  setTier: (tier: PerformanceTier) => void
  setScroll: (sectionProgress: number, scrollProgress: number) => void
  setWebGL: (status: WebGLStatus) => void
  setSceneReady: () => void
  setEnvironment: (env: { reducedMotion: boolean; isSmallScreen: boolean }) => void
}

const TIER_ORDER: PerformanceTier[] = ['low', 'mid', 'high']

export const tierRank = (tier: PerformanceTier) => TIER_ORDER.indexOf(tier)

export const wrapIndex = (n: number) => ((n % DRINK_COUNT) + DRINK_COUNT) % DRINK_COUNT

/** Closest unwrapped carousel position that lands on `index`. */
function nearestTarget(current: number, index: number) {
  const delta = wrapIndex(index - current)
  return delta > DRINK_COUNT / 2 ? current + delta - DRINK_COUNT : current + delta
}

export const useAppStore = create<AppState>((set, get) => ({
  activeIndex: 0,
  carouselTarget: 0,
  hasSelected: false,
  selectionNonce: 0,
  burst: { id: 0, size: 'small' },
  tier: 'high',
  tierCeiling: 'high',
  isSmallScreen: false,
  reducedMotion: false,
  webgl: 'pending',
  sceneReady: false,
  sectionProgress: 0,
  scrollProgress: 0,

  rotateBy: (delta) => {
    const target = get().carouselTarget + delta
    set({ carouselTarget: target, activeIndex: wrapIndex(target) })
    if (get().hasSelected) get().fireBurst('small')
  },

  focusIndex: (index) => {
    const target = nearestTarget(get().carouselTarget, index)
    set({ carouselTarget: target, activeIndex: wrapIndex(target) })
  },

  select: (index) => {
    get().focusIndex(index)
    set((s) => ({ hasSelected: true, selectionNonce: s.selectionNonce + 1 }))
    get().fireBurst('big')
  },

  switchDrink: (index) => {
    if (index === get().activeIndex) return
    get().focusIndex(index)
    get().fireBurst('small')
  },

  fireBurst: (size) => set((s) => ({ burst: { id: s.burst.id + 1, size } })),

  setTier: (tier) => {
    const capped = tierRank(tier) > tierRank(get().tierCeiling) ? get().tierCeiling : tier
    if (capped !== get().tier) set({ tier: capped })
  },

  setScroll: (sectionProgress, scrollProgress) => set({ sectionProgress, scrollProgress }),
  setWebGL: (webgl) => set({ webgl }),
  setSceneReady: () => set({ sceneReady: true }),
  setEnvironment: ({ reducedMotion, isSmallScreen }) => set({ reducedMotion, isSmallScreen }),
}))

export const stepTier = (tier: PerformanceTier, step: 1 | -1): PerformanceTier =>
  TIER_ORDER[Math.min(TIER_ORDER.length - 1, Math.max(0, tierRank(tier) + step))]

export const useActiveDrink = (): Drink => useAppStore((s) => DRINKS[s.activeIndex])
