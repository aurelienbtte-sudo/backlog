import { useState } from 'react'
import { useStore } from '../store.js'
import { Grid } from '../components/MediaCard.jsx'
import TypeTabs from '../components/TypeTabs.jsx'
import { TYPES, TYPE_KEYS } from '../types.js'

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

  return (
    <>
      <div className="profile-head">
        <div className="avatar">{(settings.name || '?')[0].toUpperCase()}</div>
        <div>
          <h1>{settings.name || 'Mon profil'}</h1>
          {settings.bio && <p className="muted">{settings.bio}</p>}
        </div>
      </div>

      <div className="stats">
        {TYPE_KEYS.map((t) => (
          <div key={t} className="stat" style={{ '--accent': TYPES[t].color }}>
            <strong>{all.filter((e) => e.done && e.item.type === t).length}</strong>
            <span>{TYPES[t].icon} {TYPES[t].label}</span>
            <small className="muted">{diary.filter((l) => l.item.type === t && l.date.startsWith(year)).length} en {year}</small>
          </div>
        ))}
      </div>

      <TypeTabs value={type} onChange={setType} withAll />

      <section className="ratings">
        <div className="section-head">
          <h2>Notes</h2>
          <span className="muted">{rated.length} notés · moyenne {avg ? avg.toFixed(1).replace('.', ',') : '–'} ★</span>
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
