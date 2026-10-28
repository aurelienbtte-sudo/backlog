// RAWG : jeux vidéo — https://rawg.io/apidocs
import { fetchJSON, getKey } from './keys.js'

const BASE = 'https://api.rawg.io/api'

function call(path, params = {}) {
  const url = new URL(BASE + path)
  url.searchParams.set('key', getKey('rawg'))
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return fetchJSON(url)
}

function normalize(r) {
  return {
    id: `jeu:${r.id}`,
    type: 'jeu',
    sourceId: String(r.id),
    title: r.name,
    year: (r.released || '').slice(0, 4),
    cover: r.background_image ? r.background_image.replace('/media/games/', '/media/crop/600/400/games/') : null,
    subtitle: (r.platforms || []).map((p) => p.platform.name).slice(0, 3).join(', '),
  }
}

export async function search(query) {
  const data = await call('/games', { search: query, page_size: 24 })
  return data.results.map(normalize)
}

export async function trending() {
  const year = new Date().getFullYear()
  const data = await call('/games', { dates: `${year - 1}-01-01,${year}-12-31`, ordering: '-added', page_size: 24 })
  return data.results.map(normalize)
}

export async function details(id) {
  const r = await call(`/games/${id}`)
  const item = normalize(r)
  item.subtitle = (r.developers || []).map((d) => d.name).join(', ')
  item.overview = r.description_raw
  item.genres = (r.genres || []).map((g) => g.name)
  item.backdrop = r.background_image
  item.posterLarge = r.background_image
  item.released = r.released || ''
  // Bande-annonce : RAWG fournit parfois un vrai fichier vidéo
  try {
    const movies = await call(`/games/${id}/movies`)
    const movie = movies.results?.[0]
    if (movie) item.trailerVideo = movie.data?.max || movie.data?.['480']
  } catch {
    // pas de vidéo pour ce jeu
  }
  item.facts = [
    (r.platforms || []).map((p) => p.platform.name).join(', '),
    r.metacritic && `Metacritic ${r.metacritic}`,
    r.playtime && `~${r.playtime} h de jeu`,
  ].filter(Boolean)
  return item
}
