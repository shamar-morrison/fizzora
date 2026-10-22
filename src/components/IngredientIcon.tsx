type IconKind = 'water' | 'fruit' | 'leaf' | 'salt' | 'spark' | 'root' | 'flower'

/** Picks an icon from the ingredient name. */
function iconFor(name: string): IconKind {
  const n = name.toLowerCase()
  if (n.includes('water')) return 'water'
  if (n.includes('stevia') || n.includes('monk')) return 'leaf'
  if (n.includes('salt')) return 'salt'
  if (n.includes('ginger')) return 'root'
  if (n.includes('lavender')) return 'flower'
  if (n.includes('extract') || n.includes('oil')) return 'spark'
  return 'fruit'
}

const PATHS: Record<IconKind, string> = {
  water: 'M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3Z',
  fruit: 'M12 7.5c-4.4-2-8 .9-8 5.4C4 17.5 7.3 21 12 21s8-3.5 8-8.1c0-4.5-3.6-7.4-8-5.4Zm0 0c0-2.2 1-3.8 3-4.5',
  leaf: 'M5 19C5 10 10 5 20 4c-.5 9.5-5.5 15-15 15Zm0 0 8-8',
  salt: 'M6 9.5 9.5 6 13 9.5 9.5 13 6 9.5Zm8 4 2.5-2.5 2.5 2.5-2.5 2.5-2.5-2.5ZM7 17l2-2 2 2-2 2-2-2Z',
  spark: 'M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8 2.8 2.8m0-11.4-2.8 2.8m-5.8 5.8-2.8 2.8',
  root: 'M12 3c-2 2.5-2 5 0 7.5 2 2.5 2 5 0 7.5m0-7.5c-3 .5-5 2.5-6 5m6-5c3 .5 5 2.5 6 5',
  flower: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-6v6m0 6v6M4.2 7.5l5.2 3m5.2 3 5.2 3m0-9-5.2 3m-5.2 3-5.2 3',
}

export function IngredientIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[iconFor(name)]} />
    </svg>
  )
}
