// Statistiques du profil : nombre d'œuvres par type et heures de films regardées
import { useEffect } from 'react'
import { getState, updateEntry } from './store.js'
import { getItem, isLive } from './api/index.js'

// Pour une œuvre : nombre de fois vue / jouée / écoutée, et combien cette année
export function viewsOf(entry, diary, year) {
  const logs = diary.filter((l) => l.itemId === entry.item.id)
  const total = Math.max(entry.done ? 1 : 0, logs.length)
  const thisYear = logs.length
    ? logs.filter((l) => l.date.startsWith(year)).length
    : entry.done && new Date(entry.updatedAt).getFullYear() === Number(year) ? 1 : 0
  return { total, thisYear }
}

// Heures de films : chaque film vu compte sa durée, et chaque revisionnage du journal la compte à nouveau
export function filmHours(entries, diary, year) {
  let total = 0
  let thisYear = 0
  for (const e of Object.values(entries)) {
    if (e.item.type !== 'film' || !e.item.runtime) continue
    const views = viewsOf(e, diary, year)
    total += views.total * e.item.runtime
    thisYear += views.thisYear * e.item.runtime
  }
  return { total: Math.round(total / 60), thisYear: Math.round(thisYear / 60) }
}

// Œuvres d'un type découvertes cette année : une entrée du journal datée de l'année,
// ou, sans journal, marquée vue / jouée / écoutée cette année
export function countThisYear(entries, diary, type, year) {
  return Object.values(entries).filter((e) => e.item.type === type && viewsOf(e, diary, year).thisYear > 0).length
}

// Les films ajoutés avant le calcul des heures n'ont pas leur durée : on va la chercher une fois
let backfilling = false
export function useFilmRuntimes() {
  useEffect(() => {
    if (backfilling || !isLive('film')) return
    backfilling = true
    ;(async () => {
      const missing = Object.values(getState().entries).filter(
        (e) => e.item.type === 'film' && e.done && e.item.runtime === undefined && !e.item.sourceId.startsWith('demo-')
      )
      for (const e of missing) {
        try {
          const full = await getItem('film', e.item.sourceId)
          const current = getState().entries[e.item.id]
          if (current) updateEntry({ ...current.item, runtime: full.runtime || 0 }, { updatedAt: current.updatedAt })
        } catch {
          // film introuvable ou réseau en panne : on réessaiera à la prochaine visite
        }
      }
      backfilling = false
    })()
  }, [])
}
