import { Link } from 'react-router-dom'
import Cover from './Cover.jsx'
import { Stars } from './Stars.jsx'
import { itemPath } from './MediaCard.jsx'
import { TYPES } from '../types.js'

const fmt = (d) => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function DiaryRow({ log, onDelete }) {
  const { item } = log
  return (
    <div className="diary-row">
      <time className="diary-date">{fmt(log.date)}</time>
      <Link to={itemPath(item)}><Cover item={item} size="sm" /></Link>
      <div className="diary-body">
        <Link to={itemPath(item)} className="diary-title">
          {item.title} <span className="muted">{item.year}</span>
        </Link>
        <div className="diary-meta">
          <span className="type-pill" style={{ '--accent': TYPES[item.type].color }}>{TYPES[item.type].icon} {TYPES[item.type].one}</span>
          <Stars value={log.rating} />
          {log.liked && <span className="heart">♥</span>}
          {log.again && <span className="muted" title="Encore une fois">↻</span>}
        </div>
        {log.review && <p className="review">{log.review}</p>}
      </div>
      {onDelete && (
        <button className="icon-btn" onClick={() => confirm('Supprimer cette entrée du journal ?') && onDelete(log.id)} aria-label="Supprimer">✕</button>
      )}
    </div>
  )
}
