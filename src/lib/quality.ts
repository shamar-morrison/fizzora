import type { PerformanceTier } from '../store/useAppStore'

export interface QualitySettings {
  ambientCans: number
  ambientFruits: number
  ambientDroplets: number
  sectionFruits: number
  /** Fluid parcels in the spill sim, drawn as metaballs (or instanced drops on low). */
  spillParcels: number
  /** Marching-cubes grid size for the spill; 0 draws parcels as instanced drops instead. */
  spillResolution: number
  /** Tiny ballistic drops shed by the spill and the fizz. */
  spray: number
  burstFruits: number
  bubbles: number
  blobDetail: number
  /** Marching-cubes grid size for the floating blobs; 0 keeps the cheap wobbling mesh. */
  blobResolution: number
  contactShadowResolution: number
}

const BASE: Record<PerformanceTier, QualitySettings> = {
  high: { ambientCans: 15, ambientFruits: 22, ambientDroplets: 18, sectionFruits: 8, spillParcels: 96, spillResolution: 40, spray: 260, burstFruits: 10, bubbles: 70, blobDetail: 4, blobResolution: 28, contactShadowResolution: 1024 },
  mid: { ambientCans: 10, ambientFruits: 16, ambientDroplets: 12, sectionFruits: 7, spillParcels: 64, spillResolution: 30, spray: 160, burstFruits: 7, bubbles: 45, blobDetail: 3, blobResolution: 24, contactShadowResolution: 512 },
  low: { ambientCans: 5, ambientFruits: 10, ambientDroplets: 8, sectionFruits: 5, spillParcels: 40, spillResolution: 0, spray: 90, burstFruits: 4, bubbles: 24, blobDetail: 2, blobResolution: 0, contactShadowResolution: 256 },
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
