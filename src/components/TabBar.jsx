import { Link, useLocation } from 'react-router-dom'

// Barre d'onglets flottante façon iOS (Liquid Glass), d'après la maquette Figma
const TABS = [
  { to: '/jeux', label: 'Jeux', color: 'var(--jeu)', match: (p) => p === '/jeux' || p.startsWith('/jeu/') },
  { to: '/cinema', label: 'Cinéma', color: 'var(--film)', match: (p) => p === '/cinema' || p.startsWith('/film/') || p.startsWith('/serie/') },
  { to: '/musique', label: 'Musique', color: 'var(--album)', match: (p) => p === '/musique' || p.startsWith('/album/') },
  {
    to: '/',
    label: 'Accueil',
    color: 'var(--serie)',
    match: (p) => p === '/' || ['/journal', '/a-decouvrir', '/profil', '/reglages'].includes(p),
  },
]

export default function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map((t) => {
        const active = t.match(pathname)
        return (
          <Link key={t.to} to={t.to} className={`tab ${active ? 'active' : ''}`} style={{ '--accent': t.color }} aria-current={active ? 'page' : undefined}>
            {t.label}
          </Link>
        )
      })}
      <Link to="/recherche" className={`tab tab-search ${pathname === '/recherche' ? 'active' : ''}`} aria-label="Rechercher">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </Link>
    </nav>
  )
}
