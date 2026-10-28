import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getItem } from '../api/index.js'
import { useStore, updateEntry, addLog, removeLog, sortedDiary } from '../store.js'
import DiaryRow from '../components/DiaryRow.jsx'
import TrailerPlayer from '../components/TrailerPlayer.jsx'
import { StarRating } from '../components/Stars.jsx'
import { TYPES, todayISO } from '../types.js'

const duration = (ms) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}` : '')

// Date complète au format français : 08/10/2025 (ou juste l'année si on n'a que ça)
const formatDate = (d) => (d && d.length === 10 ? new Date(d + 'T12:00').toLocaleDateString('fr-FR') : d)

export default function Item() {
  const { type, sourceId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)
  const [showPoster, setShowPoster] = useState(false)
  const [writing, setWriting] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    let alive = true
    setItem(null)
    setError(null)
    setWriting(false)
    setPlaying(false)
    getItem(type, sourceId)
      .then((i) => alive && setItem(i))
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [type, sourceId])

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  if (!TYPES[type]) return <p>Type inconnu.</p>

  const backButton = (
    <button className="back-btn" onClick={back} aria-label="Retour">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
  if (error) return <div className="item-status">{backButton}<p className="error">Impossible de charger cette fiche : {error}</p></div>
  if (!item) return <div className="item-status">{backButton}<p className="muted">Chargement…</p></div>

  const heroImage = item.backdrop || item.posterLarge || item.cover
  const poster = item.posterLarge || item.cover
  const trailer =
    item.trailer ||
    `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${item.title} ${item.year} ${type === 'album' ? item.subtitle : type === 'jeu' ? 'trailer' : 'bande annonce'}`
    )}`
  const hue = [...item.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

  const scrollToReviews = () => {
    setWriting(true)
    document.getElementById('critiques')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <article className="item" style={{ '--hue': hue, '--accent': TYPES[type].color }}>
      {/* Grande image en haut, qui se fond dans la page ; une copie floutée colore le fond en dessous */}
      <div className={`hero ${playing ? 'playing' : ''}`}>
        {heroImage && <div className="hero-ambient" style={{ backgroundImage: `url(${heroImage})` }} />}
        <div className={`hero-image ${heroImage ? '' : 'placeholder'} ${type === 'album' ? 'square' : ''}`} style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined} />
        {backButton}
        {playing && <TrailerPlayer item={item} onClose={() => setPlaying(false)} />}
        <div className="hero-content">
          <h1 className="hero-title">{item.title}</h1>
          <p className="hero-sub">
            {[item.subtitle && `par ${item.subtitle}`, formatDate(item.released) || item.year].filter(Boolean).join(' | ')}
          </p>
          <div className="hero-buttons">
            <button className="glass-btn" onClick={scrollToReviews}>Critiques</button>
            {item.trailerKey || item.trailerVideo ? (
              <button className="glass-btn" onClick={() => setPlaying(!playing)}>
                {playing ? 'Fermer la vidéo' : 'Bande-annonce'}
              </button>
            ) : (
              <a className="glass-btn" href={trailer} target="_blank" rel="noreferrer">
                {type === 'album' ? 'Écouter' : 'Bande-annonce'}
              </a>
            )}
            {poster && <button className="glass-btn" onClick={() => setShowPoster(true)}>{type === 'album' ? 'Pochette' : 'Affiche'}</button>}
          </div>
        </div>
      </div>

      <div className="item-body">
        {item.facts?.length > 0 && <p className="item-facts">{item.facts.join(' · ')}</p>}
        {item.genres?.length > 0 && (
          <div className="chips">{item.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>
        )}
        {item.overview && <p className="overview">{item.overview}</p>}
        {item.cast?.length > 0 && <p className="small"><span className="muted">Avec </span>{item.cast.join(', ')}</p>}

        <ActionPanel item={item} />

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

        <Reviews item={item} writing={writing} setWriting={setWriting} />
      </div>

      {showPoster && (
        <div className="lightbox" onClick={() => setShowPoster(false)} role="dialog" aria-label={`${item.type === 'album' ? 'Pochette' : 'Affiche'} de ${item.title}`}>
          <img src={poster} alt={item.title} />
          <button className="back-btn lightbox-close" aria-label="Fermer">✕</button>
        </div>
      )}
    </article>
  )
}

function ActionPanel({ item }) {
  const entry = useStore((s) => s.entries[item.id]) || {}
  const t = TYPES[item.type]

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

function Reviews({ item, writing, setWriting }) {
  const diary = useStore((s) => s.diary)
  const entry = useStore((s) => s.entries[item.id]) || {}
  const logs = sortedDiary(diary.filter((l) => l.itemId === item.id))
  return (
    <section id="critiques" className="reviews">
      <div className="section-head">
        <h2>Critiques</h2>
      </div>
      {logs.length > 0 && <div className="diary">{logs.map((l) => <DiaryRow key={l.id} log={l} onDelete={removeLog} />)}</div>}
      {writing ? (
        <LogForm item={item} entry={entry} onDone={() => setWriting(false)} />
      ) : (
        <button className="primary wide" onClick={() => setWriting(true)}>
          {logs.length ? 'Ajouter au journal' : 'Écrire une critique'}
        </button>
      )}
    </section>
  )
}
