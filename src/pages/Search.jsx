import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { search, searchArtists } from '../api/index.js'
import { Grid } from '../components/MediaCard.jsx'
import { TYPES } from '../types.js'
import { SCOPES } from '../search-scope.js'

const LABELS = { artiste: 'Artistes et groupes' }
const TITLES = { jeux: 'Jeux', cinema: 'Cinéma', musique: 'Musique', tout: 'Recherche' }
const fans = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} M de fans` : n >= 1e3 ? `${Math.round(n / 1e3)} k fans` : `${n} fans`)

// Résultats de la barre de recherche, dans la catégorie de l'onglet d'où l'on cherche
export default function Search() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const scope = SCOPES[params.get('dans')] ? params.get('dans') : 'tout'
  const types = SCOPES[scope].types
  const [results, setResults] = useState({})

  useEffect(() => {
    if (!q) {
      setResults({})
      return
    }
    let alive = true
    setResults(Object.fromEntries(types.map((t) => [t, { status: 'loading' }])))
    types.forEach((t) =>
      (t === 'artiste' ? searchArtists(q) : search(t, q))
        .then((items) => alive && setResults((r) => ({ ...r, [t]: { status: 'done', items } })))
        // artistes : Deezer peut être indisponible, la section se masque simplement
        .catch((e) => alive && setResults((r) => ({ ...r, [t]: t === 'artiste' ? { status: 'done', items: [] } : { status: 'error', error: e.message } })))
    )
    return () => {
      alive = false
    }
  }, [q, scope])

  const all = Object.values(results)
  const nothing = q && all.length && all.every((r) => r.status === 'done' && !r.items.length)

  return (
    <>
      <h1 className="page-title">{TITLES[scope]}</h1>
      {!q && <p className="muted">Tape ta recherche dans la barre en bas.</p>}
      {nothing && <p className="muted">Aucun résultat pour « {q} ».</p>}
      {types.map((t) => {
        const r = results[t]
        if (!r || (r.status === 'done' && !r.items.length)) return null
        return (
          <section key={t}>
            <div className="section-head">
              <h2>{LABELS[t] || TYPES[t].label}</h2>
            </div>
            {r.status === 'loading' && <p className="muted">Recherche…</p>}
            {r.status === 'error' && <p className="error">{r.error}</p>}
            {r.status === 'done' &&
              (t === 'artiste' ? (
                <div className="artist-row">
                  {r.items.map((a) => (
                    <Link key={a.id} to={`/artiste/${a.id}`} className="artist-chip">
                      {a.picture ? <img src={a.picture} alt="" loading="lazy" /> : <span className="artist-ph">{a.name[0]}</span>}
                      <strong>{a.name}</strong>
                      <span>{fans(a.fans)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Grid items={r.items.slice(0, 12)} quickDone />
              ))}
          </section>
        )
      })}
    </>
  )
}
