import { motion } from 'framer-motion'
import { DRINKS } from '../data/drinks'
import { useAppStore } from '../store/useAppStore'

/** Compact sticky flavor switcher built on native radio inputs (arrow keys move between flavors). */
export function DrinkSelector() {
  const activeIndex = useAppStore((s) => s.activeIndex)
  const switchDrink = useAppStore((s) => s.switchDrink)

  return (
    <fieldset className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl">
      <legend className="sr-only">Change drink</legend>
      {DRINKS.map((drink, i) => {
        const active = i === activeIndex
        return (
          <label
            key={drink.id}
            title={drink.name}
            className="group relative flex h-9 cursor-pointer items-center rounded-full px-1.5 transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <input
              type="radio"
              name="drink"
              value={drink.id}
              checked={active}
              onChange={() => switchDrink(i)}
              className="peer sr-only"
              aria-label={drink.name}
            />
            {active && (
              <motion.span
                layoutId="selector-pill"
                className="absolute inset-0 rounded-full bg-white/12"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span
              aria-hidden="true"
              className="relative size-6 rounded-full ring-2 ring-white/20 transition-[box-shadow] duration-300 group-hover:ring-white/60 peer-focus-visible:ring-4 peer-focus-visible:ring-white"
              style={{ background: `radial-gradient(circle at 35% 30%, ${drink.colors.accentLight}, ${drink.colors.accent} 55%, ${drink.colors.accentDeep})` }}
            />
            <span
              aria-hidden="true"
              className={`relative hidden overflow-hidden font-display text-[0.65rem] font-bold tracking-wider whitespace-nowrap uppercase transition-[max-width,margin,opacity] duration-500 lg:inline-block ${
                active ? 'ml-2 max-w-32 opacity-100' : 'ml-0 max-w-0 opacity-0'
              }`}
            >
              {drink.shortName}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
