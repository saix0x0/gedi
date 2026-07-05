import placesData from './data/places.json'

export type Quest = 'main' | 'side' | 'special'
export type Theme = 'cyber' | 'rdr'

export interface Place {
  id: string
  name: string
  area: string
  category: string
  quest: Quest
  collections: string[]
  description: string
  lat: number
  lng: number
  budget: string
  bestTime: string
  duration: string
  metro: string
  xp: number
  maps: string
  sid: string
  tags: string[]
}

// Data layer: V1 reads bundled JSON (+ any locally added places).
// V2 swaps this for a real backend without touching the UI.
const LOCAL_PLACES_KEY = 'gedi.localPlaces'
const VISITED_KEY = 'gedi.visited'

export function getPlaces(): Place[] {
  const local = JSON.parse(localStorage.getItem(LOCAL_PLACES_KEY) || '[]') as Place[]
  return [...(placesData as Place[]), ...local]
}

export function addLocalPlace(p: Place) {
  const local = JSON.parse(localStorage.getItem(LOCAL_PLACES_KEY) || '[]') as Place[]
  local.push(p)
  localStorage.setItem(LOCAL_PLACES_KEY, JSON.stringify(local))
}

export function getVisited(): Set<string> {
  return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]') as string[])
}

export function setVisited(ids: Set<string>) {
  localStorage.setItem(VISITED_KEY, JSON.stringify([...ids]))
}

export function totalXp(visited: Set<string>): number {
  return getPlaces().filter(p => visited.has(p.id)).reduce((s, p) => s + p.xp, 0)
}

// Level thresholds: level n needs n*n*40 XP cumulative
export function levelFromXp(xp: number) {
  let level = 1
  while (xp >= level * level * 40) level++
  const cur = (level - 1) * (level - 1) * 40
  const next = level * level * 40
  return { level, progress: (xp - cur) / (next - cur), toNext: next - xp }
}

export interface Badge {
  id: string
  name: string
  desc: string
  icon: string
  earned: (visited: Set<string>, places: Place[]) => boolean
}

const countIn = (v: Set<string>, ps: Place[], f: (p: Place) => boolean) =>
  ps.filter(p => v.has(p.id) && f(p)).length

// icon = glyph name from icons.ts (no emojis — game HUD rules)
export const BADGES: Badge[] = [
  { id: 'first', name: 'First Adventure', desc: 'Visit your first place', icon: 'compass', earned: v => v.size >= 1 },
  { id: 'food', name: 'Food Hunter', desc: 'Visit 2 food spots', icon: 'food', earned: (v, p) => countIn(v, p, x => ['Food', 'Street Food', 'Dessert'].includes(x.category)) >= 2 },
  { id: 'night', name: 'Night Owl', desc: 'Visit 3 night spots', icon: 'moon', earned: (v, p) => countIn(v, p, x => x.collections.includes('night')) >= 3 },
  { id: 'nature', name: 'Nature Lover', desc: 'Visit 2 parks/lakes/treks', icon: 'leaf', earned: (v, p) => countIn(v, p, x => ['Park', 'Lake', 'Adventure'].includes(x.category)) >= 2 },
  { id: 'history', name: 'Time Traveller', desc: 'Visit 3 historical places', icon: 'fort', earned: (v, p) => countIn(v, p, x => ['Historical', 'Museum', 'Temple'].includes(x.category)) >= 3 },
  { id: 'main5', name: 'Story Mode', desc: 'Complete all main quests', icon: 'swords', earned: (v, p) => p.filter(x => x.quest === 'main').every(x => v.has(x.id)) },
  { id: 'legend', name: 'IIITH Legend', desc: 'Do all iiith-legend spots', icon: 'flame', earned: (v, p) => p.filter(x => x.tags.includes('iiith-legend')).every(x => v.has(x.id)) },
  { id: 'master', name: 'Hyderabad Master', desc: 'Visit every single place', icon: 'crown', earned: (v, p) => p.every(x => v.has(x.id)) },
]

export const COLLECTIONS: { id: string; name: string; icon: string }[] = [
  { id: 'budget', name: 'Under ₹300', icon: 'coin' },
  { id: 'gourmet', name: 'Gourmet', icon: 'food' },
  { id: 'birthday', name: 'Birthday Plans', icon: 'gift' },
  { id: 'date', name: 'Date Spots', icon: 'heart' },
  { id: 'night', name: 'After Dark', icon: 'moon' },
  { id: 'streetfood', name: 'Street Food', icon: 'flame' },
  { id: 'trek', name: 'Treks & Trips', icon: 'mountain' },
  { id: 'study', name: 'Chill & Study', icon: 'book' },
]
