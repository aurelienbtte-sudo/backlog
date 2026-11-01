import { Link } from 'react-router-dom'
import Cover from './Cover.jsx'
import { Stars } from './Stars.jsx'
import { useStore, updateEntry } from '../store.js'
import { TYPES } from '../types.js'

export const itemPath = (item) => `/${item.type}/${encodeURIComponent(item.sourceId)}`

// quickDone : affiche la coche « vu » sur l'affiche (utilisée seulement dans la recherche)
export default function MediaCard({ item, showMeta = true, quickDone = false }) {
  const entry = useStore((s) => s.entries[item.id])
  const done = Boolean(entry?.done)
  const label = TYPES[item.type].done // Vu, Vue, Joué, Écouté
  // Coche rapide : marque l'œuvre comme vue (ou la décoche) sans ouvrir sa fiche
  const toggle = () => updateEntry(item, { done: !done, wishlist: done ? entry?.wishlist || false : false })

  return (
    <div className="card-wrap">
    <Link to={itemPath(item)} className="card" title={`${item.title}${item.year ? ` (${item.year})` : ''}`}>
      <Cover item={item} />
      {entry && (entry.rating > 0 || entry.liked || entry.wishlist) && (
        <div className="card-badges">
          <Stars value={entry.rating} />
          {entry.liked && <span className="heart">♥</span>}
          {entry.wishlist && !entry.done && <span title="Dans ta liste">⏳</span>}
        </div>
      )}
      {showMeta && (
        <div className="card-meta">
          <strong>{item.title}</strong>
          <span>{[item.year, item.subtitle].filter(Boolean).join(' · ')}</span>
        </div>
      )}
    </Link>
      {quickDone && (
      <button
        type="button"
        className={`quick-done ${done ? 'on' : ''}`}
        onClick={toggle}
        aria-pressed={done}
        aria-label={`${done ? 'Retirer' : 'Marquer'} « ${item.title} » comme ${label.toLowerCase()}`}
        title={done ? `${label} ✓` : `Marquer comme ${label.toLowerCase()}`}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      )}
    </div>
  )
}

export function Grid({ items, empty = 'Rien ici pour le moment.', quickDone = false }) {
  if (!items.length) return <p className="muted">{empty}</p>
  return (
    <div className="grid">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} quickDone={quickDone} />
      ))}
    </div>
  )
}
