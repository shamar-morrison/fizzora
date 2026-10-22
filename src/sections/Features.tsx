import { KineticHeading } from '../components/KineticHeading'
import { Reveal } from '../components/Reveal'
import { TiltCard } from '../components/TiltCard'
import { useActiveDrink } from '../store/useAppStore'
import { SectionShell } from './SectionShell'

export function Features() {
  const drink = useActiveDrink()
  return (
    <SectionShell id="features" index={4} labelledBy="features-title">
      <Reveal key={drink.id} stagger={0.12} className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="eyebrow" data-reveal>
            04 · Why it hits different
          </p>
          <KineticHeading
            id="features-title"
            text="Built for the cold first sip."
            className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-5xl"
          />
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {drink.features.map((feature) => (
            <li key={feature.title} data-reveal>
              <TiltCard className="glass h-full rounded-3xl p-7 transition-colors duration-300 hover:border-accent-light/50">
                <p className="font-display text-5xl font-extrabold text-accent-light [transform:translateZ(40px)]">{feature.stat}</p>
                <h3 className="mt-5 font-display text-xl font-bold uppercase [transform:translateZ(25px)]">{feature.title}</h3>
                <p className="mt-2 text-white/75 [transform:translateZ(15px)]">{feature.body}</p>
              </TiltCard>
            </li>
          ))}
        </ul>
      </Reveal>
    </SectionShell>
  )
}
