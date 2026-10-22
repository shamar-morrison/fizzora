import type Lenis from 'lenis'

let lenis: Lenis | null = null

export const setLenis = (instance: Lenis | null) => {
  lenis = instance
}

/** Smooth-scrolls to an element (Lenis when available, native otherwise). */
export function scrollToElement(target: HTMLElement | number, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { duration: immediate ? 0 : 1.6, immediate, force: true })
    return
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' })
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) scrollToElement(el)
}

export const stopScroll = () => lenis?.stop()
export const startScroll = () => lenis?.start()
