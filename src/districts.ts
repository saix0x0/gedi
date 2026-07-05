// CP2077-style territory data. Rings are rough hand-drawn game borders, not survey data.
export interface District {
  name: string
  color: string
  tagline: string
  ring: [number, number][]
}

// Rings loosely trace real roads/features (Musi river, Road No.1, ORR, rail line) —
// more vertices = hand-inked game-map look. Still approximations, not survey data.
export const DISTRICTS: District[] = [
  {
    name: 'OLD CITY', color: '#ff4d4d',
    tagline: 'Charminar, chudi bazaar & biryani that settles arguments. North border = the Musi.',
    ring: [[78.432, 17.372], [78.45, 17.377], [78.465, 17.375], [78.48, 17.378], [78.494, 17.372], [78.501, 17.359], [78.496, 17.344], [78.481, 17.334], [78.46, 17.329], [78.444, 17.334], [78.434, 17.346], [78.429, 17.36]],
  },
  {
    name: 'CITY CENTER', color: '#ffc857',
    tagline: 'Tank Bund lights, Abids bookstores, Necklace Road night rides.',
    ring: [[78.44, 17.4], [78.437, 17.414], [78.449, 17.425], [78.461, 17.431], [78.476, 17.43], [78.489, 17.424], [78.494, 17.409], [78.489, 17.394], [78.471, 17.384], [78.454, 17.378], [78.442, 17.387]],
  },
  {
    name: 'JUBILEE HILLS', color: '#00e5ff',
    tagline: 'Old money, film stars & new cafés. KBR forest in the middle of it all.',
    ring: [[78.394, 17.44], [78.414, 17.446], [78.43, 17.441], [78.441, 17.431], [78.446, 17.419], [78.44, 17.407], [78.425, 17.4], [78.409, 17.402], [78.399, 17.411], [78.391, 17.425]],
  },
  {
    name: 'CYBER DISTRICT', color: '#ff2ea6',
    tagline: 'Corpo towers, Inorbit runs & the cable bridge. Your future internships live here.',
    ring: [[78.355, 17.47], [78.379, 17.472], [78.399, 17.466], [78.406, 17.451], [78.401, 17.435], [78.39, 17.425], [78.374, 17.42], [78.359, 17.426], [78.349, 17.44], [78.347, 17.456]],
  },
  {
    name: 'HOME TURF', color: '#3dffa0',
    tagline: 'Campus, Khajaguda rocks & 2AM maggi. You live here, choom.',
    ring: [[78.32, 17.43], [78.339, 17.44], [78.359, 17.443], [78.371, 17.431], [78.375, 17.415], [78.369, 17.399], [78.354, 17.391], [78.334, 17.394], [78.321, 17.409]],
  },
  {
    name: 'SECUNDERABAD', color: '#b58cff',
    tagline: 'The twin city across the tracks. Paradise biryani turf.',
    ring: [[78.459, 17.461], [78.479, 17.471], [78.5, 17.468], [78.514, 17.455], [78.515, 17.44], [78.501, 17.43], [78.479, 17.427], [78.464, 17.439]],
  },
  {
    name: 'KUKATPALLY', color: '#ff9f1c',
    tagline: 'Lulu land — mega malls, metro crowds & student mandis.',
    ring: [[78.369, 17.51], [78.394, 17.516], [78.417, 17.507], [78.424, 17.491], [78.415, 17.476], [78.394, 17.469], [78.375, 17.478], [78.364, 17.494]],
  },
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
