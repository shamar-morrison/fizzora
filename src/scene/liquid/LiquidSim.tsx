import { useFrame } from '@react-three/fiber'
import { useEffect } from 'react'
import { useQuality } from '../../hooks/useQuality'
import { configureLiquid, emitLiquid, stepLiquid } from './liquidPhysics'
import { useBurst } from './useBurst'

/** Drives the splash sim: sizes its pools, turns bursts into emission and steps it before anything draws it. */
export function LiquidSim() {
  const { spillParcels, spray } = useQuality()
  useEffect(() => configureLiquid(spillParcels, spray), [spillParcels, spray])
  useBurst(emitLiquid)
  // Negative priority runs ahead of the renderers without taking over R3F's render loop.
  useFrame((_, delta) => stepLiquid(delta), -1)
  return null
}
