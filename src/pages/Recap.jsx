import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store.js'
import { Grid, itemPath } from '../components/MediaCard.jsx'
import Cover from '../components/Cover.jsx'
import { Stars } from '../components/Stars.jsx'
import { TYPES } from '../types.js'
import { filmHours, viewsOf, useFilmRuntimes } from '../stats.js'

const formatHours = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`)

// Récapitulatif d'une catégorie du profil (séries, jeux, musique, films) ou des heures de films
export default function Recap() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { entries, diary } = useStore()
  const year = String(new Date().getFullYear())
  useFilmRuntimes()

  const isHours = type === 'heures'
  if (!isHours && !TYPES[type]) return <p>Catégorie inconnue.</p>
  const kind = isHours ? 'film' : type

  // Œuvres vues / jouées / écoutées de la catégorie, les plus récentes d'abord
  const done = Object.values(entries)
    .filter((e) => e.item.type === kind && viewsOf(e, diary, year).total > 0)
    .map((e) => ({ entry: e, views: viewsOf(e, diary, year) }))
    .sort((a, b) => b.entry.updatedAt - a.entry.updatedAt)

  const back = (
    <button className="recap-back" onClick={() => navigate(-1)} aria-label="Retour">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )

  if (isHours) {
    const hours = filmHours(entries, diary, year)
    const films = done
      .filter((d) => d.entry.item.runtime)
      .map((d) => ({ ...d, minutes: d.views.total * d.entry.item.runtime }))
      .sort((a, b) => b.minutes - a.minutes)
    const missing = done.length - films.length
    return (
      <>
        {back}
        <h1 className="page-title">Heures visionnées</h1>
        <div className="stats recap-stats">
          <div className="stat"><strong>{hours.total} h</strong><span>au total</span></div>
          <div className="stat"><strong>{hours.thisYear} h</strong><span>en {year}</span></div>
          <div className="stat"><strong>{films.length ? Math.round(films.reduce((s, f) => s + f.entry.item.runtime, 0) / films.length) : 0}</strong><span>min par film</span></div>
        </div>
        <section>
          <div className="section-head"><h2>Les films qui t'ont pris le plus de temps</h2></div>
          {films.length === 0 && <p className="muted">Marque un film comme vu pour commencer le compteur.</p>}
          <div className="diary">
            {films.map(({ entry, views, minutes }) => (
              <Link key={entry.item.id} to={itemPath(entry.item)} className="recap-row">
                <Cover item={entry.item} size="sm" />
                <div className="recap-row-body">
                  <strong>{entry.item.title}</strong>
                  <span className="muted small">
                    {formatHours(entry.item.runtime)}
                    {views.total > 1 ? ` · vu ${views.total} fois` : ''}
                  </span>
                </div>
                <span className="recap-row-value">{formatHours(minutes)}</span>
              </Link>
            ))}
          </div>
          {missing > 0 && <p className="muted small">{missing} film{missing > 1 ? 's' : ''} sans durée connue, non compté{missing > 1 ? 's' : ''}.</p>}
        </section>
      </>
    )
  }

  const t = TYPES[type]
  const thisYear = done.filter((d) => d.views.thisYear > 0)
  const before = done.filter((d) => d.views.thisYear === 0)
  const rated = done.filter((d) => d.entry.rating > 0)
  const avg = rated.length ? (rated.reduce((s, d) => s + d.entry.rating, 0) / rated.length / 2).toFixed(1).replace('.', ',') : '–'
  const liked = done.filter((d) => d.entry.liked).length
  const top = [...rated].sort((a, b) => b.entry.rating - a.entry.rating).slice(0, 4)

  return (
    <>
      {back}
      <h1 className="page-title">{t.label}</h1>
      <div className="stats recap-stats">
        <div className="stat"><strong>{done.length}</strong><span>{t.done.toLowerCase()}{done.length > 1 && !t.done.endsWith('s') ? 's' : ''}</span></div>
        <div className="stat"><strong>{thisYear.length}</strong><span>en {year}</span></div>
        <div className="stat"><strong>{avg}</strong><span>note moyenne</span></div>
      </div>
      {liked > 0 && <p className="muted">♥ {liked} coup{liked > 1 ? 's' : ''} de cœur</p>}

      {top.length > 0 && (
        <section>
          <div className="section-head"><h2>Tes mieux notés</h2></div>
          <div className="recap-top">
            {top.map(({ entry }) => (
              <Link key={entry.item.id} to={itemPath(entry.item)}>
                <Cover item={entry.item} />
                <Stars value={entry.rating} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-head"><h2>En {year}</h2></div>
        <Grid items={thisYear.map((d) => d.entry.item)} empty={`Rien pour l'instant en ${year}.`} />
      </section>
      {before.length > 0 && (
        <section>
          <div className="section-head"><h2>Avant {year}</h2></div>
          <Grid items={before.map((d) => d.entry.item)} />
        </section>
      )}
    </>
  )
}
