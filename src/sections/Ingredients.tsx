import { IngredientIcon } from '../components/IngredientIcon'
import { KineticHeading } from '../components/KineticHeading'
import { Reveal } from '../components/Reveal'
import { useActiveDrink } from '../store/useAppStore'
import { BELOW_CAN, SectionShell } from './SectionShell'

export function Ingredients() {
  const drink = useActiveDrink()
  return (
    <SectionShell id="ingredients" index={2} labelledBy="ingredients-title">
      <div className={`grid md:grid-cols-2 ${BELOW_CAN}`}>
        <div className="md:col-start-2">
          <Reveal key={drink.id} stagger={0.1}>
            <p className="eyebrow" data-reveal>
              02 · What's inside
            </p>
            <KineticHeading
              id="ingredients-title"
              text="Five things. All real."
              className="mt-4 font-display text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-5xl"
            />
            <ul className="mt-8 grid gap-3">
              {drink.ingredients.map((item, i) => (
                <li
                  key={item.name}
                  data-reveal
                  className="group glass flex items-center gap-4 p-4 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-accent-light/60 hover:bg-black/50"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/25 text-accent-light ring-1 ring-accent-light/30 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                    <IngredientIcon name={item.name} className="size-6" />
                  </span>
                  <span>
                    <span className="block font-display text-sm font-bold tracking-wide uppercase">
                      <span className="mr-2 text-white/50 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-white/70">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  )
}
