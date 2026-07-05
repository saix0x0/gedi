import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Place, Theme } from './store'
import { svg, catIcon } from './icons'
import { DISTRICTS, RDR_INK, centroid, type District } from './districts'

// Home base: IIIT Hyderabad (also default quest origin until geolocation resolves)
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

// active = hovered or selected → territory lights up (CP2077 map behavior)
const activeExpr = ['any',
  ['boolean', ['feature-state', 'hover'], false],
  ['boolean', ['feature-state', 'selected'], false],
] as unknown as maplibregl.ExpressionSpecification

function addDistricts(m: maplibregl.Map, theme: Theme) {
  try {
    if (m.getSource('districts')) return
    m.addSource('districts', {
      type: 'geojson',
      promoteId: 'name',
      data: {
        type: 'FeatureCollection',
        features: DISTRICTS.map(d => ({
          type: 'Feature' as const,
          properties: { name: d.name, color: theme === 'rdr' ? RDR_INK : d.color },
          geometry: { type: 'Polygon' as const, coordinates: [[...d.ring, d.ring[0]]] },
        })),
      },
    })
    m.addLayer({
      id: 'districts-fill', type: 'fill', source: 'districts',
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', activeExpr, theme === 'rdr' ? 0.12 : 0.16, 0.04] },
    })
    m.addLayer({
      id: 'districts-line', type: 'line', source: 'districts',
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['case', activeExpr, 2.6, 1.2],
        'line-opacity': ['case', activeExpr, 0.95, 0.4],
      },
    })
  } catch { /* style mid-load; retried on next styledata */ }
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
  onDistrict: (d: District | null) => void
  theme: Theme
  routeTo: Place | null
}

export default function MapView({ places, visited, onSelect, onDistrict, theme, routeTo }: Props) {
  const div = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const origin = useRef<[number, number]>(IIITH)
  const originMarker = useRef<maplibregl.Marker | null>(null)
  const routeCoords = useRef<[number, number][] | null>(null)
  const hoverId = useRef<string | null>(null)
  const selectedId = useRef<string | null>(null)
  const onDistrictRef = useRef(onDistrict)
  onDistrictRef.current = onDistrict

  useEffect(() => {
    if (!div.current) return
    const m = new maplibregl.Map({
      container: div.current,
      style: styleFor(theme),
      center: [78.41, 17.41],
      zoom: 11.3,
      attributionControl: { compact: true },
    })
    map.current = m
    m.on('load', () => addDistricts(m, theme))

    const setState = (id: string | null, key: 'hover' | 'selected', v: boolean) => {
      if (!id || !m.getSource('districts')) return
      m.setFeatureState({ source: 'districts', id }, { [key]: v })
    }

    // Hover (desktop): light the territory up
    m.on('mousemove', 'districts-fill', e => {
      const id = (e.features?.[0]?.id as string) ?? null
      if (id === hoverId.current) return
      setState(hoverId.current, 'hover', false)
      hoverId.current = id
      setState(id, 'hover', true)
      m.getCanvas().style.cursor = 'pointer'
    })
    m.on('mouseleave', 'districts-fill', () => {
      setState(hoverId.current, 'hover', false)
      hoverId.current = null
      m.getCanvas().style.cursor = ''
    })

    // Click/tap: select territory + surface its info card
    m.on('click', e => {
      const feats = m.queryRenderedFeatures(e.point, { layers: m.getLayer('districts-fill') ? ['districts-fill'] : [] })
      const id = (feats[0]?.id as string) ?? null
      setState(selectedId.current, 'selected', false)
      selectedId.current = id === selectedId.current ? null : id // tap again to dismiss
      setState(selectedId.current, 'selected', true)
      onDistrictRef.current(DISTRICTS.find(d => d.name === selectedId.current) ?? null)
    })

    // District name labels: DOM markers survive setStyle, styled via CSS
    for (const d of DISTRICTS) {
      const el = document.createElement('div')
      el.className = 'district-label'
      el.style.setProperty('--dc', d.color)
      el.textContent = d.name
      new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(centroid(d.ring)).addTo(m)
    }

    // Home base: IIIT-H crest
    const campus = document.createElement('div')
    campus.className = 'campus-marker'
    campus.innerHTML = `<span class="campus-ring"></span><span class="campus-badge">${svg('campus', 20)}</span><span class="marker-label">IIIT-H · HOME BASE</span>`
    new maplibregl.Marker({ element: campus, anchor: 'center' }).setLngLat(IIITH).addTo(m)

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

  // Theme switch: swap basemap, then re-add overlays (setStyle wipes layers + feature state)
  useEffect(() => {
    const m = map.current
    if (!m) return
    m.setStyle(styleFor(theme))
    m.once('styledata', () => {
      addDistricts(m, theme)
      drawRoute(m, routeCoords.current, theme)
      if (selectedId.current) m.setFeatureState({ source: 'districts', id: selectedId.current }, { selected: true })
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
