// CP2077-style territory map: contiguous districts that tile the city like the
// Night City region map — shared borders, real area names. Rough road-following
// approximations, not survey data.
import traced from './districts-traced.json'

export interface District {
  name: string
  color: string
  tagline: string
  ring: [number, number][]
}

// Road-following rings baked by scripts/trace-districts.mjs (OSRM). Falls back
// to the hand-drawn corner ring if a district wasn't traced.
const roadRing = (name: string, corners: [number, number][]): [number, number][] =>
  ((traced as unknown as Record<string, [number, number][]>)[name]) ?? corners

export const DISTRICTS: District[] = [
  {
    name: 'GACHIBOWLI', color: '#3dffa0',
    tagline: 'Campus, Khajaguda rocks, stadium runs & 2AM maggi. Home.',
    ring: roadRing('GACHIBOWLI', [[78.30, 17.46], [78.36, 17.465], [78.385, 17.44], [78.38, 17.40], [78.34, 17.38], [78.30, 17.40]]),
  },
  {
    name: 'KONDAPUR', color: '#ffc857',
    tagline: 'Sarath City, Botanical Garden & every PG in existence.',
    ring: roadRing('KONDAPUR', [[78.36, 17.465], [78.34, 17.50], [78.40, 17.50], [78.41, 17.47], [78.385, 17.44]]),
  },
  {
    name: 'MADHAPUR', color: '#ff2ea6',
    tagline: 'Hitec City, Inorbit, cable bridge & corpo towers. Future internships live here.',
    ring: roadRing('MADHAPUR', [[78.385, 17.44], [78.41, 17.47], [78.44, 17.46], [78.445, 17.435], [78.42, 17.415], [78.39, 17.415]]),
  },
  {
    name: 'KUKATPALLY', color: '#ff9f1c',
    tagline: 'Lulu land — mega malls, metro crowds & student mandis.',
    ring: roadRing('KUKATPALLY', [[78.34, 17.50], [78.36, 17.55], [78.44, 17.545], [78.44, 17.49], [78.40, 17.50]]),
  },
  {
    name: 'JUBILEE HILLS', color: '#00e5ff',
    tagline: 'Old money, film stars & new cafés. KBR forest in the middle.',
    ring: roadRing('JUBILEE HILLS', [[78.39, 17.415], [78.42, 17.415], [78.445, 17.435], [78.46, 17.42], [78.44, 17.40], [78.41, 17.395]]),
  },
  {
    name: 'BANJARA HILLS', color: '#b5ff3d',
    tagline: 'GVK One, Lamakaan, KBR walks & Road No.1 traffic.',
    ring: roadRing('BANJARA HILLS', [[78.41, 17.395], [78.44, 17.40], [78.46, 17.42], [78.47, 17.40], [78.45, 17.38], [78.42, 17.375]]),
  },
  {
    name: 'CITY CENTER', color: '#4d9fff',
    tagline: 'Tank Bund lights, Abids bookstores, Necklace Road night rides.',
    ring: roadRing('CITY CENTER', [[78.46, 17.42], [78.445, 17.435], [78.44, 17.46], [78.47, 17.47], [78.50, 17.44], [78.50, 17.40], [78.47, 17.40]]),
  },
  {
    name: 'SECUNDERABAD', color: '#b58cff',
    tagline: 'The twin city across the tracks. Paradise biryani turf.',
    ring: roadRing('SECUNDERABAD', [[78.44, 17.46], [78.44, 17.49], [78.52, 17.50], [78.54, 17.45], [78.50, 17.44], [78.47, 17.47]]),
  },
  {
    name: 'OLD CITY', color: '#ff4d4d',
    tagline: 'Charminar, chudi bazaar & biryani that settles arguments.',
    ring: roadRing('OLD CITY', [[78.42, 17.375], [78.45, 17.38], [78.47, 17.40], [78.50, 17.40], [78.51, 17.35], [78.46, 17.31], [78.41, 17.33]]),
  },
]

export const RDR_INK = '#3a2a18'

export const centroid = (ring: [number, number][]): [number, number] => [
  ring.reduce((s, c) => s + c[0], 0) / ring.length,
  ring.reduce((s, c) => s + c[1], 0) / ring.length,
]

// Ray-cast point-in-polygon
export function inRing(pt: [number, number], ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
