import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { search } from '../api/index.js'
import { Grid } from '../components/MediaCard.jsx'
import { TYPES, TYPE_KEYS } from '../types.js'

// Résultats de la barre de recherche : films, séries, jeux et musique en même temps
export default function Search() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const [results, setResults] = useState({})

  useEffect(() => {
    if (!q) {
      setResults({})
      return
    }
    let alive = true
    setResults(Object.fromEntries(TYPE_KEYS.map((t) => [t, { status: 'loading' }])))
    TYPE_KEYS.forEach((t) =>
      search(t, q)
        .then((items) => alive && setResults((r) => ({ ...r, [t]: { status: 'done', items } })))
        .catch((e) => alive && setResults((r) => ({ ...r, [t]: { status: 'error', error: e.message } })))
    )
    return () => {
      alive = false
    }
  }, [q])

  const all = Object.values(results)
  const nothing = q && all.length && all.every((r) => r.status === 'done' && !r.items.length)

  return (
    <>
      <h1 className="page-title">Recherche</h1>
      {!q && <p className="muted">Tape le nom d'un film, d'une série, d'un jeu ou d'un album dans la barre en bas.</p>}
      {nothing && <p className="muted">Aucun résultat pour « {q} ».</p>}
      {TYPE_KEYS.map((t) => {
        const r = results[t]
        if (!r || (r.status === 'done' && !r.items.length)) return null
        return (
          <section key={t}>
            <div className="section-head">
              <h2>{TYPES[t].label}</h2>
            </div>
            {r.status === 'loading' && <p className="muted">Recherche…</p>}
            {r.status === 'error' && <p className="error">{r.error}</p>}
            {r.status === 'done' && <Grid items={r.items.slice(0, 9)} />}
          </section>
        )
      })}
    </>
  )
}
