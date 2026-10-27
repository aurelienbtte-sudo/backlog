import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getItem } from '../api/index.js'
import { useStore, updateEntry, addLog, removeLog, sortedDiary } from '../store.js'
import Cover from '../components/Cover.jsx'
import DiaryRow from '../components/DiaryRow.jsx'
import { StarRating } from '../components/Stars.jsx'
import { TYPES, todayISO } from '../types.js'

const duration = (ms) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}` : '')

export default function Item() {
  const { type, sourceId } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setItem(null)
    setError(null)
    getItem(type, sourceId)
      .then((i) => alive && setItem(i))
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [type, sourceId])

  if (!TYPES[type]) return <p>Type inconnu.</p>
  if (error) return <p className="error">Impossible de charger cette fiche : {error}</p>
  if (!item) return <p className="muted">Chargement…</p>

  return (
    <article className={`item ${item.backdrop ? 'has-backdrop' : ''}`}>
      {item.backdrop && <div className="backdrop" style={{ backgroundImage: `url(${item.backdrop})` }} />}
      <div className="item-layout">
        <div className="item-side">
          <Cover item={item} size="lg" />
        </div>
        <div className="item-main">
          <span className="type-pill" style={{ '--accent': TYPES[type].color }}>{TYPES[type].icon} {TYPES[type].one}</span>
          <h1>
            {item.title} <span className="muted year">{item.year}</span>
          </h1>
          {item.subtitle && <p className="subtitle">{type === 'film' ? 'Réalisé par ' : ''}{item.subtitle}</p>}
          {item.facts?.length > 0 && <p className="muted small">{item.facts.join(' · ')}</p>}
          {item.genres?.length > 0 && (
            <div className="chips">{item.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>
          )}
          {item.overview && <p className="overview">{item.overview}</p>}
          {item.cast?.length > 0 && <p className="small"><span className="muted">Avec </span>{item.cast.join(', ')}</p>}
          {item.tracks?.length > 0 && (
            <details className="tracks">
              <summary>{item.tracks.length} morceaux</summary>
              <ol>
                {item.tracks.map((t, i) => (
                  <li key={i}><span>{t.title}</span><span className="muted">{duration(t.length)}</span></li>
                ))}
              </ol>
            </details>
          )}
          <MyLogs item={item} />
        </div>
        <ActionPanel item={item} />
      </div>
    </article>
  )
}

function ActionPanel({ item }) {
  const entry = useStore((s) => s.entries[item.id]) || {}
  const t = TYPES[item.type]
  const [open, setOpen] = useState(false)

  return (
    <aside className="panel">
      <div className="panel-actions">
        <button className={entry.done ? 'on' : ''} onClick={() => updateEntry(item, { done: !entry.done, wishlist: entry.done ? entry.wishlist : false })}>
          <span className="big">👁</span>{t.done}
        </button>
        <button className={entry.liked ? 'on liked' : ''} onClick={() => updateEntry(item, { liked: !entry.liked })}>
          <span className="big">♥</span>J'aime
        </button>
        <button className={entry.wishlist ? 'on' : ''} onClick={() => updateEntry(item, { wishlist: !entry.wishlist })}>
          <span className="big">⏳</span>{t.wish}
        </button>
      </div>
      <div className="panel-rating">
        <span className="muted small">{entry.rating ? 'Ta note' : 'Noter'}</span>
        <StarRating value={entry.rating || 0} onChange={(rating) => updateEntry(item, { rating })} />
      </div>
      {open ? (
        <LogForm item={item} entry={entry} onDone={() => setOpen(false)} />
      ) : (
        <button className="primary wide" onClick={() => setOpen(true)}>Ajouter au journal / critiquer</button>
      )}
    </aside>
  )
}

function LogForm({ item, entry, onDone }) {
  const alreadyLogged = useStore((s) => s.diary.some((l) => l.itemId === item.id))
  const [date, setDate] = useState(todayISO())
  const [rating, setRating] = useState(entry.rating || 0)
  const [review, setReview] = useState('')
  const [liked, setLiked] = useState(entry.liked || false)
  const [again, setAgain] = useState(alreadyLogged)

  const submit = (e) => {
    e.preventDefault()
    addLog(item, { date, rating, review: review.trim(), liked, again })
    onDone()
  }

  return (
    <form className="log-form" onSubmit={submit}>
      <label>
        Date
        <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <StarRating value={rating} onChange={setRating} />
      <textarea placeholder="Ta critique (facultatif)…" rows={5} value={review} onChange={(e) => setReview(e.target.value)} />
      <label className="check"><input type="checkbox" checked={liked} onChange={(e) => setLiked(e.target.checked)} /> J'aime</label>
      <label className="check"><input type="checkbox" checked={again} onChange={(e) => setAgain(e.target.checked)} /> Déjà {TYPES[item.type].done.toLowerCase()} avant</label>
      <div className="row">
        <button type="button" onClick={onDone}>Annuler</button>
        <button type="submit" className="primary">Enregistrer</button>
      </div>
    </form>
  )
}

function MyLogs({ item }) {
  const diary = useStore((s) => s.diary)
  const logs = sortedDiary(diary.filter((l) => l.itemId === item.id))
  if (!logs.length) return null
  return (
    <section>
      <h3>Ton journal</h3>
      <div className="diary">{logs.map((l) => <DiaryRow key={l.id} log={l} onDelete={removeLog} />)}</div>
    </section>
  )
}
