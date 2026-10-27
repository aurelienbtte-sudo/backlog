import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trending, isLive } from '../api/index.js'
import { useStore, sortedDiary } from '../store.js'
import { Grid } from '../components/MediaCard.jsx'
import TypeTabs from '../components/TypeTabs.jsx'
import DiaryRow from '../components/DiaryRow.jsx'
import { TYPES } from '../types.js'

export default function Home() {
  const diary = useStore((s) => s.diary)
  const name = useStore((s) => s.settings.name)
  const [type, setType] = useState('film')
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setError(null)
    trending(type)
      .then((r) => alive && setItems(r))
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [type])

  const recent = sortedDiary(diary).slice(0, 5)
  const live = isLive(type) && type !== 'album'

  return (
    <>
      <section className="hero">
        <h1>{name ? `Bon retour, ${name}.` : 'Garde une trace de tout ce que tu regardes, joues et écoutes.'}</h1>
        <p className="muted">Note, critique et organise tes films, séries, jeux vidéo et albums au même endroit.</p>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Activité récente</h2>
            <Link to="/journal">Tout le journal →</Link>
          </div>
          <div className="diary">{recent.map((l) => <DiaryRow key={l.id} log={l} />)}</div>
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>{live ? 'Populaire en ce moment' : 'Sélection'}</h2>
        </div>
        <TypeTabs value={type} onChange={setType} />
        {!isLive(type) && (
          <p className="notice">
            Mode démo pour les {TYPES[type].label.toLowerCase()}. <Link to="/reglages">Ajoute une clé API gratuite</Link> pour accéder au catalogue complet.
          </p>
        )}
        {type === 'album' && <p className="muted small">Pour la musique, utilise la recherche pour trouver n'importe quel album.</p>}
        {error ? <p className="error">{error}</p> : <Grid items={items.slice(0, 18)} />}
      </section>
    </>
  )
}
