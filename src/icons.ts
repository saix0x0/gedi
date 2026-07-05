// Game-style SVG glyph set. Stroke-based, currentColor, 24x24 grid.
// Used as raw strings so both React (dangerouslySetInnerHTML) and
// MapLibre DOM markers (innerHTML) can render them.

const P: Record<string, string> = {
  map: `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>`,
  compass: `<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9" fill="currentColor" stroke="none"/>`,
  star: `<polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.8 5.7 21 7 14 2 9.3 9 8.5"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>`,
  funnel: `<path d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/>`,
  coin: `<circle cx="12" cy="12" r="9"/><path d="M9 7h6M9 10h6M15 7c0 4-2 5-4 5l4 5" stroke-width="1.8"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/>`,
  hourglass: `<path d="M7 2h10v4l-4 4v4l4 4v4H7v-4l4-4v-4L7 6V2z"/>`,
  metro: `<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M8 14V8l4 4 4-4v6"/><path d="M8 21l1.5-3M16 21l-1.5-3"/>`,
  food: `<path d="M5 3v7a3 3 0 0 0 3 3v8M8 3v6M11 3v6"/><path d="M17 3c-2 0-3 3.5-3 7v2h3v9"/>`,
  flame: `<path d="M12 2s6 5.2 6 10.5a6 6 0 0 1-12 0C6 8.5 9 6.5 9 3.5c2 1 3 3 3 5z"/>`,
  dessert: `<path d="M8 10a4 4 0 1 1 8 0"/><path d="M7 10h10l-5 11-5-11z"/>`,
  car: `<path d="M4 16l1.8-5.5A2 2 0 0 1 7.7 9h8.6a2 2 0 0 1 1.9 1.5L20 16"/><path d="M3 16h18v4h-2M5 20H3v-4"/><circle cx="7.5" cy="18" r="1.4"/><circle cx="16.5" cy="18" r="1.4"/>`,
  moon: `<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>`,
  leaf: `<path d="M5 21c0-9 5-16 14-16 0 9-5 16-14 16z"/><path d="M5 21c3-7 7-11 12-14"/>`,
  mountain: `<polyline points="3 20 9 8 13 14 15 11 21 20 3 20"/>`,
  tree: `<path d="M12 3l5 7h-3l4 6H6l4-6H7l5-7z"/><path d="M12 16v5"/>`,
  fort: `<path d="M4 21V8h3V5h3v3h4V5h3v3h3v13H4z"/><path d="M10 21v-5h4v5"/>`,
  museum: `<path d="M3 9l9-6 9 6v2H3V9z"/><path d="M5 11v8M9.5 11v8M14.5 11v8M19 11v8M2 21h20M3 19h18"/>`,
  waves: `<path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>`,
  temple: `<path d="M4 21v-6h2v-3h2V9h8v3h2v3h2v6H4z"/><path d="M10 9V6h4v3M12 6V3"/>`,
  tent: `<path d="M12 4L2 20h20L12 4z"/><path d="M12 14l-3.5 6h7L12 14z"/>`,
  bag: `<path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  heart: `<path d="M12 21C7 16 3 13 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 13 17 16 12 21z"/>`,
  gift: `<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8c-1.5-3-6-3-6 0h6zM12 8c1.5-3 6-3 6 0h-6z"/>`,
  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>`,
  flag: `<path d="M5 21V4"/><path d="M5 4c4-2 6 2 10 0v9c-4 2-6-2-10 0"/>`,
  crown: `<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>`,
  check: `<polyline points="4 12 10 18 20 6"/>`,
  pin: `<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>`,
  swords: `<path d="M3 3l8 8M21 3l-8 8M5 13l6 6M19 13l-6 6"/><path d="M3 3h4M3 3v4M21 3h-4M21 3v4M4 17l3 3M20 17l-3 3"/>`,
  camera: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13" r="3.5"/>`,
  campus: `<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M13.2 6.5l-4.7 7h3.2l-1 5 4.8-7h-3.3l1-5z" fill="currentColor" stroke="none"/>`,
  qr: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M20 14v.01M14 20h.01M17 20h.01M20 17v4"/>`,
  share: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18"/>`,
}

export type IconName = keyof typeof P

export function svg(name: string, size = 16): string {
  const d = P[name] || P.pin
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
}

export const CATEGORY_ICON: Record<string, string> = {
  Historical: 'fort',
  Lake: 'waves',
  Museum: 'museum',
  Adventure: 'mountain',
  Culture: 'flag',
  Park: 'tree',
  Food: 'food',
  'Street Food': 'flame',
  Dessert: 'dessert',
  'Night Drive': 'car',
  Temple: 'temple',
  'Weekend Trip': 'tent',
  Mall: 'bag',
}

export const catIcon = (category: string) => CATEGORY_ICON[category] || 'pin'
