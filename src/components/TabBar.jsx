import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Barre d'onglets flottante façon iOS 26 (Liquid Glass), d'après la maquette Figma.
// On peut glisser le doigt dessus : une loupe en verre suit le doigt et grossit les onglets,
// et l'onglet sous le doigt s'ouvre quand on lâche.
const ITEMS = [
  { to: '/jeux', label: 'Jeux', color: 'var(--jeu)', match: (p) => p === '/jeux' || p.startsWith('/jeu/') },
  { to: '/cinema', label: 'Cinéma', color: 'var(--film)', match: (p) => p === '/cinema' || p.startsWith('/film/') || p.startsWith('/serie/') },
  { to: '/musique', label: 'Musique', color: 'var(--album)', match: (p) => p === '/musique' || p.startsWith('/album/') },
  {
    to: '/',
    label: 'Accueil',
    color: 'var(--serie)',
    match: (p) => p === '/' || ['/journal', '/a-decouvrir', '/profil', '/reglages'].includes(p),
  },
  { to: '/recherche', label: 'Rechercher', search: true, color: '#fff', match: (p) => p === '/recherche' },
]

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

// Le contenu des onglets, utilisé deux fois : la barre elle-même, et sa copie grossie dans la loupe
function Labels({ highlighted, refs }) {
  return ITEMS.map((t, i) => (
    <span
      key={t.to}
      ref={
        refs
          ? (el) => {
              refs.current[i] = el
            }
          : undefined
      }
      className={`tab ${t.search ? 'tab-search' : ''} ${i === highlighted ? 'active' : ''}`}
      style={{ '--accent': t.color }}
    >
      {t.search ? <SearchIcon /> : t.label}
    </span>
  ))
}

export default function TabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const barRef = useRef(null)
  const itemRefs = useRef([])
  const [layout, setLayout] = useState(null) // positions des onglets dans la barre
  const [dragX, setDragX] = useState(null) // position du doigt pendant un glissement

  const activeIndex = ITEMS.findIndex((t) => t.match(pathname))

  // Mesure la position de chaque onglet (et recommence si la taille de la barre change)
  useLayoutEffect(() => {
    const measure = () => {
      const bar = barRef.current.getBoundingClientRect()
      setLayout({
        width: bar.width,
        height: bar.height,
        tabs: itemRefs.current.map((el) => {
          const r = el.getBoundingClientRect()
          return { left: r.left - bar.left, width: r.width, top: r.top - bar.top, height: r.height }
        }),
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(barRef.current)
    return () => observer.disconnect()
  }, [])

  const indexAt = (x) => {
    const tabs = layout.tabs
    const i = tabs.findIndex((t) => x < t.left + t.width)
    return i === -1 ? tabs.length - 1 : i
  }

  const localX = (e) => e.clientX - barRef.current.getBoundingClientRect().left

  const onPointerDown = (e) => {
    if (!layout) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragX(localX(e))
  }
  const onPointerMove = (e) => {
    if (dragX !== null) setDragX(localX(e))
  }
  const onPointerUp = (e) => {
    if (dragX === null) return
    const bar = barRef.current.getBoundingClientRect()
    setDragX(null)
    // Lâcher loin au-dessus de la barre = on annule
    if (e.clientY < bar.top - 60) return
    navigate(ITEMS[indexAt(localX(e))].to)
  }

  const dragging = dragX !== null && layout
  const highlighted = dragging ? indexAt(dragX) : activeIndex

  // Position de la pastille / loupe
  let lens = null
  if (layout && highlighted >= 0) {
    const tab = layout.tabs[highlighted]
    let left = tab.left
    if (dragging) {
      // Pendant le glissement, la loupe suit le doigt (sans sortir de la barre)
      const first = layout.tabs[0]
      const last = layout.tabs[layout.tabs.length - 1]
      const center = Math.min(Math.max(dragX, first.left + tab.width / 2), last.left + last.width - tab.width / 2)
      left = center - tab.width / 2
    }
    lens = { left, top: tab.top, width: tab.width, height: tab.height }
  }

  return (
    <nav
      ref={barRef}
      className={`tabbar ${dragging ? 'dragging' : ''}`}
      aria-label="Navigation principale"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDragX(null)}
    >
      {lens && (
        <div
          className="tab-lens"
          aria-hidden="true"
          style={{ left: lens.left, top: lens.top, width: lens.width, height: lens.height }}
        >
          {/* Copie des onglets, alignée sur la vraie barre : grossie avec la loupe, elle donne l'effet de verre bombé */}
          <div className="tab-lens-content" style={{ left: -lens.left, top: -lens.top, width: layout.width, height: layout.height }}>
            <Labels highlighted={highlighted} />
          </div>
        </div>
      )}
      <Labels highlighted={highlighted} refs={itemRefs} />
      {/* Boutons invisibles pour le clavier et les lecteurs d'écran */}
      <div className="sr-only">
        {ITEMS.map((t, i) => (
          <button key={t.to} aria-current={i === activeIndex ? 'page' : undefined} onClick={() => navigate(t.to)}>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
