import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon } from './TabBar.jsx'

// Barre de recherche flottante, au-dessus de la barre d'onglets (maquette Figma).
// La recherche se lance pendant la frappe et cherche dans tous les catalogues à la fois.
export default function SearchBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const onSearchPage = pathname === '/recherche'
  const current = onSearchPage ? params.get('q') || '' : ''
  const [q, setQ] = useState(current)
  const inputRef = useRef(null)

  // En quittant la page de recherche, la barre se vide
  useEffect(() => {
    if (!onSearchPage) setQ('')
  }, [onSearchPage])

  // On attend que l'utilisateur arrête de taper avant de chercher
  useEffect(() => {
    const value = q.trim()
    if (!value || value === current) return
    const t = setTimeout(() => navigate(`/recherche?q=${encodeURIComponent(value)}`, { replace: onSearchPage }), 350)
    return () => clearTimeout(t)
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    inputRef.current.blur() // ferme le clavier
    const value = q.trim()
    if (value && value !== current) navigate(`/recherche?q=${encodeURIComponent(value)}`, { replace: onSearchPage })
  }

  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        aria-label="Rechercher"
        placeholder="Rechercher un film, une série, un jeu…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q && (
        <button type="button" className="searchbar-clear" aria-label="Effacer" onClick={() => { setQ(''); inputRef.current.focus() }}>
          ✕
        </button>
      )}
    </form>
  )
}
