import gsap from 'gsap'
import { useLayoutEffect, useRef, type ElementType } from 'react'
import { useAppStore } from '../store/useAppStore'

interface KineticHeadingProps {
  text: string
  as?: ElementType
  className?: string
  /** Animate on mount instead of when scrolled into view (used in the hero). */
  immediate?: boolean
  id?: string
}

/**
 * Heading whose letters rise out of word masks. Screen readers get the plain text;
 * the split letters are presentation only.
 */
export function KineticHeading({ text, as: Tag = 'h2', className = '', immediate = false, id }: KineticHeadingProps) {
  return (
    <Tag id={id} className={className}>
      <span className="sr-only">{text}</span>
      {/* Keyed by text so a new heading remounts and replays its entrance. */}
      <SplitLetters key={text} text={text} immediate={immediate} />
    </Tag>
  )
}

function SplitLetters({ text, immediate }: { text: string; immediate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const scrollTrigger = immediate ? undefined : { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, scrollTrigger })
        return
      }
      gsap.fromTo(
        el.querySelectorAll('[data-char]'),
        { yPercent: 115, rotate: 10, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.022, scrollTrigger },
      )
    }, el)
    return () => ctx.revert()
  }, [reducedMotion, immediate])

  const words = text.split(' ')
  return (
    <span ref={ref} aria-hidden="true">
      {words.map((word, w) => (
        <span key={`${word}-${w}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom whitespace-nowrap">
          {[...word].map((char, c) => (
            <span key={c} data-char className="inline-block origin-bottom-left will-change-transform">
              {char}
            </span>
          ))}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}
