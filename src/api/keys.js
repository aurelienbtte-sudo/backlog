import { getState } from '../store.js'

// Une clé saisie dans "Réglages" passe avant celle du fichier .env
export function getKey(name) {
  const fromSettings = getState().settings[`${name}Key`]
  const fromEnv = name === 'tmdb' ? import.meta.env.VITE_TMDB_KEY : import.meta.env.VITE_RAWG_KEY
  return (fromSettings || fromEnv || '').trim()
}

export async function fetchJSON(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Erreur ${res.status} en contactant ${new URL(url).hostname}`)
  return res.json()
}
