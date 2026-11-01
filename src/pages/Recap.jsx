import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore, addLog, updateLog } from '../store.js'
import { Grid, itemPath } from '../components/MediaCard.jsx'
import Cover from '../components/Cover.jsx'
import { Stars } from '../components/Stars.jsx'
import { TYPES } from '../types.js'
import { filmHours, viewsOf, useFilmRuntimes, setYearViews, setTotalViews } from '../stats.js'

const shortDate = (d) => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const today = () => new Date().toISOString().slice(0, 10)

// Date de visionnage d'un film, modifiable : on change la dernière entrée du journal,
// ou on en crée une si le film a seulement été coché « vu »
function WatchDate({ entry, diary }) {
  const last = diary
    .filter((l) => l.itemId === entry.item.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)[0]
  const change = (e) => {
    const date = e.target.value
    if (!date) return
    if (last) updateLog(last.id, { date })
    else addLog(entry.item, { date, rating: entry.rating || 0, review: '', liked: entry.liked || false, again: false })
  }
  return (
    <label className="watch-date">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{last ? shortDate(last.date) : 'Date'}</span>
      <input type="date" value={last?.date || ''} max={today()} onChange={change} aria-label={`Date de visionnage de ${entry.item.title}`} />
    </label>
  )
}

// Deux pilules (même style que le filtre des notes du profil) : visionnages au total et dans l'année
// Choix de 1 à 10 dans une liste ; « Autre… » transforme la pilule en champ pour taper le nombre
function CountPill({ value, min, label, onChange, suffix }) {
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const options = Array.from({ length: Math.max(0, 10 - min + 1) }, (_, i) => i + min)
  if (value > 10 || value < min) options.push(value) // valeur actuelle hors liste (tapée à la main)
  options.sort((a, b) => a - b)

  const commit = () => {
    const n = Math.floor(Number(draft))
    if (draft !== '' && Number.isFinite(n) && n >= min && n <= 999) onChange(n)
    setTyping(false)
  }

  if (typing) {
    return (
      <label className="pill-select pill-input">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={999}
          autoFocus
          value={draft}
          placeholder={String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="pill-suffix">× {suffix}</span>
      </label>
    )
  }
  return (
    <label className="pill-select">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === 'autre') {
            setDraft('')
            setTyping(true)
          } else onChange(Number(e.target.value))
        }}
      >
        {options.map((n) => (
          <option key={n} value={n}>{n}× {suffix}</option>
        ))}
        <option value="autre">Autre…</option>
      </select>
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </label>
  )
}

function ViewCounts({ entry, diary, views, year }) {
  const logs = diary.filter((l) => l.itemId === entry.item.id)
  const olderLogs = logs.filter((l) => !l.date.startsWith(year)).length
  // on ne descend pas sous le nombre de critiques écrites cette année : elles ne sont pas supprimées
  const reviewed = logs.filter((l) => l.date.startsWith(year) && l.review).length
  return (
    <>
      <CountPill
        value={views.total}
        min={Math.max(1, views.thisYear + olderLogs)}
        label={`Nombre total de visionnages de ${entry.item.title}`}
        suffix="au total"
        onChange={(n) => setTotalViews(entry, year, n)}
      />
      <CountPill
        value={views.thisYear}
        min={reviewed}
        label={`Visionnages de ${entry.item.title} en ${year}`}
        suffix={`en ${year}`}
        onChange={(n) => setYearViews(entry, year, n)}
      />
    </>
  )
}

// Tris de la liste des films (page des heures)
const byTitle = (a, b) => a.entry.item.title.localeCompare(b.entry.item.title, 'fr')
const SORTS = {
  heures: { label: 'Temps total', title: "Les films qui t'ont pris le plus de temps", compare: (a, b) => b.minutes - a.minutes || byTitle(a, b) },
  recent: { label: 'Vus récemment', title: 'Derniers films vus', compare: (a, b) => b.lastSeen.localeCompare(a.lastSeen) || byTitle(a, b) },
  fois: { label: 'Nombre de visionnages', title: 'Les films les plus revus', compare: (a, b) => b.views.total - a.views.total || b.minutes - a.minutes },
  annee: { label: `Visionnages en ${new Date().getFullYear()}`, title: `Les plus vus en ${new Date().getFullYear()}`, compare: (a, b) => b.views.thisYear - a.views.thisYear || b.lastSeen.localeCompare(a.lastSeen) },
  duree: { label: 'Durée du film', title: 'Les films les plus longs', compare: (a, b) => b.entry.item.runtime - a.entry.item.runtime || byTitle(a, b) },
  note: { label: 'Ta note', title: 'Tes films les mieux notés', compare: (a, b) => (b.entry.rating || 0) - (a.entry.rating || 0) || b.minutes - a.minutes },
  titre: { label: 'Titre (A → Z)', title: 'Tous tes films', compare: byTitle },
}

const formatHours = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`)

// Récapitulatif d'une catégorie du profil (séries, jeux, musique, films) ou des heures de films
export default function Recap() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { entries, diary } = useStore()
  const year = String(new Date().getFullYear())
  useFilmRuntimes()
  const [sort, setSortState] = useState(() => {
    try {
      return SORTS[localStorage.getItem('popup:tri-heures')] ? localStorage.getItem('popup:tri-heures') : 'heures'
    } catch {
      return 'heures'
    }
  })
  const setSort = (v) => {
    setSortState(v)
    try {
      localStorage.setItem('popup:tri-heures', v)
    } catch {
      // stockage indisponible : le tri n'est pas mémorisé
    }
  }

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
      .map((d) => {
        const logs = diary.filter((l) => l.itemId === d.entry.item.id)
        // date du dernier visionnage connu (journal), sinon le moment où le film a été coché
        const lastSeen = logs.length ? logs.map((l) => l.date).sort().at(-1) : new Date(d.entry.updatedAt).toISOString().slice(0, 10)
        return { ...d, minutes: d.views.total * d.entry.item.runtime, lastSeen }
      })
      .sort(SORTS[sort].compare)
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
          <div className="section-head recap-sort-head">
            <h2>{SORTS[sort].title}</h2>
            <label className="pill-select">
              <span className="sr-only">Trier les films</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </label>
          </div>
          {films.length === 0 && <p className="muted">Marque un film comme vu pour commencer le compteur.</p>}
          <div className="diary">
            {films.map(({ entry, views, minutes }) => (
              <div key={entry.item.id} className="recap-row">
                <Link to={itemPath(entry.item)}><Cover item={entry.item} size="sm" /></Link>
                <Link to={itemPath(entry.item)} className="recap-row-link">
                  <strong>{entry.item.title}</strong>
                  <span className="muted small">{formatHours(entry.item.runtime)} par visionnage</span>
                </Link>
                <span className="recap-row-value">{formatHours(minutes)}</span>
                {/* date et compteurs sur toute la largeur, sous le titre */}
                <div className="recap-row-tools">
                  <WatchDate entry={entry} diary={diary} />
                  <ViewCounts entry={entry} diary={diary} views={views} year={year} />
                </div>
              </div>
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
