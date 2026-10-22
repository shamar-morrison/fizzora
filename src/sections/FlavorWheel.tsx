import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { KineticHeading } from '../components/KineticHeading'
import { Reveal } from '../components/Reveal'
import { FLAVOR_AXES, type FlavorAxis } from '../data/drinks'
import { useActiveDrink, useAppStore } from '../store/useAppStore'
import { BELOW_CAN, SectionShell } from './SectionShell'

const R = 150
const INNER = 52
const SLICE = (Math.PI * 2) / FLAVOR_AXES.length
const GAP = 0.035

const point = (angle: number, r: number) => `${(Math.cos(angle) * r).toFixed(2)} ${(Math.sin(angle) * r).toFixed(2)}`

/** Annular wedge for axis `i` reaching out to radius `r`. Same command structure for every r, so it tweens. */
function wedge(i: number, r: number) {
  const a0 = i * SLICE - Math.PI / 2 + GAP
  const a1 = (i + 1) * SLICE - Math.PI / 2 - GAP
  return `M ${point(a0, INNER)} L ${point(a0, r)} A ${r} ${r} 0 0 1 ${point(a1, r)} L ${point(a1, INNER)} A ${INNER} ${INNER} 0 0 0 ${point(a0, INNER)} Z`
}

const radiusFor = (value: number) => INNER + 6 + ((R - INNER - 6) * value) / 100

export function FlavorWheel() {
  const drink = useActiveDrink()
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const wheelRef = useRef<SVGSVGElement>(null)
  const inView = useInView(wheelRef, { once: true, amount: 0.4 })
  const [focus, setFocus] = useState<FlavorAxis>('fizzy')
  const axis = FLAVOR_AXES.find((a) => a.id === focus) ?? FLAVOR_AXES[0]
  const transition = { duration: reducedMotion ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <SectionShell id="flavor-wheel" index={5} labelledBy="flavor-wheel-title">
      <div className={`grid items-center gap-10 md:grid-cols-2 ${BELOW_CAN}`}>
        <Reveal key={drink.id}>
          <p className="eyebrow" data-reveal>
            05 · Flavor profile
          </p>
          <KineticHeading
            id="flavor-wheel-title"
            text={`How ${drink.shortName} tastes`}
            className="mt-4 font-display text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-5xl"
          />
          <div data-reveal className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,320px)_1fr]">
            <svg ref={wheelRef} viewBox={`${-R - 6} ${-R - 6} ${(R + 6) * 2} ${(R + 6) * 2}`} className="mx-auto w-full max-w-[320px]" aria-hidden="true">
              {FLAVOR_AXES.map((a, i) => {
                const value = drink.flavorProfile[a.id]
                const active = a.id === focus
                return (
                  <g key={a.id} onPointerEnter={() => setFocus(a.id)} className="cursor-pointer">
                    <path d={wedge(i, R)} fill="rgba(255,255,255,0.06)" />
                    <motion.path
                      initial={false}
                      animate={{ d: wedge(i, inView ? radiusFor(value) : INNER + 1) }}
                      transition={{ ...transition, delay: inView ? i * 0.08 : 0 }}
                      fill={active ? 'var(--accent-light)' : 'var(--accent)'}
                      opacity={active ? 1 : 0.75}
                      className="transition-[fill,opacity] duration-300"
                    />
                  </g>
                )
              })}
              <circle r={INNER - 6} fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" />
              <text textAnchor="middle" y={-4} className="fill-white font-display text-[26px] font-extrabold">
                {drink.flavorProfile[focus]}
              </text>
              <text textAnchor="middle" y={18} className="fill-white/70 font-display text-[10px] font-semibold tracking-[0.2em] uppercase">
                {axis.label}
              </text>
            </svg>

            <div>
              <p className="min-h-12 text-white/80" aria-live="polite">
                <span className="font-semibold text-white">{axis.label}: </span>
                {axis.description}
              </p>
              <ul className="mt-4 grid gap-2" aria-label={`${drink.name} flavor profile`}>
                {FLAVOR_AXES.map((a) => {
                  const value = drink.flavorProfile[a.id]
                  const active = a.id === focus
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFocus(a.id)}
                        onFocus={() => setFocus(a.id)}
                        onPointerEnter={() => setFocus(a.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-300 ${active ? 'bg-white/12' : 'hover:bg-white/6'}`}
                      >
                        <span className="w-24 shrink-0 text-sm font-semibold">{a.label}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <motion.span
                            className="block h-full rounded-full bg-accent-light"
                            initial={false}
                            animate={{ width: inView ? `${value}%` : '0%' }}
                            transition={transition}
                          />
                        </span>
                        <span className="w-8 text-right text-sm tabular-nums text-white/80">{value}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}
