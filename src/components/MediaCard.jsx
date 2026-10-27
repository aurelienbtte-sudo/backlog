import { Link } from 'react-router-dom'
import Cover from './Cover.jsx'
import { Stars } from './Stars.jsx'
import { useStore } from '../store.js'

export const itemPath = (item) => `/${item.type}/${encodeURIComponent(item.sourceId)}`

export default function MediaCard({ item, showMeta = true }) {
  const entry = useStore((s) => s.entries[item.id])
  return (
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
  )
}

export function Grid({ items, empty = 'Rien ici pour le moment.' }) {
  if (!items.length) return <p className="muted">{empty}</p>
  return (
    <div className="grid">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  )
}
