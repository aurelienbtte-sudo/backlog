// Actualité musicale (gratuit, sans clé) : nouveautés et albums les plus écoutés, via Deezer.
// Deezer n'autorise pas les appels directs depuis un site : on passe par un script (JSONP).
import { jsonp } from './applemusic.js'
import * as mb from './musicbrainz.js'

const BASE = 'https://api.deezer.com'
const call = async (path) => {
  const data = await jsonp(`${BASE}${path}${path.includes('?') ? '&' : '?'}output=jsonp`, 8000, 'Deezer')
  if (data?.error) throw new Error(data.error.message || 'Erreur Deezer')
  return data
}

const normalize = (a) => ({
  id: `album:dz-${a.id}`,
  type: 'album',
  sourceId: `dz-${a.id}`,
  title: a.title,
  year: (a.release_date || '').slice(0, 4),
  cover: a.cover_xl || a.cover_big || a.cover_medium || null,
  subtitle: a.artist?.name || '',
})

// Les dernières sorties mises en avant par Deezer
export async function newReleases() {
  const data = await call('/editorial/0/releases?limit=24')
  return (data.data || []).map(normalize)
}

// Les albums les plus écoutés en ce moment
export async function topAlbums() {
  const data = await call('/chart/0/albums?limit=24')
  return (data.data || []).map(normalize)
}

// Fiche d'un album venu de Deezer : on le retrouve dans MusicBrainz pour qu'il ait la même fiche
// (et la même place dans ta collection) que si tu l'avais cherché ; sinon, fiche à partir de Deezer
export async function details(dzId) {
  const a = await call(`/album/${dzId}`)
  try {
    const mbid = await mb.findAlbum(a.title, a.artist?.name || '')
    if (mbid) {
      const item = await mb.details(mbid)
      item.posterLarge = a.cover_xl || item.posterLarge
      if (!item.tracks?.length) item.tracks = tracksOf(a)
      return item
    }
  } catch {
    // MusicBrainz indisponible : on garde la fiche Deezer
  }
  const item = normalize(a)
  item.posterLarge = a.cover_xl || item.cover
  item.released = a.release_date || ''
  item.genres = (a.genres?.data || []).map((g) => g.name)
  item.facts = [a.record_type === 'album' ? 'Album' : a.record_type === 'ep' ? 'EP' : a.record_type, a.label].filter(Boolean)
  item.tracks = tracksOf(a)
  return item
}

const tracksOf = (a) => (a.tracks?.data || []).map((t) => ({ title: t.title, length: (t.duration || 0) * 1000 }))

// --- Artistes et groupes ---

const normalizeArtist = (a) => ({
  id: a.id,
  name: a.name,
  picture: a.picture_xl || a.picture_big || a.picture_medium || null,
  fans: a.nb_fan || 0,
  albumCount: a.nb_album || 0,
})

export async function searchArtists(query) {
  const data = await call(`/search/artist?q=${encodeURIComponent(query)}&limit=8`)
  return (data.data || []).map(normalizeArtist)
}

// Page d'un artiste : infos, morceaux phares, et discographie (albums, puis singles et EP)
export async function artist(id) {
  const [info, albums, top] = await Promise.all([
    call(`/artist/${id}`),
    call(`/artist/${id}/albums?limit=100`),
    call(`/artist/${id}/top?limit=5`).catch(() => ({ data: [] })),
  ])
  const all = (albums.data || [])
    .map((a) => ({ ...normalize({ ...a, artist: { name: info.name } }), recordType: a.record_type }))
    .sort((a, b) => (b.year || '').localeCompare(a.year || ''))
  return {
    ...normalizeArtist(info),
    albums: all.filter((a) => a.recordType === 'album'),
    singles: all.filter((a) => a.recordType !== 'album'),
    top: (top.data || []).map((t) => ({
      title: t.title,
      length: (t.duration || 0) * 1000,
      album: t.album ? normalize({ ...t.album, artist: { name: info.name } }) : null,
    })),
  }
}
