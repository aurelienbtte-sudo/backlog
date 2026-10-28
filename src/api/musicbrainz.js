// MusicBrainz + Cover Art Archive : albums, gratuit et sans clé — https://musicbrainz.org/doc/MusicBrainz_API
// Limite : ~1 requête par seconde, on reste donc sobre.
import { fetchJSON } from './keys.js'

const BASE = 'https://musicbrainz.org/ws/2'
const cover = (id, size = 250) => `https://coverartarchive.org/release-group/${id}/front-${size}`
const artists = (credit = []) => credit.map((a) => a.name + (a.joinphrase || '')).join('')

function normalize(r) {
  return {
    id: `album:${r.id}`,
    type: 'album',
    sourceId: r.id,
    title: r.title,
    year: (r['first-release-date'] || '').slice(0, 4),
    cover: cover(r.id),
    subtitle: artists(r['artist-credit']),
  }
}

export async function search(query) {
  const q = `${query} AND (primarytype:album OR primarytype:ep)`
  const data = await fetchJSON(`${BASE}/release-group?fmt=json&limit=24&query=${encodeURIComponent(q)}`)
  return data['release-groups'].map(normalize)
}

export async function details(id) {
  const r = await fetchJSON(`${BASE}/release-group/${id}?fmt=json&inc=artist-credits+genres+releases`)
  const item = normalize(r)
  item.cover = cover(id, 500)
  item.posterLarge = cover(id, 1200)
  item.released = r['first-release-date'] || ''
  item.genres = (r.genres || []).sort((a, b) => b.count - a.count).slice(0, 5).map((g) => g.name)
  item.facts = [r['primary-type'], ...(r['secondary-types'] || [])]
  // Liste des morceaux : on prend la première édition officielle de l'album
  const release = (r.releases || []).find((x) => x.status === 'Official') || r.releases?.[0]
  if (release) {
    try {
      const rel = await fetchJSON(`${BASE}/release/${release.id}?fmt=json&inc=recordings`)
      item.tracks = rel.media.flatMap((m) =>
        m.tracks.map((t) => ({ title: t.title, length: t.length }))
      )
    } catch {
      item.tracks = []
    }
  }
  return item
}

// Sélection de l'accueil : on retrouve chaque album démo dans MusicBrainz pour avoir sa vraie jaquette.
// Une seule requête groupée d'abord, puis une par album pour ceux qui manquent
// (MusicBrainz limite à ~1 requête/seconde). Les résultats sont gardés en cache.
const CACHE_KEY = 'backlog:mb-featured-v2'
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const esc = (s) => s.replace(/"/g, '\\"')
const albumQuery = ({ title, subtitle }) => `(releasegroup:"${esc(title)}" AND artist:"${esc(subtitle)}" AND primarytype:album)`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Parmi les résultats, celui qui correspond vraiment (même titre, même artiste), en préférant les albums
function bestMatch(results, { title, subtitle }) {
  const matches = results.filter(
    (r) => fold(r.title) === fold(title) && fold(artists(r['artist-credit'])).includes(fold(subtitle))
  )
  return matches.find((r) => r['primary-type'] === 'Album' && !r['secondary-types']?.length) || matches[0]
}

export async function featured(list, onProgress) {
  let cache = {}
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    // cache illisible : on repart de zéro
  }
  const keyOf = ({ title, subtitle }) => `${title}|${subtitle}`
  const save = () => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch {
      // stockage indisponible : tant pis pour le cache
    }
  }
  const current = () => list.map((x) => cache[keyOf(x)] || x)
  // onProgress renvoie false quand l'utilisateur a changé d'onglet : on arrête
  const notify = () => onProgress?.(current()) !== false

  const missing = list.filter((x) => !cache[keyOf(x)])
  if (missing.length > 1) {
    if (!notify()) return current()
    try {
      const q = missing.map(albumQuery).join(' OR ')
      const data = await fetchJSON(`${BASE}/release-group?fmt=json&limit=100&query=${encodeURIComponent(q)}`)
      for (const x of missing) {
        const hit = bestMatch(data['release-groups'], x)
        if (hit) cache[keyOf(x)] = normalize(hit)
      }
      save()
      if (!notify()) return current()
    } catch {
      // requête groupée refusée : on passe aux requêtes une par une
    }
    await sleep(1100)
  }

  for (const x of list) {
    if (cache[keyOf(x)]) continue
    if (!notify()) return current()
    try {
      const data = await fetchJSON(`${BASE}/release-group?fmt=json&limit=10&query=${encodeURIComponent(albumQuery(x))}`)
      const hit = bestMatch(data['release-groups'], x) || data['release-groups'][0]
      if (hit) {
        cache[keyOf(x)] = normalize(hit)
        save()
      }
    } catch {
      // album introuvable ou réseau en panne : on garde la version démo
    }
    await sleep(1100)
  }
  notify()
  return current()
}
