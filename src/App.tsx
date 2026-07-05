import { useEffect, useMemo, useState, useCallback } from 'react'
import MapView from './MapView'
import {
  getPlaces, getVisited, setVisited as persistVisited, totalXp, levelFromXp,
  BADGES, COLLECTIONS, type Place, type Quest, type Theme,
} from './store'

type Tab = 'map' | 'quests' | 'collections' | 'you'

const QUEST_META: Record<Quest, { label: string; icon: string }> = {
  main: { label: 'Main Quests', icon: '⚔️' },
  side: { label: 'Side Quests', icon: '🗺️' },
  special: { label: 'Specials', icon: '✨' },
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
        setToast(newBadge ? `+${p.xp} XP · Badge unlocked: ${newBadge.icon} ${newBadge.name}` : `+${p.xp} XP`)
        setTimeout(() => setToast(null), 2600)
      }
      persistVisited(next)
      return next
    })
  }, [places])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return places
    return places.filter(p =>
      [p.name, p.area, p.category, ...p.tags].join(' ').toLowerCase().includes(q))
  }, [places, query])

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
          title={theme === 'cyber' ? 'Switch to Frontier mode' : 'Switch to Night City mode'}
          onClick={() => setTheme(t => (t === 'cyber' ? 'rdr' : 'cyber'))}
        >
          {theme === 'cyber' ? '🤠' : '🌆'}
        </button>
        <div className="hud-stats">
          <div className="hud-level">LV {level}</div>
          <div className="xp-bar"><div className="xp-fill" style={{ width: `${progress * 100}%` }} /></div>
          <div className="hud-xp">{xp} XP · {pct}% explored</div>
        </div>
      </header>

      {/* Views */}
      <main className="view">
        {tab === 'map' && (
          <>
            <input
              className="search"
              placeholder="Search places, food, vibes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <MapView places={filtered} visited={visited} onSelect={setSelected} theme={theme} routeTo={routeTo} />
          </>
        )}

        {tab === 'quests' && (
          <div className="list-view">
            {(['main', 'side', 'special'] as Quest[]).map(q => {
              const qs = places.filter(p => p.quest === q)
              const done = qs.filter(p => visited.has(p.id)).length
              return (
                <section key={q}>
                  <h2 className={`quest-h quest-${q}`}>
                    {QUEST_META[q].icon} {QUEST_META[q].label}
                    <span className="quest-count">{done}/{qs.length}</span>
                  </h2>
                  {qs.map(p => (
                    <PlaceRow key={p.id} p={p} done={visited.has(p.id)} onClick={() => setSelected(p)} />
                  ))}
                </section>
              )
            })}
          </div>
        )}

        {tab === 'collections' && (
          <div className="list-view">
            {COLLECTIONS.map(c => {
              const ps = places.filter(p => p.collections.includes(c.id))
              if (!ps.length) return null
              return (
                <section key={c.id}>
                  <h2 className="quest-h">{c.icon} {c.name}</h2>
                  {ps.map(p => (
                    <PlaceRow key={p.id} p={p} done={visited.has(p.id)} onClick={() => setSelected(p)} />
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
            <h2 className="quest-h">🏅 Badges</h2>
            <div className="badges">
              {BADGES.map(b => {
                const got = b.earned(visited, places)
                return (
                  <div key={b.id} className={`badge ${got ? 'badge-got' : ''}`}>
                    <span className="badge-icon">{b.icon}</span>
                    <b>{b.name}</b>
                    <span className="badge-desc">{b.desc}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="nav">
        {([['map', '🗺️', 'Map'], ['quests', '⚔️', 'Quests'], ['collections', '🎒', 'Collections'], ['you', '🧑‍🚀', 'You']] as const).map(([t, icon, label]) => (
          <button key={t} className={tab === t ? 'nav-active' : ''} onClick={() => setTab(t)}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </nav>

      {/* Place detail sheet */}
      {selected && (
        <div className="sheet-backdrop" onClick={() => setSelected(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-head">
              <div>
                <span className={`pill pill-${selected.quest}`}>{QUEST_META[selected.quest].label.replace(/s$/, '')}</span>
                <span className="pill">{selected.category}</span>
                <span className="pill pill-xp">+{selected.xp} XP</span>
              </div>
              <h2>{selected.name}</h2>
              <div className="sheet-area">{selected.area}</div>
            </div>
            <p className="sheet-desc">{selected.description}</p>
            <div className="facts">
              <div><span>💰</span>{selected.budget}</div>
              <div><span>🕐</span>{selected.bestTime}</div>
              <div><span>⏳</span>{selected.duration}</div>
              <div><span>🚇</span>{selected.metro}</div>
            </div>
            <div className="sid">
              <div className="sid-title">Sid’s Special</div>
              {selected.sid}
            </div>
            <div className="sheet-actions">
              <a className="btn btn-ghost" href={selected.maps} target="_blank" rel="noreferrer">
                Open in Maps ↗
              </a>
              <button
                className={`btn ${visited.has(selected.id) ? 'btn-done' : 'btn-primary'}`}
                onClick={() => toggleVisited(selected)}
              >
                {visited.has(selected.id) ? '✓ Visited' : 'Mark Visited'}
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
      <div className="row-main">
        <b>{p.name}</b>
        <span className="row-sub">{p.area} · {p.budget}</span>
      </div>
      <span className="row-xp">{done ? '✓' : `+${p.xp}`}</span>
    </button>
  )
}
