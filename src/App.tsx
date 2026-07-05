import { useEffect, useMemo, useState, useCallback } from 'react'
import MapView from './MapView'
import {
  getPlaces, getVisited, setVisited as persistVisited, totalXp, levelFromXp,
  BADGES, COLLECTIONS, type Place, type Quest, type Theme,
} from './store'
import { svg, catIcon } from './icons'

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
  const places = useMemo(() => getPlaces(), [])
  const [visited, setVisitedState] = useState<Set<string>>(() => getVisited())
  const [tab, setTab] = useState<Tab>('map')
  const [selected, setSelectedState] = useState<Place | null>(null)
  const [routeTo, setRouteTo] = useState<Place | null>(null) // path persists after sheet closes
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('gedi.theme') as Theme) || 'cyber')
  const [filterOpen, setFilterOpen] = useState(false)
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
          title={theme === 'cyber' ? 'Switch to 1899' : 'Switch to 2077'}
          onClick={() => setTheme(t => (t === 'cyber' ? 'rdr' : 'cyber'))}
        >
          {theme === 'cyber' ? '1899' : '2077'}
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
            <MapView places={mapPlaces} visited={visited} onSelect={setSelected} theme={theme} routeTo={routeTo} />

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
