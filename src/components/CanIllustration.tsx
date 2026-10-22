import type { Drink } from '../data/drinks'

interface CanIllustrationProps {
  drink: Drink
  className?: string
}

/** Flat SVG can used by the no-WebGL fallback. */
export function CanIllustration({ drink, className = '' }: CanIllustrationProps) {
  const { accent, accentLight, accentDeep } = drink.colors
  const id = `can-${drink.id}`
  return (
    <svg viewBox="0 0 120 220" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1">
          <stop offset="0" stopColor={accentDeep} />
          <stop offset="0.35" stopColor={accentLight} />
          <stop offset="0.6" stopColor={accent} />
          <stop offset="1" stopColor={accentDeep} />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" x2="1">
          <stop offset="0" stopColor="#6b7178" />
          <stop offset="0.4" stopColor="#f2f4f6" />
          <stop offset="1" stopColor="#5d636a" />
        </linearGradient>
      </defs>
      <path d="M22 18 Q24 8 36 6 H84 Q96 8 98 18 V30 H22 Z" fill={`url(#${id}-metal)`} />
      <rect x="14" y="28" width="92" height="166" rx="8" fill={`url(#${id}-body)`} />
      <path d="M14 186 Q16 212 36 214 H84 Q104 212 106 186 Z" fill={`url(#${id}-metal)`} />
      <rect x="14" y="28" width="92" height="10" fill={`url(#${id}-metal)`} opacity="0.9" />
      <text x="60" y="76" textAnchor="middle" fontFamily="Unbounded Variable, sans-serif" fontWeight="800" fontSize="15" fill="#eef1f4">
        FIZZORA
      </text>
      <circle cx="60" cy="116" r="22" fill="rgba(255,255,255,0.25)" />
      <text x="60" y="160" textAnchor="middle" fontFamily="Unbounded Variable, sans-serif" fontWeight="700" fontSize="8.5" fill="#ffffff">
        {drink.name.toUpperCase()}
      </text>
      <rect x="30" y="34" width="8" height="150" rx="4" fill="rgba(255,255,255,0.28)" />
    </svg>
  )
}
