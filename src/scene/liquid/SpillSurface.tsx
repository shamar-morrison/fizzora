import { useCallback } from 'react'
import { useQuality } from '../../hooks/useQuality'
import { isSurfaceParcel, parcels } from './liquidPhysics'
import { type AddBall, MetaballSurface } from './MetaballSurface'

/** The joined-up part of the splash as one continuous liquid surface (mid and high tiers); lone drops are drawn by SpillDrops. */
export function SpillSurface() {
  const { spillResolution } = useQuality()
  const fill = useCallback((add: AddBall) => {
    for (const p of parcels) {
      if (!isSurfaceParcel(p)) continue
      // A drop hitting the floor squashes down as it bursts into spray.
      const f = p.flatten
      add(p.position.x, p.position.y - p.size * 0.35 * f, p.position.z, p.size * (1 - 0.3 * f))
    }
  }, [])
  return <MetaballSurface key={spillResolution} resolution={spillResolution} fill={fill} minSide={0.6} maxSide={4.5} surfaces={3} packSide={1.8} thickness={0.35} maxPolyCount={20000} />
}
