import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Place } from './store'

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
}

const QUEST_COLOR: Record<string, string> = {
  main: 'var(--gold)',
  side: 'var(--cyan)',
  special: 'var(--magenta)',
}

interface Props {
  places: Place[]
  visited: Set<string>
  onSelect: (p: Place) => void
}

export default function MapView({ places, visited, onSelect }: Props) {
  const div = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!div.current) return
    map.current = new maplibregl.Map({
      container: div.current,
      style: STYLE,
      center: [78.43, 17.41],
      zoom: 11.3,
      attributionControl: { compact: true },
    })
    return () => map.current?.remove()
  }, [])

  useEffect(() => {
    if (!map.current) return
    markers.current.forEach(m => m.remove())
    markers.current = places.map(p => {
      const el = document.createElement('div')
      el.className = 'marker' + (visited.has(p.id) ? ' marker-visited' : '')
      el.style.setProperty('--c', QUEST_COLOR[p.quest])
      el.innerHTML = `<span class="marker-dot"></span><span class="marker-label">${p.name}</span>`
      el.onclick = e => {
        e.stopPropagation()
        onSelect(p)
      }
      return new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([p.lng, p.lat])
        .addTo(map.current!)
    })
  }, [places, visited, onSelect])

  return <div ref={div} className="map" />
}
