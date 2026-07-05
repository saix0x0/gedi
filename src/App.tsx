import { useEffect, useMemo, useState, useCallback } from 'react'
import MapView from './MapView'
import {
  getPlaces, getVisited, setVisited as persistVisited, totalXp, levelFromXp, addLocalPlace,
  BADGES, COLLECTIONS, type Place, type Quest, type Theme,
} from './store'
import { svg, catIcon } from './icons'
import { inRing, type District } from './districts'

type Tab = 'map' | 'explore' | 'picks' | 'you'

const QUEST_META: Record<Quest, { label: string; icon: string }> = {
  main: { label: 'Main Quests', icon: 'swords' },
  side: { label: 'Side Quests', icon: 'compass' },
  special: { label: 'Specials', icon: 'star' },
}

function Glyph({ name, size = 16 }: { name: string; size?: number }) {
  return <span className="glyph" dangerouslySetInnerHTML={{ __html: svg(name, size) }} />
}

export default function App() {
  const [placesV, setPlacesV] = useState(0)
  const places = useMemo(() => getPlaces(), [placesV])
  const [visited, setVisitedState] = useState<Set<string>>(() => getVisited())
  const [tab, setTab] = useState<Tab>('map')
  const [selected, setSelectedState] = useState<Place | null>(null)
  const [routeTo, setRouteTo] = useState<Place | null>(null) // path persists after sheet closes
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('gedi.theme') as Theme) || 'cyber')
  const [filterOpen, setFilterOpen] = useState(false)
  const [district, setDistrict] = useState<District | null>(null)
  const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set())
  const [hiddenQuests, setHiddenQuests] = useState<Set<Quest>>(new Set())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('gedi.theme', theme)
  }, [theme])

  const setSelected = useCallback((p: Place | null) => {
    setSelectedState(p)
    if (p) setRouteTo(p)
  }, [])

  const xp = totalXp(visited)
  const { level, progress } = levelFromXp(xp)
  const pct = Math.round((visited.size / places.length) * 100)

  const toggleVisited = useCallback((p: Place) => {
    setVisitedState(prev => {
      const next = new Set(prev)
      if (next.has(p.id)) next.delete(p.id)
      else {
        next.add(p.id)
        const newBadge = BADGES.find(b => b.earned(next, places) && !b.earned(prev, places))
        setToast(newBadge ? `+${p.xp} XP · BADGE UNLOCKED: ${newBadge.name.toUpperCase()}` : `+${p.xp} XP`)
        setTimeout(() => setToast(null), 2600)
      }
      persistVisited(next)
      return next
    })
  }, [places])

  const categories = useMemo(() => {
    const m = new Map<string, number>()
    places.forEach(p => m.set(p.category, (m.get(p.category) || 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [places])

  const mapPlaces = useMemo(() => {
    const q = query.trim().toLowerCase()
    return places.filter(p =>
      !hiddenCats.has(p.category) &&
      !hiddenQuests.has(p.quest) &&
      (!q || [p.name, p.area, p.category, ...p.tags].join(' ').toLowerCase().includes(q)))
  }, [places, query, hiddenCats, hiddenQuests])

  const filtersActive = hiddenCats.size + hiddenQuests.size > 0

  const toggleCat = (c: string) =>
    setHiddenCats(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n })
  const toggleQuest = (q: Quest) =>
    setHiddenQuests(prev => { const n = new Set(prev); n.has(q) ? n.delete(q) : n.add(q); return n })

  return (
    <div className="app">
      {/* HUD */}
      <header className="hud">
        <div className="hud-title">
          <span className="logo">GEDI</span>
          <span className="hud-sub">Hyderabad Explorer</span>
        </div>
        <button
          className="theme-toggle"
          title={theme === 'cyber' ? 'Switch to Red Dead mode' : 'Switch to Cyberpunk mode'}
          onClick={() => setTheme(t => (t === 'cyber' ? 'rdr' : 'cyber'))}
        >
          {theme === 'cyber'
            ? <img className="tt-img" src={`${import.meta.env.BASE_URL}rdr2.png`} alt="Switch to Red Dead mode" />
            : <span className="tt-plate"><img className="tt-img tt-img-cp" src={`${import.meta.env.BASE_URL}cp2077.svg`} alt="Switch to Cyberpunk mode" /></span>}
        </button>
        <div className="hud-stats">
          <div className="hud-level">LV {level}</div>
          <div className="xp-bar"><div className="xp-fill" style={{ width: `${progress * 100}%` }} /></div>
          <div className="hud-xp">{xp} XP · {pct}% EXPLORED</div>
        </div>
      </header>

      {/* Views */}
      <main className="view">
        {tab === 'map' && (
          <>
            <div className="map-topbar">
              <input
                className="search"
                placeholder="SEARCH THE CITY…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button
                className={`filter-btn ${filtersActive ? 'filter-btn-on' : ''}`}
                onClick={() => setFilterOpen(o => !o)}
                title="Map filters"
              >
                <Glyph name="funnel" size={18} />
              </button>
            </div>
            <MapView places={mapPlaces} visited={visited} onSelect={setSelected} onDistrict={setDistrict} theme={theme} routeTo={routeTo} />

            {/* Live search results */}
            {query.trim() && !filterOpen && (
              <div className="search-results">
                {mapPlaces.slice(0, 6).map(p => (
                  <button key={p.id} className="sr-item" onClick={() => { setSelected(p) }}>
                    <Glyph name={catIcon(p.category)} size={14} />
                    <span className="sr-name">{p.name}</span>
                    <span className="sr-area">{p.area}</span>
                  </button>
                ))}
                {!mapPlaces.length && <div className="sr-empty">NO SPOTS FOUND</div>}
              </div>
            )}

            {/* CP2077 district info card */}
            {district && !filterOpen && (
              <div className="district-card" style={{ ['--dc' as string]: theme === 'rdr' ? 'var(--magenta)' : district.color }}>
                <div className="dc-name">{district.name}</div>
                <div className="dc-label">PRIMARY VIBES</div>
                <div className="dc-tag">{district.tagline}</div>
                <div className="dc-count">
                  <Glyph name="pin" size={12} /> {places.filter(p => inRing([p.lng, p.lat], district.ring)).length} SPOTS · {places.filter(p => inRing([p.lng, p.lat], district.ring) && visited.has(p.id)).length} CONQUERED
                </div>
              </div>
            )}

            {/* CP2077-style filter legend */}
            {filterOpen && (
              <div className="legend">
                <div className="legend-head">
                  <span>MAP FILTERS</span>
                  <button className="legend-all" onClick={() => { setHiddenCats(new Set()); setHiddenQuests(new Set()) }}>SHOW ALL</button>
                  <button className="legend-x" onClick={() => setFilterOpen(false)}><Glyph name="check" size={15} /> DONE</button>
                </div>
                <div className="legend-quests">
                  {(['main', 'side', 'special'] as Quest[]).map(q => (
                    <button key={q} className={`legend-quest lq-${q} ${hiddenQuests.has(q) ? 'off' : ''}`} onClick={() => toggleQuest(q)}>
                      <Glyph name={QUEST_META[q].icon} size={14} /> {QUEST_META[q].label.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="legend-grid">
                  {categories.map(([c, n]) => (
                    <button key={c} className={`legend-item ${hiddenCats.has(c) ? 'off' : ''}`} onClick={() => toggleCat(c)}>
                      <Glyph name={catIcon(c)} size={15} />
                      <span className="legend-name">{c.toUpperCase()}</span>
                      <span className="legend-n">{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'explore' && (
          <div className="list-view">
            {(['main', 'side', 'special'] as Quest[]).map(q => {
              const qs = places.filter(p => p.quest === q)
              const done = qs.filter(p => visited.has(p.id)).length
              return (
                <section key={q}>
                  <h2 className={`quest-h quest-${q}`}>
                    <Glyph name={QUEST_META[q].icon} /> {QUEST_META[q].label}
                    <span className="quest-count">{done}/{qs.length}</span>
                  </h2>
                  {qs.map(p => (
                    <PlaceRow key={p.id} p={p} done={visited.has(p.id)} onClick={() => { setSelected(p) }} />
                  ))}
                </section>
              )
            })}
          </div>
        )}

        {tab === 'picks' && (
          <div className="list-view">
            {COLLECTIONS.map(c => {
              const ps = places.filter(p => p.collections.includes(c.id))
              if (!ps.length) return null
              return (
                <section key={c.id}>
                  <h2 className="quest-h"><Glyph name={c.icon} /> {c.name}</h2>
                  {ps.map(p => (
                    <PlaceRow key={p.id} p={p} done={visited.has(p.id)} onClick={() => { setSelected(p) }} />
                  ))}
                </section>
              )
            })}
          </div>
        )}

        {tab === 'you' && (
          <div className="list-view">
            <div className="profile-card">
              <div className="profile-level">LV {level}</div>
              <div className="xp-bar big"><div className="xp-fill" style={{ width: `${progress * 100}%` }} /></div>
              <div className="profile-stats">
                <div><b>{xp}</b><span>XP</span></div>
                <div><b>{visited.size}</b><span>visited</span></div>
                <div><b>{pct}%</b><span>explored</span></div>
              </div>
            </div>
            <h2 className="quest-h"><Glyph name="crown" /> Badges</h2>
            <div className="badges">
              {BADGES.map(b => {
                const got = b.earned(visited, places)
                return (
                  <div key={b.id} className={`badge ${got ? 'badge-got' : ''}`}>
                    <span className="badge-icon"><Glyph name={b.icon} size={22} /></span>
                    <b>{b.name}</b>
                    <span className="badge-desc">{b.desc}</span>
                  </div>
                )
              })}
            </div>
            {visited.size > 0 && (
              <>
                <h2 className="quest-h" style={{ marginTop: 22 }}><Glyph name="check" /> Conquered</h2>
                {places.filter(p => visited.has(p.id)).map(p => (
                  <PlaceRow key={p.id} p={p} done onClick={() => { setSelected(p) }} />
                ))}
              </>
            )}

            <h2 className="quest-h" style={{ marginTop: 22 }}><Glyph name="pin" /> Add Your Own Spot</h2>
            <p className="hint">Your personal pin — only on your map. GEDI is favourites-only, so make it count.</p>
            <AddPlaceForm
              mode="personal"
              onDone={p => { addLocalPlace(p); setPlacesV(v => v + 1); setToast('SPOT ADDED TO YOUR MAP'); setTimeout(() => setToast(null), 2600) }}
            />

            <TagSection onToast={m => { setToast(m); setTimeout(() => setToast(null), 3200) }} />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="nav">
        {([
          ['map', 'map', 'MAP'],
          ['explore', 'compass', 'EXPLORATIONS'],
          ['picks', 'star', 'SPECIAL PICKS'],
          ['you', 'user', 'YOUR PICKS'],
        ] as const).map(([t, icon, label]) => (
          <button key={t} className={tab === t ? 'nav-active' : ''} onClick={() => setTab(t)}>
            <Glyph name={icon} size={19} />{label}
          </button>
        ))}
      </nav>

      {/* Place detail sheet */}
      {selected && (
        <div className="sheet-backdrop" onClick={() => setSelectedState(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-head">
              <div>
                <span className={`pill pill-${selected.quest}`}><Glyph name={QUEST_META[selected.quest].icon} size={11} /> {QUEST_META[selected.quest].label.replace(/s$/, '')}</span>
                <span className="pill"><Glyph name={catIcon(selected.category)} size={11} /> {selected.category}</span>
                <span className="pill pill-xp">+{selected.xp} XP</span>
              </div>
              <h2>{selected.name}</h2>
              <div className="sheet-area">{selected.area}</div>
            </div>
            <p className="sheet-desc">{selected.description}</p>
            <div className="facts">
              <div><Glyph name="coin" /><span>{selected.budget}</span></div>
              <div><Glyph name="clock" /><span>{selected.bestTime}</span></div>
              <div><Glyph name="hourglass" /><span>{selected.duration}</span></div>
              <div><Glyph name="metro" /><span>{selected.metro}</span></div>
            </div>
            <div className="sid">
              <div className="sid-title">Sid’s Special</div>
              {selected.sid}
            </div>
            <div className="sheet-actions">
              <a className="btn btn-ghost" href={selected.maps} target="_blank" rel="noreferrer">
                <Glyph name="pin" size={14} /> NAVIGATE
              </a>
              <button
                className={`btn ${visited.has(selected.id) ? 'btn-done' : 'btn-primary'}`}
                onClick={() => toggleVisited(selected)}
              >
                {visited.has(selected.id) ? 'CONQUERED' : 'MARK VISITED'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

const CATEGORIES = ['Food', 'Street Food', 'Dessert', 'Historical', 'Lake', 'Museum', 'Adventure', 'Culture', 'Park', 'Night Drive', 'Temple', 'Weekend Trip', 'Mall']
const QUEST_XP: Record<Quest, number> = { main: 100, side: 60, special: 80 }

function AddPlaceForm({ mode, onDone }: { mode: 'personal' | 'tag'; onDone: (p: Place) => void }) {
  const [f, setF] = useState({ name: '', area: '', category: 'Food', quest: 'side' as Quest, description: '', budget: '', bestTime: '', duration: '', metro: '', sid: '', lat: '', lng: '' })
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }))
  const locate = () => navigator.geolocation?.getCurrentPosition(
    p => setF(prev => ({ ...prev, lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) })),
    () => alert('Location unavailable — enter coordinates manually (long-press in Google Maps to copy them).'),
  )
  const submit = () => {
    const lat = parseFloat(f.lat), lng = parseFloat(f.lng)
    if (!f.name.trim() || isNaN(lat) || isNaN(lng)) { alert('Need at least a name + coordinates (use the location button, or long-press in Google Maps).'); return }
    onDone({
      id: f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + (mode === 'personal' ? '-local' : ''),
      name: f.name.trim(), area: f.area || 'Hyderabad', category: f.category, quest: f.quest,
      collections: [], description: f.description || f.name, lat, lng,
      budget: f.budget || '₹?', bestTime: f.bestTime || 'Anytime', duration: f.duration || '1–2 hrs',
      metro: f.metro || '—', xp: QUEST_XP[f.quest],
      maps: `https://maps.google.com/?q=${lat},${lng}`,
      sid: f.sid || (mode === 'personal' ? 'My personal pick.' : ''), tags: [],
    })
    setF({ name: '', area: '', category: 'Food', quest: 'side', description: '', budget: '', bestTime: '', duration: '', metro: '', sid: '', lat: '', lng: '' })
  }
  return (
    <div className="form">
      <input className="fi" placeholder="NAME *" value={f.name} onChange={e => set('name', e.target.value)} />
      <div className="frow">
        <input className="fi" placeholder="AREA" value={f.area} onChange={e => set('area', e.target.value)} />
        <select className="fi" value={f.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="frow">
        <input className="fi" placeholder="LAT *" value={f.lat} onChange={e => set('lat', e.target.value)} />
        <input className="fi" placeholder="LNG *" value={f.lng} onChange={e => set('lng', e.target.value)} />
        <button className="fi fbtn" onClick={locate} title="Use my location"><Glyph name="target" size={15} /></button>
      </div>
      {mode === 'tag' && (
        <select className="fi" value={f.quest} onChange={e => set('quest', e.target.value)}>
          <option value="main">Main Quest</option><option value="side">Side Quest</option><option value="special">Special</option>
        </select>
      )}
      <textarea className="fi" rows={2} placeholder="WHY IS IT A FAVOURITE?" value={f.description} onChange={e => set('description', e.target.value)} />
      <div className="frow">
        <input className="fi" placeholder="BUDGET (₹)" value={f.budget} onChange={e => set('budget', e.target.value)} />
        <input className="fi" placeholder="BEST TIME" value={f.bestTime} onChange={e => set('bestTime', e.target.value)} />
      </div>
      {mode === 'tag' && <textarea className="fi" rows={2} placeholder="SID'S SPECIAL / INSIDER TIP" value={f.sid} onChange={e => set('sid', e.target.value)} />}
      <button className="btn btn-primary" onClick={submit}>
        <Glyph name="pin" size={14} /> {mode === 'personal' ? 'PIN IT' : 'GENERATE & COPY JSON'}
      </button>
    </div>
  )
}

// SHA-256 of the TAG password — a speed bump for casual users, NOT real security
// (client-side code is public). Change: printf 'newpass' | shasum -a 256
const TAG_HASH = '26abfab626f13890a8944fd242d853025f46ac7173c639146125d7e65ec5bcde'

function TagSection({ onToast }: { onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [ok, setOk] = useState(false)
  const check = async () => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
    if (hex === TAG_HASH) setOk(true)
    else onToast('WRONG PASSWORD, CHOOM')
  }
  const submitTag = async (p: Place) => {
    await navigator.clipboard.writeText(JSON.stringify(p, null, 2) + ',')
    window.open('https://github.com/saix0x0/gedi/edit/main/src/data/places.json', '_blank')
    onToast('JSON COPIED — PASTE INTO places.json & COMMIT')
  }
  return (
    <div className="tag-section">
      <button className="tag-head" onClick={() => setOpen(o => !o)}>
        <Glyph name="campus" size={15} /> TAG MEMBERS ONLY
      </button>
      {open && !ok && (
        <div className="frow" style={{ marginTop: 10 }}>
          <input className="fi" type="password" placeholder="PASSWORD" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} />
          <button className="fi fbtn" onClick={check}><Glyph name="check" size={15} /></button>
        </div>
      )}
      {open && ok && (
        <>
          <p className="hint">Adds go live for <b>everyone</b>: this copies the place JSON and opens places.json on GitHub — paste inside the list, commit, done (~1 min to deploy). No repo access? Send the copied JSON to Sid.</p>
          <AddPlaceForm mode="tag" onDone={submitTag} />
        </>
      )}
    </div>
  )
}

function PlaceRow({ p, done, onClick }: { p: Place; done: boolean; onClick: () => void }) {
  return (
    <button className={`row ${done ? 'row-done' : ''}`} onClick={onClick}>
      <span className={`row-icon rq-${p.quest}`}><Glyph name={catIcon(p.category)} size={17} /></span>
      <div className="row-main">
        <b>{p.name}</b>
        <span className="row-sub">{p.area} · {p.budget}</span>
      </div>
      <span className="row-xp">{done ? <Glyph name="check" size={15} /> : `+${p.xp}`}</span>
    </button>
  )
}
