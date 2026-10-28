import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { search } from '../api/index.js'
import { Grid } from '../components/MediaCard.jsx'
import TypeTabs from '../components/TypeTabs.jsx'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const type = params.get('type') || 'film'
  const [input, setInput] = useState(q)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    setInput(q)
  }, [q])

  // On attend que l'utilisateur arrête de taper avant d'interroger l'API
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) setParams({ q: input, type }, { replace: true })
    }, 400)
    return () => clearTimeout(t)
  }, [input])

  useEffect(() => {
    if (!q.trim()) { setResults([]); setStatus('idle'); return }
    let alive = true
    setStatus('loading')
    search(type, q.trim())
      .then((r) => { if (alive) { setResults(r); setStatus('done') } })
      .catch((e) => { if (alive) { setError(e.message); setStatus('error') } })
    return () => { alive = false }
  }, [q, type])

  return (
    <>
      <h1>Recherche</h1>
      <input
        className="big-input"
        type="search"
        autoFocus
        placeholder="Titre, réalisateur, artiste…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <TypeTabs value={type} onChange={(t) => setParams({ q: input, type: t })} />
      {status === 'loading' && <p className="muted">Recherche…</p>}
      {status === 'error' && <p className="error">{error}</p>}
      {status === 'done' && <Grid items={results} empty={`Aucun résultat pour « ${q} ».`} />}
    </>
  )
}
