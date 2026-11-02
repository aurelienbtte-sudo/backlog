import { getState } from '../store.js'

// Une clé saisie dans "Réglages" passe avant celle du fichier .env
export function getKey(name) {
  const fromSettings = getState().settings[`${name}Key`]
  const fromEnv = name === 'tmdb' ? import.meta.env.VITE_TMDB_KEY : import.meta.env.VITE_RAWG_KEY
  return (fromSettings || fromEnv || '').trim()
}

// Relais Supabase (supabase/functions/api-proxy) : utilisé quand le site n'a pas de clé à lui,
// pour que les clés TMDB et RAWG ne soient jamais visibles dans le code du site
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const PROXY = SUPABASE_URL && !import.meta.env.VITE_NO_PROXY ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/api-proxy` : null

// Disponible si une clé est connue, ou si le relais peut s'en charger
export const hasAccess = (name) => Boolean(getKey(name) || PROXY)

// Construit l'adresse d'appel : directe avec la clé si on en a une, sinon via le relais
export function apiURL(api, base, path, params) {
  const key = getKey(api)
  const url = key ? new URL(base + path) : new URL(PROXY)
  if (!key) {
    url.searchParams.set('api', api)
    url.searchParams.set('path', path)
  }
  Object.entries(params).forEach(([k, v]) => (v === '' ? url.searchParams.delete(k) : url.searchParams.set(k, v)))
  return { url, key }
}

export async function fetchJSON(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Erreur ${res.status} en contactant ${new URL(url).hostname}`)
  return res.json()
}
