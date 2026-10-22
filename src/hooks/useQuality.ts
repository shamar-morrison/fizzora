import { useMemo } from 'react'
import { getQuality } from '../lib/quality'
import { useAppStore } from '../store/useAppStore'

export function useQuality() {
  const tier = useAppStore((s) => s.tier)
  const small = useAppStore((s) => s.isSmallScreen)
  return useMemo(() => getQuality(tier, small), [tier, small])
}
