import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon } from './TabBar.jsx'
import { SCOPES, scopeOf } from '../search-scope.js'

// Barre de recherche flottante, au-dessus de la barre d'onglets (maquette Figma).
// La recherche se lance pendant la frappe, dans la catégorie de l'onglet en cours (tout, depuis l'Accueil).
export default function SearchBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const onSearchPage = pathname === '/recherche'
  const current = onSearchPage ? params.get('q') || '' : ''
  const [q, setQ] = useState(current)
  const inputRef = useRef(null)
  const scope = scopeOf(pathname, params)
  const go = (value) => navigate(`/recherche?q=${encodeURIComponent(value)}&dans=${scope}`, { replace: onSearchPage })

  // En quittant la page de recherche, la barre se vide
  useEffect(() => {
    if (!onSearchPage) setQ('')
  }, [onSearchPage])

  // On attend que l'utilisateur arrête de taper avant de chercher
  useEffect(() => {
    const value = q.trim()
    if (!value || value === current) return
    const t = setTimeout(() => go(value), 350)
    return () => clearTimeout(t)
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    inputRef.current.blur() // ferme le clavier
    const value = q.trim()
    if (value && value !== current) go(value)
  }

  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        aria-label="Rechercher"
        placeholder={SCOPES[scope].placeholder}
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
