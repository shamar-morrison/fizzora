export type DrinkId = 'cherry' | 'lime' | 'orange' | 'blueberry' | 'grape'

export type FruitKind = 'cherry' | 'lime' | 'orange' | 'blueberry' | 'grape'

export type FlavorAxis = 'sweet' | 'sour' | 'fizzy' | 'fruity' | 'tangy' | 'refreshing'

export interface DrinkColors {
  /** Main brand color of the flavor, used for UI accents and the label. */
  accent: string
  /** Lighter companion color for gradients and highlights. */
  accentLight: string
  /** Deep shade used for label shadows and dark gradient stops. */
  accentDeep: string
  /** Dark page background tuned to the flavor. */
  background: string
  /** Liquid tint for splashes and droplets. */
  liquid: string
  /** Text color that stays readable on top of `accent`. */
  onAccent: string
}

export interface NutritionFacts {
  servingMl: number
  calories: number
  sugarG: number
  carbsG: number
  sodiumMg: number
  vitaminCPercent: number
  caffeineMg: number
}

export interface Ingredient {
  name: string
  detail: string
}

export interface Feature {
  title: string
  body: string
  stat: string
}

export interface Drink {
  id: DrinkId
  name: string
  shortName: string
  tagline: string
  story: string
  fruit: FruitKind
  fruitLabel: string
  colors: DrinkColors
  flavorNotes: string[]
  ingredients: Ingredient[]
  nutrition: NutritionFacts
  features: Feature[]
  flavorProfile: Record<FlavorAxis, number>
}

export const FLAVOR_AXES: { id: FlavorAxis; label: string; description: string }[] = [
  { id: 'sweet', label: 'Sweet', description: 'How much natural sweetness comes through.' },
  { id: 'sour', label: 'Sour', description: 'The sharp, mouth-watering edge.' },
  { id: 'fizzy', label: 'Fizzy', description: 'Bubble size and carbonation punch.' },
  { id: 'fruity', label: 'Fruity', description: 'How loud the real fruit reads.' },
  { id: 'tangy', label: 'Tangy', description: 'Bright zest on the finish.' },
  { id: 'refreshing', label: 'Refreshing', description: 'That cold, clean reset after each sip.' },
]

const SHARED_FEATURES: Feature[] = [
  { title: 'Zero sugar', body: 'Sweetened with stevia leaf and monk fruit. No crash, no compromise.', stat: '0 g' },
  { title: 'Real fruit juice', body: 'Pressed fruit in every can, not just flavoring and a picture on the label.', stat: '10%' },
  { title: 'Extra fizz', body: 'Carbonated colder and harder for a sharper, longer-lasting sparkle.', stat: '4.2 vol' },
  { title: 'Plant-based color', body: 'Colored with fruit and vegetable extracts. Nothing synthetic.', stat: '100%' },
]

export const DRINKS: Drink[] = [
  {
    id: 'cherry',
    name: 'Cherry Blast',
    shortName: 'Cherry',
    tagline: 'Dark cherry. Loud fizz.',
    story:
      'Sun-ripened dark cherries meet a hard sparkle. Deep, juicy and a little bit rebellious, with a clean almond-blossom finish.',
    fruit: 'cherry',
    fruitLabel: 'Dark cherries',
    colors: {
      accent: '#e3173e',
      accentLight: '#ff6b81',
      accentDeep: '#6e0518',
      background: '#1a0408',
      liquid: '#ff1f4b',
      onAccent: '#ffffff',
    },
    flavorNotes: ['Dark cherry', 'Almond blossom', 'Black currant'],
    ingredients: [
      { name: 'Sparkling water', detail: 'Triple-filtered, chilled to 2 °C' },
      { name: 'Cherry juice', detail: 'From Montmorency and Bing cherries' },
      { name: 'Lemon juice', detail: 'A squeeze for brightness' },
      { name: 'Stevia leaf', detail: 'Plant-based sweetness, zero sugar' },
      { name: 'Black carrot extract', detail: 'For that deep ruby color' },
    ],
    nutrition: { servingMl: 330, calories: 15, sugarG: 0, carbsG: 4, sodiumMg: 20, vitaminCPercent: 30, caffeineMg: 0 },
    features: SHARED_FEATURES,
    flavorProfile: { sweet: 72, sour: 38, fizzy: 85, fruity: 90, tangy: 35, refreshing: 70 },
  },
  {
    id: 'lime',
    name: 'Lime Rush',
    shortName: 'Lime',
    tagline: 'Zest first. Questions later.',
    story:
      'Hand-cut Persian limes and a crack of sea salt. Sharp, green and electric, like the first sip on the hottest day of the year.',
    fruit: 'lime',
    fruitLabel: 'Persian limes',
    colors: {
      accent: '#52c41a',
      accentLight: '#b7f25a',
      accentDeep: '#17520a',
      background: '#061407',
      liquid: '#7ee03a',
      onAccent: '#08200a',
    },
    flavorNotes: ['Lime zest', 'Sea salt', 'Mint leaf'],
    ingredients: [
      { name: 'Sparkling water', detail: 'Triple-filtered, chilled to 2 °C' },
      { name: 'Lime juice', detail: 'Pressed from whole Persian limes' },
      { name: 'Lime peel oil', detail: 'Cold-pressed for zest' },
      { name: 'Sea salt', detail: 'A pinch to make the lime pop' },
      { name: 'Monk fruit', detail: 'Plant-based sweetness, zero sugar' },
    ],
    nutrition: { servingMl: 330, calories: 10, sugarG: 0, carbsG: 3, sodiumMg: 45, vitaminCPercent: 40, caffeineMg: 0 },
    features: SHARED_FEATURES,
    flavorProfile: { sweet: 40, sour: 88, fizzy: 92, fruity: 70, tangy: 90, refreshing: 95 },
  },
  {
    id: 'orange',
    name: 'Orange Zing',
    shortName: 'Orange',
    tagline: 'Pure sunshine, carbonated.',
    story:
      'Blood oranges and Valencia sweetness with a sprinkle of ginger. Bright, round and impossible to drink slowly.',
    fruit: 'orange',
    fruitLabel: 'Valencia oranges',
    colors: {
      accent: '#ff7a00',
      accentLight: '#ffc24a',
      accentDeep: '#7a2e00',
      background: '#1a0b02',
      liquid: '#ff8c1a',
      onAccent: '#2a1000',
    },
    flavorNotes: ['Valencia orange', 'Blood orange', 'Fresh ginger'],
    ingredients: [
      { name: 'Sparkling water', detail: 'Triple-filtered, chilled to 2 °C' },
      { name: 'Orange juice', detail: 'Valencia and blood orange blend' },
      { name: 'Ginger extract', detail: 'Just enough warmth' },
      { name: 'Stevia leaf', detail: 'Plant-based sweetness, zero sugar' },
      { name: 'Paprika extract', detail: 'For a natural sunset color' },
    ],
    nutrition: { servingMl: 330, calories: 18, sugarG: 0, carbsG: 5, sodiumMg: 15, vitaminCPercent: 60, caffeineMg: 0 },
    features: SHARED_FEATURES,
    flavorProfile: { sweet: 80, sour: 45, fizzy: 75, fruity: 88, tangy: 70, refreshing: 78 },
  },
  {
    id: 'blueberry',
    name: 'Blueberry Wave',
    shortName: 'Blueberry',
    tagline: 'Cool, deep and a little wild.',
    story:
      'Wild mountain blueberries with a whisper of lavender. Smooth and mellow up front, with a crisp wave of fizz behind it.',
    fruit: 'blueberry',
    fruitLabel: 'Wild blueberries',
    colors: {
      accent: '#2f6bff',
      accentLight: '#8fb4ff',
      accentDeep: '#0b1f66',
      background: '#040a1c',
      liquid: '#3d7bff',
      onAccent: '#ffffff',
    },
    flavorNotes: ['Wild blueberry', 'Lavender', 'Vanilla bean'],
    ingredients: [
      { name: 'Sparkling water', detail: 'Triple-filtered, chilled to 2 °C' },
      { name: 'Blueberry juice', detail: 'From wild mountain blueberries' },
      { name: 'Lavender extract', detail: 'A soft floral lift' },
      { name: 'Monk fruit', detail: 'Plant-based sweetness, zero sugar' },
      { name: 'Spirulina extract', detail: 'For that ocean-blue color' },
    ],
    nutrition: { servingMl: 330, calories: 12, sugarG: 0, carbsG: 4, sodiumMg: 18, vitaminCPercent: 25, caffeineMg: 0 },
    features: SHARED_FEATURES,
    flavorProfile: { sweet: 70, sour: 30, fizzy: 70, fruity: 82, tangy: 28, refreshing: 85 },
  },
  {
    id: 'grape',
    name: 'Grape Storm',
    shortName: 'Grape',
    tagline: 'Thunder in a can.',
    story:
      'Concord grapes, a splash of blackberry and a lightning-strike of fizz. Bold, purple and built for big moments.',
    fruit: 'grape',
    fruitLabel: 'Concord grapes',
    colors: {
      accent: '#9b3dff',
      accentLight: '#d1a3ff',
      accentDeep: '#3a0a6e',
      background: '#0f0419',
      liquid: '#a24dff',
      onAccent: '#ffffff',
    },
    flavorNotes: ['Concord grape', 'Blackberry', 'Violet'],
    ingredients: [
      { name: 'Sparkling water', detail: 'Triple-filtered, chilled to 2 °C' },
      { name: 'Grape juice', detail: 'From whole Concord grapes' },
      { name: 'Blackberry juice', detail: 'For depth and a little tartness' },
      { name: 'Stevia leaf', detail: 'Plant-based sweetness, zero sugar' },
      { name: 'Purple sweet potato extract', detail: 'For the storm-cloud color' },
    ],
    nutrition: { servingMl: 330, calories: 16, sugarG: 0, carbsG: 5, sodiumMg: 22, vitaminCPercent: 20, caffeineMg: 0 },
    features: SHARED_FEATURES,
    flavorProfile: { sweet: 85, sour: 35, fizzy: 88, fruity: 80, tangy: 42, refreshing: 65 },
  },
]

export const DRINK_COUNT = DRINKS.length
