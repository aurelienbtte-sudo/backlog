// The Movie Database : films + séries — https://developer.themoviedb.org
import { fetchJSON, getKey } from './keys.js'

const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p/'
const KIND = { film: 'movie', serie: 'tv' }

function call(path, params = {}) {
  const key = getKey('tmdb')
  const url = new URL(BASE + path)
  url.searchParams.set('language', 'fr-FR')
  // une valeur vide retire le paramètre (ex. language: '' pour avoir les vidéos dans toutes les langues)
  Object.entries(params).forEach(([k, v]) => (v === '' ? url.searchParams.delete(k) : url.searchParams.set(k, v)))
  // Clé v3 courte -> paramètre d'URL ; "Read Access Token" (long) -> en-tête Authorization
  if (key.length > 40) return fetchJSON(url, { headers: { Authorization: `Bearer ${key}` } })
  url.searchParams.set('api_key', key)
  return fetchJSON(url)
}

function normalize(type, r) {
  const date = r.release_date || r.first_air_date || ''
  return {
    id: `${type}:${r.id}`,
    type,
    sourceId: String(r.id),
    title: r.title || r.name,
    year: date.slice(0, 4),
    cover: r.poster_path ? `${IMG}w342${r.poster_path}` : null,
    subtitle: '',
    overview: r.overview,
  }
}

const formatRuntime = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`)
// TMDB donne les pays en anglais : on traduit à partir du code pays (US → États-Unis)
const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['fr'], { type: 'region' }) : null
const countryName = (c) => {
  try {
    return regionNames?.of(c.iso_3166_1) || c.name
  } catch {
    return c.name
  }
}
const countries = (r) => (r.production_countries || []).slice(0, 2).map(countryName).join(', ')

export async function search(type, query) {
  const data = await call(`/search/${KIND[type]}`, { query })
  return data.results.map((r) => normalize(type, r))
}

export async function trending(type) {
  const data = await call(`/trending/${KIND[type]}/week`)
  return data.results.map((r) => normalize(type, r))
}

export async function details(type, id) {
  const r = await call(`/${KIND[type]}/${id}`, { append_to_response: 'credits,videos' })
  // les vidéos sont demandées à part, dans plusieurs langues, pour pouvoir choisir la VO ou la VF
  try {
    // sans précision, TMDB ne renvoie que les vidéos en anglais : on demande la VO, le français et l'anglais
    r.videos = await call(`/${KIND[type]}/${id}/videos`, { language: '', include_video_language: [r.original_language, 'fr', 'en', 'null'].filter(Boolean).join(',') })
  } catch {
    // on garde celles déjà reçues
  }
  const item = normalize(type, r)
  const crew = r.credits?.crew || []
  const directors = crew.filter((c) => c.job === 'Director').map((c) => c.name)
  const creators = (r.created_by || []).map((c) => c.name)
  item.subtitle = (type === 'film' ? directors : creators).join(', ')
  item.genres = (r.genres || []).map((g) => g.name)
  item.backdrop = r.backdrop_path ? `${IMG}w1280${r.backdrop_path}` : null
  if (type === 'film') item.runtime = r.runtime || 0
  item.posterLarge = r.poster_path ? `${IMG}w780${r.poster_path}` : null
  item.released = r.release_date || r.first_air_date || ''
  // Bande-annonce YouTube, en français si possible
  // Bande-annonce en VO : langue d'origine du film d'abord, puis l'anglais, puis toute autre langue, le français en dernier
  const videos = (r.videos?.results || []).filter((v) => v.site === 'YouTube' && ['Trailer', 'Teaser'].includes(v.type))
  const vo = r.original_language
  const rank = (v) =>
    (v.iso_639_1 === vo ? 0 : v.iso_639_1 === 'en' ? 1 : v.iso_639_1 && v.iso_639_1 !== 'fr' ? 2 : v.iso_639_1 === 'fr' ? 4 : 3) * 10 +
    (v.type === 'Trailer' ? 0 : 1) * 5 +
    (v.official ? 0 : 1)
  const sorted = [...videos].sort((a, b) => rank(a) - rank(b))
  const trailer = sorted[0]
  if (trailer) {
    item.trailer = `https://www.youtube.com/watch?v=${trailer.key}`
    item.trailerKey = trailer.key
    // versions proposées par le bouton VO / VF du lecteur (seulement si elles diffèrent)
    // pour un film français, la VO est la version française : pas de bouton
    const voVideo = vo === 'fr' ? sorted.find((v) => v.iso_639_1 === 'fr') : sorted.find((v) => v.iso_639_1 !== 'fr')
    const vfVideo = sorted.find((v) => v.iso_639_1 === 'fr')
    if (voVideo && vfVideo && voVideo.key !== vfVideo.key) item.trailerKeys = { vo: voVideo.key, vf: vfVideo.key }
  }
  item.cast = (r.credits?.cast || []).slice(0, 10).map((c) => c.name)
  item.facts =
    type === 'film'
      ? [r.runtime && formatRuntime(r.runtime), countries(r), r.original_title !== r.title && r.original_title]
      : [r.number_of_seasons && `${r.number_of_seasons} saison${r.number_of_seasons > 1 ? 's' : ''}`, r.number_of_episodes && `${r.number_of_episodes} épisodes`, countries(r), r.networks?.[0]?.name]
  item.facts = item.facts.filter(Boolean)
  return item
}
