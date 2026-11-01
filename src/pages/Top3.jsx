import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, setSetting } from '../store.js'
import Cover from '../components/Cover.jsx'
import { TYPES, TYPE_KEYS } from '../types.js'

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const slim = ({ id, type, sourceId, title, year, cover, subtitle }) => ({ id, type, sourceId, title, year, cover, subtitle })

// Choix du top 4 affiché sur le profil (rangé dans le réglage « top3 », nom historique), parmi les œuvres vues / notées / aimées
export default function Top3() {
  const navigate = useNavigate()
  const entries = useStore((s) => s.entries)
  const top3 = useStore((s) => s.settings.top3) || []
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')

  const slots = [0, 1, 2, 3].map((i) => top3[i] || null)
  const chosen = new Set(top3.map((i) => i.id))
  const candidates = Object.values(entries)
    .filter((e) => (e.done || e.rating > 0 || e.liked) && !chosen.has(e.item.id))
    .filter((e) => type === 'all' || e.item.type === type)
    .filter((e) => !q.trim() || fold(`${e.item.title} ${e.item.subtitle || ''}`).includes(fold(q.trim())))
    .sort((a, b) => b.rating - a.rating || b.updatedAt - a.updatedAt)
    .map((e) => e.item)

  const add = (item) => {
    if (top3.length >= 4) return
    setSetting('top3', [...top3, slim(item)])
  }
  const remove = (i) => setSetting('top3', top3.filter((_, j) => j !== i))
  const move = (i, d) => {
    const next = [...top3]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setSetting('top3', next)
  }

  return (
    <>
      <button className="recap-back" onClick={() => navigate(-1)} aria-label="Retour">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="page-title">Ton top 4</h1>

      <div className="podium top3-edit-grid">
        {slots.map((item, i) =>
          item ? (
            <div key={item.id} className="top3-slot">
              <Cover item={item} />
              <div className="top3-tools">
                <button disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Monter ${item.title}`}>‹</button>
                <button onClick={() => remove(i)} aria-label={`Retirer ${item.title}`}>✕</button>
                <button disabled={i === top3.length - 1} onClick={() => move(i, 1)} aria-label={`Descendre ${item.title}`}>›</button>
              </div>
            </div>
          ) : (
            <div key={`vide-${i}`} className="top3-slot empty">
              <span>{i + 1}</span>
            </div>
          )
        )}
      </div>

      <p className="muted small">
        {top3.length < 4 ? 'Touche une œuvre ci-dessous pour l\'ajouter.' : 'Ton top 4 est complet. Retire une œuvre pour en mettre une autre.'}
      </p>

      <input className="top3-search" type="search" placeholder="Chercher dans tes œuvres…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tabs">
        {['all', ...TYPE_KEYS].map((t) => (
          <button key={t} className={type === t ? 'active' : ''} onClick={() => setType(t)}>
            {t === 'all' ? 'Tout' : TYPES[t].label}
          </button>
        ))}
      </div>

      {candidates.length === 0 ? (
        <p className="muted">Aucune œuvre ici. Marque des œuvres comme vues ou note-les pour pouvoir les choisir.</p>
      ) : (
        <div className="grid">
          {candidates.map((item) => (
            <button key={item.id} className="card top3-pick" disabled={top3.length >= 4} onClick={() => add(item)}>
              <Cover item={item} />
              <div className="card-meta">
                <strong>{item.title}</strong>
                <span>{item.year}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
