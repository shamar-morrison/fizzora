import { PerformanceMonitor } from '@react-three/drei'
import { stepTier, useAppStore } from '../store/useAppStore'

/** Steps the quality tier down when the frame rate drops and back up when there is headroom. */
export function PerformanceTier({ locked }: { locked: boolean }) {
  if (locked) return null
  const change = (step: 1 | -1) => {
    const { tier, setTier } = useAppStore.getState()
    setTier(stepTier(tier, step))
  }
  return (
    <PerformanceMonitor
      ms={400}
      iterations={8}
      flipflops={3}
      onIncline={() => change(1)}
      onDecline={() => change(-1)}
      onFallback={() => useAppStore.getState().setTier('low')}
    />
  )
}
