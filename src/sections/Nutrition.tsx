import { CountUp } from '../components/CountUp'
import { KineticHeading } from '../components/KineticHeading'
import { Reveal } from '../components/Reveal'
import { useActiveDrink } from '../store/useAppStore'
import { BELOW_CAN, SectionShell } from './SectionShell'

interface Row {
  label: string
  value: number
  unit: string
  /** Share of a reference daily intake, drives the bar. */
  daily: number
}

export function Nutrition() {
  const drink = useActiveDrink()
  const n = drink.nutrition
  const rows: Row[] = [
    { label: 'Total sugar', value: n.sugarG, unit: ' g', daily: 0 },
    { label: 'Carbohydrates', value: n.carbsG, unit: ' g', daily: n.carbsG / 275 },
    { label: 'Sodium', value: n.sodiumMg, unit: ' mg', daily: n.sodiumMg / 2300 },
    { label: 'Vitamin C', value: n.vitaminCPercent, unit: '%', daily: n.vitaminCPercent / 100 },
    { label: 'Caffeine', value: n.caffeineMg, unit: ' mg', daily: 0 },
  ]

  return (
    <SectionShell id="nutrition" index={3} labelledBy="nutrition-title">
      <div className={`grid md:grid-cols-2 ${BELOW_CAN}`}>
        <Reveal key={drink.id}>
          <p className="eyebrow" data-reveal>
            03 · Nutrition facts
          </p>
          <KineticHeading
            id="nutrition-title"
            text="Light on everything but taste."
            className="mt-4 font-display text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-5xl"
          />
          <div data-reveal className="glass mt-8 max-w-md p-6 sm:p-8">
            <div className="flex items-end justify-between border-b-8 border-white/80 pb-4">
              <div>
                <p className="font-display text-lg font-extrabold uppercase">Nutrition</p>
                <p className="text-sm text-white/70">Per can ({n.servingMl} ml)</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">Calories</p>
                <CountUp value={n.calories} className="font-display text-5xl leading-none font-extrabold text-accent-light" />
              </div>
            </div>
            <dl className="divide-y divide-white/10">
              {rows.map((row) => (
                <div key={row.label} className="py-3">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-sm font-medium text-white/85">{row.label}</dt>
                    <dd className="font-display text-base font-bold">
                      <CountUp value={row.value} suffix={row.unit} />
                    </dd>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-[width] duration-1000 ease-out"
                      style={{ width: `${Math.max(2, Math.min(100, row.daily * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-white/60">Bars show share of a typical adult daily reference intake.</p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}
