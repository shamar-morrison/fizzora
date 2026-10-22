import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect } from 'react'
import { setLenis, startScroll, stopScroll } from '../lib/scroll'
import { SECTION_COUNT } from '../scene/layout'
import { useAppStore } from '../store/useAppStore'

gsap.registerPlugin(ScrollTrigger)

/** Section centers in page coordinates; the continuous section position interpolates between them. */
function measureCenters() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
  return sections.map((el) => {
    const rect = el.getBoundingClientRect()
    return rect.top + window.scrollY + rect.height / 2
  })
}

function sectionPosition(centers: number[], viewCenter: number) {
  if (centers.length === 0) return 0
  if (viewCenter <= centers[0]) return 0
  for (let i = 0; i < centers.length - 1; i++) {
    if (viewCenter < centers[i + 1]) return i + (viewCenter - centers[i]) / (centers[i + 1] - centers[i])
  }
  return centers.length - 1
}

/**
 * Owns page scrolling: Lenis smooth scroll (skipped for reduced motion), GSAP ScrollTrigger sync,
 * the scroll lock before a drink is picked, and the continuous section position the scene reads.
 */
export function SmoothScroll() {
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const hasSelected = useAppStore((s) => s.hasSelected)

  useEffect(() => {
    let lenis: Lenis | null = null
    let tick: ((time: number) => void) | null = null
    if (!reducedMotion) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
      setLenis(lenis)
      lenis.on('scroll', ScrollTrigger.update)
      tick = (time: number) => lenis?.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      if (!useAppStore.getState().hasSelected) lenis.stop()
    }

    let centers = measureCenters()
    let lastSection = 0
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const y = window.scrollY
      const s = Math.min(SECTION_COUNT - 1, sectionPosition(centers, y + window.innerHeight / 2))
      const { setScroll, fireBurst, hasSelected: picked } = useAppStore.getState()
      setScroll(s, Math.min(1, y / max))

      // A small splash each time the page settles into a new section.
      const nearest = Math.round(s)
      if (picked && Math.abs(s - nearest) < 0.2 && nearest !== lastSection) {
        if (nearest > 0) fireBurst(nearest === SECTION_COUNT - 1 ? 'finale' : 'small')
        lastSection = nearest
      }
    }
    const remeasure = () => {
      centers = measureCenters()
      ScrollTrigger.refresh()
      update()
    }
    const observer = new ResizeObserver(remeasure)
    const main = document.getElementById('main')
    if (main) observer.observe(main)
    window.addEventListener('scroll', update, { passive: true })
    document.fonts.ready.then(remeasure).catch(() => undefined)
    update()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', update)
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
      setLenis(null)
    }
  }, [reducedMotion])

  // Lock scrolling below the hero until a drink has been picked.
  useEffect(() => {
    const root = document.documentElement
    if (hasSelected) {
      root.classList.remove('scroll-locked')
      startScroll()
      ScrollTrigger.refresh()
    } else {
      window.scrollTo(0, 0)
      root.classList.add('scroll-locked')
      stopScroll()
    }
  }, [hasSelected])

  return null
}
