// Toutes les données de l'utilisateur, sauvegardées dans le navigateur (localStorage).
// Plus tard, on pourra remplacer ce fichier par une vraie base de données (ex. Supabase)
// sans toucher au reste de l'appli.
import { useSyncExternalStore } from 'react'

const KEY = 'backlog:v1'
const EMPTY = { entries: {}, diary: [], settings: {} }

let state = load()
const listeners = new Set()

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return EMPTY
  }
}

function set(updater) {
  state = updater(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // stockage plein ou désactivé : on garde les données en mémoire
  }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore(selector = (s) => s) {
  return selector(useSyncExternalStore(subscribe, () => state))
}

export const getState = () => state

// Chaque modification faite par l'utilisateur est signalée ici (utilisé pour la synchro en ligne)
const changeListeners = new Set()
export function onChange(listener) {
  changeListeners.add(listener)
  return () => changeListeners.delete(listener)
}
const emit = (change) => changeListeners.forEach((l) => l(change))

// On ne garde que l'essentiel d'une œuvre pour l'afficher sans rappeler l'API
const slim = ({ id, type, sourceId, title, year, cover, subtitle }) => ({ id, type, sourceId, title, year, cover, subtitle })

// crypto.randomUUID n'existe que sur les pages en HTTPS
const newId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const blankEntry = { rating: 0, liked: false, wishlist: false, done: false }

export function updateEntry(item, patch) {
  set((s) => {
    const prev = s.entries[item.id] || blankEntry
    return {
      ...s,
      entries: { ...s.entries, [item.id]: { ...prev, ...patch, item: slim(item), updatedAt: Date.now() } },
    }
  })
  emit({ type: 'entry', entry: state.entries[item.id] })
}

export function addLog(item, { date, rating, review, liked, again }) {
  const log = { id: newId(), itemId: item.id, item: slim(item), date, rating, review, liked, again, createdAt: Date.now() }
  set((s) => ({ ...s, diary: [log, ...s.diary] }))
  emit({ type: 'log', log })
  const patch = { done: true, wishlist: false, liked: liked || getState().entries[item.id]?.liked || false }
  if (rating) patch.rating = rating
  updateEntry(item, patch)
}

export function removeLog(id) {
  set((s) => ({ ...s, diary: s.diary.filter((l) => l.id !== id) }))
  emit({ type: 'removeLog', id })
}

export function setSetting(key, value) {
  set((s) => ({ ...s, settings: { ...s.settings, [key]: value } }))
  if (key === 'name' || key === 'bio') emit({ type: 'profile' })
}

export function exportData() {
  return JSON.stringify(state, null, 2)
}

export function importData(json) {
  const data = JSON.parse(json)
  if (typeof data !== 'object' || !data.entries || !Array.isArray(data.diary)) throw new Error('Fichier invalide')
  // Les réglages (clés API, compte) de cet appareil sont conservés
  set((s) => ({ ...EMPTY, ...data, settings: { ...data.settings, ...s.settings } }))
  emit({ type: 'all' })
}

export function resetData() {
  set((s) => ({ ...EMPTY, settings: s.settings }))
  emit({ type: 'reset' })
}

// Remplace les notes et le journal sans déclencher de synchro (données venues du serveur)
export function replaceData({ entries, diary }) {
  set((s) => ({ ...s, entries, diary }))
}

// Tri du journal : plus récent d'abord
export const sortedDiary = (diary) =>
  [...diary].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
