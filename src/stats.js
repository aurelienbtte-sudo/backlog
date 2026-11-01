// Statistiques du profil : nombre d'œuvres par type et heures de films regardées
import { useEffect } from 'react'
import { getState, updateEntry, addLog, removeLog } from './store.js'
import { getItem, isLive } from './api/index.js'

// Pour une œuvre : nombre de fois vue / jouée / écoutée, et combien cette année.
// Un visionnage compte s'il est dans le journal (daté), ou parmi les « visionnages anciens »
// (pastViews : des fois sans date, avant cette année). Une œuvre seulement cochée « vu »
// compte 1 fois, cette année si elle a été cochée cette année.
export function viewsOf(entry, diary, year) {
  const logs = diary.filter((l) => l.itemId === entry.item.id)
  const past = entry.pastViews || 0
  const implicit = entry.done && logs.length === 0 && past === 0 ? 1 : 0
  const implicitThisYear = implicit && new Date(entry.updatedAt).getFullYear() === Number(year) ? 1 : 0
  return {
    total: logs.length + past + implicit,
    thisYear: logs.filter((l) => l.date.startsWith(year)).length + implicitThisYear,
  }
}

const today = () => new Date().toISOString().slice(0, 10)

// Une œuvre seulement cochée « vu » : on rend son visionnage explicite avant de modifier les compteurs
function materialize(entry, diary, year) {
  const logs = diary.filter((l) => l.itemId === entry.item.id)
  if (!entry.done || logs.length || entry.pastViews) return
  if (new Date(entry.updatedAt).getFullYear() === Number(year)) {
    addLog(entry.item, { date: new Date(entry.updatedAt).toISOString().slice(0, 10), rating: entry.rating || 0, review: '', liked: entry.liked || false, again: false })
  } else {
    updateEntry(entry.item, { pastViews: 1 })
  }
}

// Fixe le nombre de visionnages de l'année : ajoute des entrées datées d'aujourd'hui au journal,
// ou retire celles de l'année sans critique (les critiques écrites ne sont jamais supprimées ici)
export function setYearViews(entry, year, target) {
  materialize(entry, getState().diary, year)
  const logs = getState().diary.filter((l) => l.itemId === entry.item.id)
  const inYear = logs.filter((l) => l.date.startsWith(year))
  if (target > inYear.length) {
    const date = Number(year) === new Date().getFullYear() ? today() : `${year}-12-31`
    for (let i = inYear.length; i < target; i++) {
      addLog(entry.item, { date, rating: entry.rating || 0, review: '', liked: entry.liked || false, again: logs.length + i > 0 })
    }
  } else if (target < inYear.length) {
    const removable = inYear.filter((l) => !l.review).sort((a, b) => b.createdAt - a.createdAt)
    removable.slice(0, inYear.length - target).forEach((l) => removeLog(l.id))
    // plus aucun visionnage : l'œuvre reste « vue », mais avant cette année
    const left = getState().diary.filter((l) => l.itemId === entry.item.id).length
    const current = getState().entries[entry.item.id]
    if (!left && !current?.pastViews && current?.done) updateEntry(current.item, { pastViews: 1 })
  }
}

// Fixe le nombre total : les visionnages du journal ne bougent pas, on ajuste les visionnages anciens
export function setTotalViews(entry, year, target) {
  materialize(entry, getState().diary, year)
  const logs = getState().diary.filter((l) => l.itemId === entry.item.id).length
  const current = getState().entries[entry.item.id] || entry
  updateEntry(current.item, { pastViews: Math.max(0, target - logs), done: true })
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
