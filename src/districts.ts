// CP2077-style territory data. Rings are rough hand-drawn game borders, not survey data.
export interface District {
  name: string
  color: string
  tagline: string
  ring: [number, number][]
}

export const DISTRICTS: District[] = [
  { name: 'OLD CITY', color: '#ff4d4d', tagline: 'Biryani, bangles & 400-year-old streets', ring: [[78.43, 17.365], [78.455, 17.385], [78.50, 17.38], [78.505, 17.345], [78.46, 17.33], [78.435, 17.34]] },
  { name: 'CITY CENTER', color: '#ffc857', tagline: 'Lakes, lights & late nights', ring: [[78.44, 17.42], [78.455, 17.445], [78.49, 17.435], [78.492, 17.39], [78.455, 17.385], [78.44, 17.395]] },
  { name: 'JUBILEE HILLS', color: '#00e5ff', tagline: 'Old money, new cafés', ring: [[78.39, 17.445], [78.44, 17.445], [78.45, 17.415], [78.42, 17.40], [78.395, 17.41]] },
  { name: 'CYBER DISTRICT', color: '#ff2ea6', tagline: 'Corpo towers. Your future internships.', ring: [[78.34, 17.475], [78.41, 17.47], [78.415, 17.435], [78.375, 17.425], [78.345, 17.44]] },
  { name: 'HOME TURF', color: '#3dffa0', tagline: 'Campus. You live here, choom.', ring: [[78.315, 17.435], [78.37, 17.44], [78.375, 17.40], [78.325, 17.395]] },
  { name: 'SECUNDERABAD', color: '#b58cff', tagline: 'The twin city across the tracks', ring: [[78.465, 17.465], [78.52, 17.46], [78.52, 17.43], [78.47, 17.435]] },
]

export const RDR_INK = '#5a4632'

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
