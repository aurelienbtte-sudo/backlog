import { Link } from 'react-router-dom'
import { useStore, sortedDiary } from '../store.js'
import DiaryRow from '../components/DiaryRow.jsx'
import { ARTIFACT } from '../types.js'
import { SYNC_ENABLED, useSync } from '../sync.js'

// Onglet « Accueil » : ton espace perso (activité, journal, liste, statistiques)
export default function Home() {
  const diary = useStore((s) => s.diary)
  const entries = useStore((s) => s.entries)
  const name = useStore((s) => s.settings.name)
  const lastBackupAt = useStore((s) => s.settings.lastBackupAt || 0)
  const { ready, user } = useSync()

  const recent = sortedDiary(diary).slice(0, 5)
  // Rappel : sauvegarder si on a des données et aucune sauvegarde depuis 30 jours
  const needsBackup = !ARTIFACT && !SYNC_ENABLED && diary.length >= 3 && Date.now() - lastBackupAt > 30 * 24 * 3600 * 1000
  const all = Object.values(entries)
  const wishlist = all.filter((e) => e.wishlist && !e.done).length
  const done = all.filter((e) => e.done).length

  return (
    <>
      <h1 className="page-title">{name ? `Salut ${name}` : 'Accueil'}</h1>

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

      <div className="shortcuts">
        <Link to="/journal" className="shortcut" style={{ '--accent': 'var(--film)' }}>
          <strong>{diary.length}</strong>
          <span>Journal</span>
        </Link>
        <Link to="/a-decouvrir" className="shortcut" style={{ '--accent': 'var(--jeu)' }}>
          <strong>{wishlist}</strong>
          <span>À découvrir</span>
        </Link>
        <Link to="/profil" className="shortcut" style={{ '--accent': 'var(--album)' }}>
          <strong>{done}</strong>
          <span>Profil et stats</span>
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
          <p className="muted">
            Rien pour l'instant. Choisis un onglet en bas (Jeux, Cinéma ou Musique), ouvre une œuvre et ajoute-la à ton journal.
          </p>
        )}
      </section>
    </>
  )
}
