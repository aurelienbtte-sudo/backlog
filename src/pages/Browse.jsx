import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trending, isLive } from '../api/index.js'
import { useStore, sortedDiary } from '../store.js'
import { Grid } from '../components/MediaCard.jsx'
import { TYPES, ARTIFACT } from '../types.js'

// Page d'un onglet de la barre du bas : Jeux, Cinéma (films + séries) ou Musique
export default function Browse({ title, types }) {
  const [type, setType] = useState(types[0])
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const diary = useStore((s) => s.diary)

  useEffect(() => {
    let alive = true
    setError(null)
    setItems([])
    trending(type, (partial) => {
      if (!alive) return false
      setItems(partial)
    })
      .then((r) => alive && setItems(r))
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [type])

  // Les dernières œuvres de ce type que tu as ajoutées au journal (sans doublon)
  const seen = new Set()
  const mine = sortedDiary(diary)
    .filter((l) => types.includes(l.item.type) && !seen.has(l.itemId) && seen.add(l.itemId))
    .slice(0, 8)
    .map((l) => l.item)

  const live = isLive(type) && type !== 'album'

  return (
    <>
      <h1 className="page-title">{title}</h1>

      {types.length > 1 && (
        <div className="segmented" role="tablist">
          {types.map((t) => (
            <button key={t} role="tab" aria-selected={type === t} className={type === t ? 'active' : ''} onClick={() => setType(t)}>
              {TYPES[t].label}
            </button>
          ))}
        </div>
      )}

      {mine.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Récemment dans ton journal</h2>
            <Link to="/journal">Tout voir →</Link>
          </div>
          <Grid items={mine} />
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>{live ? 'Populaire en ce moment' : 'Sélection'}</h2>
        </div>
        {ARTIFACT && (
          <p className="notice">Version d'essai : choisis parmi ces {TYPES[type].label.toLowerCase()} de démonstration, ou utilise la recherche.</p>
        )}
        {!ARTIFACT && !isLive(type) && (
          <p className="notice">
            Mode démo pour les {TYPES[type].label.toLowerCase()}. <Link to="/reglages">Ajoute une clé API gratuite</Link> pour accéder au catalogue complet.
          </p>
        )}
        {error ? <p className="error">{error}</p> : <Grid items={ARTIFACT ? items : items.slice(0, 20)} />}
      </section>
    </>
  )
}
