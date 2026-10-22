import { useEffect } from 'react'
import { useActiveDrink } from '../store/useAppStore'

/** Mirrors the active drink's palette into CSS custom properties (animated via @property in CSS). */
export function ThemeSync() {
  const { colors } = useActiveDrink()
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--accent', colors.accent)
    root.setProperty('--accent-light', colors.accentLight)
    root.setProperty('--accent-deep', colors.accentDeep)
    root.setProperty('--bg', colors.background)
    root.setProperty('--on-accent', colors.onAccent)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.background)
  }, [colors])
  return null
}
