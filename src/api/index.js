// Point d'entrée unique : les pages appellent ces fonctions sans se soucier de l'API utilisée.
import * as tmdb from './tmdb.js'
import * as rawg from './rawg.js'
import * as mb from './musicbrainz.js'
import { DEMO, searchDemo } from './demo.js'
import { getKey } from './keys.js'
import { ARTIFACT } from '../types.js'

// La musique (MusicBrainz) n'a pas besoin de clé
export function isLive(type) {
  if (ARTIFACT) return false
  if (type === 'album') return true
  return Boolean(getKey(type === 'jeu' ? 'rawg' : 'tmdb'))
}

export function search(type, query) {
  if (!isLive(type)) return Promise.resolve(searchDemo(type, query))
  if (type === 'jeu') return rawg.search(query)
  if (type === 'album') return mb.search(query)
  return tmdb.search(type, query)
}

export function trending(type) {
  // MusicBrainz ne propose pas de "tendances" : on montre la sélection démo
  if (!isLive(type) || type === 'album') return Promise.resolve(DEMO[type])
  if (type === 'jeu') return rawg.trending()
  return tmdb.trending(type)
}

export function getItem(type, sourceId) {
  if (sourceId.startsWith('demo-')) {
    const item = DEMO[type]?.find((i) => i.sourceId === sourceId)
    return item ? Promise.resolve(item) : Promise.reject(new Error('Introuvable'))
  }
  if (type === 'jeu') return rawg.details(sourceId)
  if (type === 'album') return mb.details(sourceId)
  return tmdb.details(type, sourceId)
}
