import { KineticHeading } from '../components/KineticHeading'
import { Reveal } from '../components/Reveal'
import { useActiveDrink } from '../store/useAppStore'
import { BELOW_CAN, SectionShell } from './SectionShell'

export function FlavorStory() {
  const drink = useActiveDrink()
  return (
    <SectionShell id="flavor-story" index={1} labelledBy="flavor-story-title">
      <div className={`grid md:grid-cols-2 ${BELOW_CAN}`}>
        <Reveal key={drink.id} className="glass p-6 sm:p-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <p className="eyebrow" data-reveal>
            01 · The flavor
          </p>
          <KineticHeading
            id="flavor-story-title"
            text={drink.tagline}
            className="mt-4 font-display text-4xl leading-[1.02] font-extrabold tracking-tight uppercase sm:text-5xl lg:text-6xl"
          />
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80" data-reveal>
            {drink.story}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Flavor notes">
            {drink.flavorNotes.map((note) => (
              <li
                key={note}
                data-reveal
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition-colors duration-300 hover:border-accent-light hover:bg-accent/20"
              >
                {note}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </SectionShell>
  )
}
