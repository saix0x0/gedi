import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Place, Theme } from './store'
import { svg, catIcon } from './icons'

// Default quest origin: IIIT Hyderabad main gate (used until geolocation resolves)
const IIITH: [number, number] = [78.3489, 17.4455]

const tiles = (path: string) =>
  ['a', 'b', 'c'].map(s => `https://${s}.basemaps.cartocdn.com/${path}/{z}/{x}/{y}@2x.png`)

const styleFor = (theme: Theme): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: tiles(theme === 'rdr' ? 'rastertiles/voyager' : 'dark_all'),
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
})

const QUEST_COLOR: Record<string, string> = {
  main: 'var(--gold)',
  side: 'var(--cyan)',
  special: 'var(--magenta)',
}

// ---- Districts: CP2077-style territory overlay (rough hand-drawn borders) ----
interface District { name: string; color: string; ring: [number, number][] }
const DISTRICTS: District[] = [
  { name: 'OLD CITY', color: '#ff4d4d', ring: [[78.43, 17.365], [78.455, 17.385], [78.50, 17.38], [78.505, 17.345], [78.46, 17.33], [78.435, 17.34]] },
  { name: 'CITY CENTER', color: '#ffc857', ring: [[78.44, 17.42], [78.455, 17.445], [78.49, 17.435], [78.492, 17.39], [78.455, 17.385], [78.44, 17.395]] },
  { name: 'JUBILEE HILLS', color: '#00e5ff', ring: [[78.39, 17.445], [78.44, 17.445], [78.45, 17.415], [78.42, 17.40], [78.395, 17.41]] },
  { name: 'CYBER DISTRICT', color: '#ff2ea6', ring: [[78.34, 17.475], [78.41, 17.47], [78.415, 17.435], [78.375, 17.425], [78.345, 17.44]] },
  { name: 'HOME TURF', color: '#3dffa0', ring: [[78.315, 17.435], [78.37, 17.44], [78.375, 17.40], [78.325, 17.395]] },
  { name: 'SECUNDERABAD', color: '#b58cff', ring: [[78.465, 17.465], [78.52, 17.46], [78.52, 17.43], [78.47, 17.435]] },
]
const RDR_INK = '#5a4632'

const centroid = (ring: [number, number][]): [number, number] => [
  ring.reduce((s, c) => s + c[0], 0) / ring.length,
  ring.reduce((s, c) => s + c[1], 0) / ring.length,
]

function addDistricts(m: maplibregl.Map, theme: Theme) {
  try {
    for (const d of DISTRICTS) {
      const id = `dist-${d.name}`
      if (m.getSource(id)) continue
      const color = theme === 'rdr' ? RDR_INK : d.color
      m.addSource(id, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[...d.ring, d.ring[0]]] } },
      })
      m.addLayer({ id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': color, 'fill-opacity': theme === 'rdr' ? 0.05 : 0.07 } })
      m.addLayer({ id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': color, 'line-width': 1.6, 'line-dasharray': [3, 2], 'line-opacity': theme === 'rdr' ? 0.55 : 0.8 } })
    }
  } catch { /* style mid-load; next styledata pass will retry */ }
}

function clearRoute(m: maplibregl.Map) {
  if (m.getLayer('route-line')) m.removeLayer('route-line')
  if (m.getLayer('route-glow')) m.removeLayer('route-glow')
  if (m.getSource('route')) m.removeSource('route')
}

function drawRoute(m: maplibregl.Map, coords: [number, number][] | null, theme: Theme) {
  clearRoute(m)
  if (!coords) return
  const c = theme === 'rdr' ? '#8f1d1d' : '#00e5ff'
  m.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
  })
  m.addLayer({
    id: 'route-glow', type: 'line', source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': c, 'line-width': 12, 'line-blur': 8, 'line-opacity': theme === 'rdr' ? 0.3 : 0.55 },
  })
  m.addLayer({
    id: 'route-line', type: 'line', source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': c, 'line-width': 3.5, 'line-dasharray': [2.2, 1.6] },
  })
}

interface Props {
  places: Place[]
  visited: Set<string>
  onSelect: (p: Place) => void
  theme: Theme
  routeTo: Place | null
}

export default function MapView({ places, visited, onSelect, theme, routeTo }: Props) {
  const div = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const origin = useRef<[number, number]>(IIITH)
  const originMarker = useRef<maplibregl.Marker | null>(null)
  const routeCoords = useRef<[number, number][] | null>(null)

  useEffect(() => {
    if (!div.current) return
    const m = new maplibregl.Map({
      container: div.current,
      style: styleFor(theme),
      center: [78.43, 17.41],
      zoom: 11.3,
      attributionControl: { compact: true },
    })
    map.current = m
    m.on('load', () => addDistricts(m, theme))

    // District name labels: DOM markers survive setStyle, style via CSS
    for (const d of DISTRICTS) {
      const el = document.createElement('div')
      el.className = 'district-label'
      el.style.setProperty('--dc', d.color)
      el.textContent = d.name
      new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(centroid(d.ring)).addTo(m)
    }

    const el = document.createElement('div')
    el.className = 'origin-marker'
    el.innerHTML = `<span class="origin-dot"></span><span class="origin-label">YOU</span>`
    originMarker.current = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(origin.current)
      .addTo(m)

    navigator.geolocation?.getCurrentPosition(
      p => {
        origin.current = [p.coords.longitude, p.coords.latitude]
        originMarker.current?.setLngLat(origin.current)
      },
      () => {}, // denied → stay at campus
      { maximumAge: 600_000 },
    )
    return () => m.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Theme switch: swap basemap, then re-add overlays (setStyle wipes layers)
  useEffect(() => {
    const m = map.current
    if (!m) return
    m.setStyle(styleFor(theme))
    m.once('styledata', () => {
      addDistricts(m, theme)
      drawRoute(m, routeCoords.current, theme)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  // Quest path: glowing route from origin to selected place
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (!routeTo) {
      routeCoords.current = null
      if (m.isStyleLoaded()) clearRoute(m)
      return
    }
    let cancelled = false
    ;(async () => {
      const from = origin.current
      const to: [number, number] = [routeTo.lng, routeTo.lat]
      let coords: [number, number][] = [from, to] // straight-line fallback
      try {
        const r = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson`,
        )
        const j = await r.json()
        if (j.routes?.[0]) coords = j.routes[0].geometry.coordinates
      } catch { /* offline or rate-limited → straight line */ }
      if (cancelled) return
      routeCoords.current = coords
      const draw = () => {
        drawRoute(m, coords, theme)
        const b = coords.reduce(
          (bb, c) => bb.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0]),
        )
        m.fitBounds(b, { padding: 70, duration: 900 })
      }
      if (m.isStyleLoaded()) draw()
      else m.once('styledata', draw)
    })()
    return () => { cancelled = true }
  }, [routeTo, theme])

  // Place markers: CP2077-style icon badges
  useEffect(() => {
    if (!map.current) return
    markers.current.forEach(m => m.remove())
    markers.current = places.map(p => {
      const el = document.createElement('div')
      el.className = 'marker' + (visited.has(p.id) ? ' marker-visited' : '')
      el.style.setProperty('--c', QUEST_COLOR[p.quest])
      el.innerHTML = `<span class="marker-badge">${svg(catIcon(p.category), 15)}</span><span class="marker-label">${p.name}</span>`
      el.onclick = e => {
        e.stopPropagation()
        onSelect(p)
      }
      return new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([p.lng, p.lat])
        .addTo(map.current!)
    })
  }, [places, visited, onSelect])

  return <div ref={div} className={`map ${theme === 'rdr' ? 'map-rdr' : ''}`} />
}
