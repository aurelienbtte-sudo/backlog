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
