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
// MusicBrainz limite à ~1 requête/seconde : on les fait une par une et on garde le résultat en cache.
const CACHE_KEY = 'backlog:mb-featured'

export async function featured(list, onProgress) {
  let cache = {}
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    // cache illisible : on repart de zéro
  }
  const items = [...list]
  const notify = () => onProgress?.([...items]) !== false

  for (let i = 0; i < list.length; i++) {
    const { title, subtitle } = list[i]
    const key = `${title}|${subtitle}`
    if (!cache[key]) {
      if (!notify()) return items // l'utilisateur a changé d'onglet : on arrête
      try {
        const esc = (s) => s.replace(/"/g, '\\"')
        const q = `releasegroup:"${esc(title)}" AND artist:"${esc(subtitle)}"`
        const data = await fetchJSON(`${BASE}/release-group?fmt=json&limit=1&query=${encodeURIComponent(q)}`)
        const found = data['release-groups'][0]
        if (found) {
          cache[key] = normalize(found)
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
          } catch {
            // stockage indisponible : tant pis pour le cache
          }
        }
      } catch {
        // album introuvable ou réseau en panne : on garde la version démo
      }
      await new Promise((r) => setTimeout(r, 1100))
    }
    if (cache[key]) items[i] = cache[key]
  }
  notify()
  return items
}
