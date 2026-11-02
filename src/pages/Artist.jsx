import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getArtist } from '../api/index.js'
import { Grid, itemPath } from '../components/MediaCard.jsx'
import { Link } from 'react-router-dom'

const duration = (ms) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}` : '')

// Page d'un artiste ou d'un groupe : photo, morceaux phares et discographie (Deezer)
export default function Artist() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artist, setArtist] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setArtist(null)
    setError(null)
    getArtist(id)
      .then((a) => alive && setArtist(a))
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [id])

  const back = (
    <button className="float-back" onClick={() => navigate(-1)} aria-label="Retour">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
  if (error) return <>{back}<p className="error">Impossible de charger cet artiste : {error}</p></>
  if (!artist) return <>{back}<p className="muted">Chargement…</p></>

  return (
    <div className="artist-page">
      {back}
      <header className="artist-head">
        {artist.picture ? <img src={artist.picture} alt={artist.name} /> : <span className="artist-ph big">{artist.name[0]}</span>}
        <div>
          <h1 className="page-title">{artist.name}</h1>
          <p className="muted">
            {artist.albumCount} album{artist.albumCount > 1 ? "s" : ""} · {artist.fans.toLocaleString('fr-FR')} fans sur Deezer
          </p>
        </div>
      </header>

      {artist.top.length > 0 && (
        <section>
          <div className="section-head"><h2>Titres phares</h2></div>
          <ol className="artist-top">
            {artist.top.map((t, i) => (
              <li key={i}>
                <span className="artist-top-n">{i + 1}</span>
                {t.album ? (
                  <Link to={itemPath(t.album)} className="artist-top-title">
                    <strong>{t.title}</strong>
                    <span className="muted small">{t.album.title}</span>
                  </Link>
                ) : (
                  <strong className="artist-top-title">{t.title}</strong>
                )}
                <span className="muted small">{duration(t.length)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <div className="section-head"><h2>Albums</h2></div>
        <Grid items={artist.albums} quickDone empty="Aucun album trouvé." />
      </section>
      {artist.singles.length > 0 && (
        <section>
          <div className="section-head"><h2>Singles et EP</h2></div>
          <Grid items={artist.singles} quickDone />
        </section>
      )}
    </div>
  )
}
