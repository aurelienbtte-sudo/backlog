import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, sortedDiary } from '../store.js'
import DiaryRow from '../components/DiaryRow.jsx'
import { SYNC_ENABLED, useSync } from '../sync.js'
import { Grid } from '../components/MediaCard.jsx'
import TypeTabs from '../components/TypeTabs.jsx'
import { TYPES, TYPE_KEYS, ARTIFACT } from '../types.js'

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
  const recent = sortedDiary(diary).slice(0, 3)
  const wishlist = all.filter((e) => e.wishlist && !e.done).length
  // Rappel : sauvegarder si on a des données et aucune sauvegarde depuis 30 jours
  const needsBackup =
    !ARTIFACT && !SYNC_ENABLED && diary.length >= 3 && Date.now() - (settings.lastBackupAt || 0) > 30 * 24 * 3600 * 1000

  return (
    <>
      <div className="profile-head">
        <div className="avatar">{(settings.name || '?')[0].toUpperCase()}</div>
        <div>
          <h1>{settings.name || 'Mon profil'}</h1>
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

      <div className="stats">
        {TYPE_KEYS.map((t) => (
          <div key={t} className="stat" style={{ '--accent': TYPES[t].color }}>
            <strong>{all.filter((e) => e.done && e.item.type === t).length}</strong>
            <span>{TYPES[t].icon} {TYPES[t].label}</span>
            <small className="muted">{diary.filter((l) => l.item.type === t && l.date.startsWith(year)).length} en {year}</small>
          </div>
        ))}
      </div>

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

      <section>
        <h2>Coups de cœur ♥</h2>
        <Grid items={favorites} empty="Aucun coup de cœur pour l'instant." />
      </section>
    </>
  )
}
