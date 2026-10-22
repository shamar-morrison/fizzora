import type { PerformanceTier } from '../store/useAppStore'

export interface QualitySettings {
  ambientCans: number
  ambientFruits: number
  ambientDroplets: number
  sectionFruits: number
  burstDroplets: number
  burstFruits: number
  bubbles: number
  blobDetail: number
  contactShadowResolution: number
}

const BASE: Record<PerformanceTier, QualitySettings> = {
  high: { ambientCans: 15, ambientFruits: 22, ambientDroplets: 18, sectionFruits: 8, burstDroplets: 220, burstFruits: 10, bubbles: 90, blobDetail: 4, contactShadowResolution: 1024 },
  mid: { ambientCans: 10, ambientFruits: 16, ambientDroplets: 12, sectionFruits: 7, burstDroplets: 140, burstFruits: 7, bubbles: 60, blobDetail: 3, contactShadowResolution: 512 },
  low: { ambientCans: 5, ambientFruits: 10, ambientDroplets: 8, sectionFruits: 5, burstDroplets: 70, burstFruits: 4, bubbles: 30, blobDetail: 2, contactShadowResolution: 256 },
}

/** Particle and object budgets for a tier; small screens get fewer floating objects. */
export function getQuality(tier: PerformanceTier, smallScreen: boolean): QualitySettings {
  const q = BASE[tier]
  if (!smallScreen) return q
  return {
    ...q,
    ambientCans: Math.max(5, Math.round(q.ambientCans * 0.6)),
    ambientFruits: Math.round(q.ambientFruits * 0.6),
    ambientDroplets: Math.round(q.ambientDroplets * 0.6),
  }
}
