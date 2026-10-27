import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

export default function Header() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/recherche?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="dots"><i /><i /><i /><i /></span> Backlog
        </Link>
        <nav>
          <NavLink to="/journal">Journal</NavLink>
          <NavLink to="/a-decouvrir">À découvrir</NavLink>
          <NavLink to="/profil">Profil</NavLink>
          <NavLink to="/reglages" aria-label="Réglages">⚙︎</NavLink>
        </nav>
        <form onSubmit={submit} className="header-search">
          <input type="search" placeholder="Film, série, jeu, album…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
      </div>
    </header>
  )
}
