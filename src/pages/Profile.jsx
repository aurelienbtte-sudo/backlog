import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, sortedDiary } from '../store.js'
import DiaryRow from '../components/DiaryRow.jsx'
import Avatar from '../components/Avatar.jsx'
import SettingsButton from '../components/SettingsButton.jsx'
import { SYNC_ENABLED, useSync } from '../sync.js'
import { Grid } from '../components/MediaCard.jsx'
import TypeTabs from '../components/TypeTabs.jsx'
import { ARTIFACT } from '../types.js'
import { countThisYear, filmHours, useFilmRuntimes } from '../stats.js'

export const Chevron = () => (
  <svg className="chevron" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Onglet « Accueil » : ton profil, tes raccourcis, ton activité et tes statistiques

export default function Profile() {
  const { entries, diary, settings } = useStore()
  const [type, setType] = useState('all')
  const all = Object.values(entries)
  const inType = (e) => type === 'all' || e.item.type === type
  const year = String(new Date().getFullYear())

  const rated = all.filter((e) => e.rating > 0 && inType(e))
  const avg = rated.length ? rated.reduce((s, e) => s + e.rating, 0) / rated.length / 2 : 0
  const histogram = Array.from({ length: 10 }, (_, i) => rated.filter((e) => e.rating === i + 1).length)
  const max = Math.max(1, ...histogram)
  const favorites = all.filter((e) => e.liked && inType(e)).sort((a, b) => b.rating - a.rating).map((e) => e.item)

  const { ready, user } = useSync()
  useFilmRuntimes()
  const doneCount = (t) => all.filter((e) => e.done && e.item.type === t).length
  const yearCount = (t) => countThisYear(entries, diary, t, year)
  const hours = filmHours(entries, diary, year)
  const recent = sortedDiary(diary).slice(0, 3)
  const wishlist = all.filter((e) => e.wishlist && !e.done).length
  // Rappel : sauvegarder si on a des données et aucune sauvegarde depuis 30 jours
  const needsBackup =
    !ARTIFACT && !SYNC_ENABLED && diary.length >= 3 && Date.now() - (settings.lastBackupAt || 0) > 30 * 24 * 3600 * 1000

  return (
    <>
      <div className="profile-head">
        <Avatar editable size={128} />
        <div className="profile-id">
          <div className="profile-name">
            <h1>{settings.name || 'Mon profil'}</h1>
            <SettingsButton />
          </div>
          {settings.bio && <p className="muted">{settings.bio}</p>}
        </div>
      </div>

      {SYNC_ENABLED && ready && !user && (
        <p className="notice">
          <Link to="/reglages">Crée un compte gratuit</Link> pour sauvegarder tes notes en ligne et les retrouver sur tous tes appareils.
        </p>
      )}
      {needsBackup && (
        <p className="notice">
          Tes notes sont enregistrées sur cet appareil uniquement. <Link to="/reglages">Fais une sauvegarde</Link> de temps en temps pour ne rien perdre.
        </p>
      )}

      {/* Compteurs façon cartes en verre (maquette Figma) */}
      <div className="stats">
        {[
          ['serie', 'séries'],
          ['jeu', 'jeux'],
          ['album', 'musique'],
        ].map(([t, label]) => (
          <Link key={t} to={`/bilan/${t}`} className="stat">
            <strong>{doneCount(t)}</strong>
            <span>{label}</span>
            <small>{yearCount(t)} en {year} <Chevron /></small>
          </Link>
        ))}
        <div className="stat stat-wide">
          <Link to="/bilan/film">
            <strong>{doneCount('film')}</strong>
            <span>films</span>
            <small>{yearCount('film')} en {year} <Chevron /></small>
          </Link>
          <div className="stat-divider" />
          <Link to="/bilan/heures">
            <strong>{hours.total} h</strong>
            <span>visionnées</span>
            <small>{hours.thisYear} h en {year} <Chevron /></small>
          </Link>
        </div>
      </div>

      <TypeTabs value={type} onChange={setType} withAll />

      <section className="ratings">
        <div className="section-head">
          <h2>Notes</h2>
          <span className="muted">{rated.length} noté{rated.length > 1 ? "s" : ""} · moyenne {avg ? avg.toFixed(1).replace('.', ',') : '–'} ★</span>
        </div>
        <div className="histogram" aria-label="Répartition des notes">
          {histogram.map((n, i) => (
            <div key={i} className="bar" title={`${(i + 1) / 2} ★ : ${n}`}>
              <div style={{ height: `${(n / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="histogram-axis"><span>½</span><span>★★★★★</span></div>
      </section>

      <div className="shortcuts">
        <Link to="/journal" className="shortcut" style={{ '--accent': 'var(--film)' }}>
          <strong>{diary.length}</strong>
          <span>Journal →</span>
        </Link>
        <Link to="/a-decouvrir" className="shortcut" style={{ '--accent': 'var(--jeu)' }}>
          <strong>{wishlist}</strong>
          <span>À découvrir →</span>
        </Link>
      </div>

      <section>
        <div className="section-head">
          <h2>Activité récente</h2>
          {recent.length > 0 && <Link to="/journal">Tout le journal →</Link>}
        </div>
        {recent.length > 0 ? (
          <div className="diary">{recent.map((l) => <DiaryRow key={l.id} log={l} />)}</div>
        ) : (
          <p className="muted">Rien pour l'instant. Choisis Jeux, Cinéma ou Musique en bas, ouvre une œuvre et ajoute-la à ton journal.</p>
        )}
      </section>

      <section>
        <h2>Coups de cœur ♥</h2>
        <Grid items={favorites} empty="Aucun coup de cœur pour l'instant." />
      </section>
    </>
  )
}
