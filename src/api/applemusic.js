// Lien Apple Music d'un album, via le catalogue public d'Apple (iTunes Search API).
// Cette API n'autorise pas les appels directs depuis un site : on passe par un script (JSONP).
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

function jsonp(url, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const name = `itunes_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    const cleanup = () => {
      delete window[name]
      script.remove()
      clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Apple Music ne répond pas'))
    }, timeout)
    window[name] = (data) => {
      cleanup()
      resolve(data)
    }
    script.src = `${url}&callback=${name}`
    script.onerror = () => {
      cleanup()
      reject(new Error('Apple Music injoignable'))
    }
    document.head.appendChild(script)
  })
}

export const appleMusicSearch = (title, artist) =>
  `https://music.apple.com/fr/search?term=${encodeURIComponent(`${artist} ${title}`)}`

// Renvoie le lien de l'album sur Apple Music, ou null s'il n'est pas trouvé
export async function findAppleMusicAlbum(title, artist) {
  const term = encodeURIComponent(`${artist} ${title}`)
  const data = await jsonp(`https://itunes.apple.com/search?term=${term}&entity=album&country=fr&limit=10`)
  const results = data.results || []
  // Priorité : titre exact, puis réédition (« … Deluxe »), puis n'importe quel album de l'artiste
  const byArtist = results.filter((r) => fold(r.artistName).includes(fold(artist)))
  const match =
    byArtist.find((r) => fold(r.collectionName) === fold(title)) ||
    byArtist.find((r) => fold(r.collectionName).startsWith(fold(title))) ||
    byArtist[0]
  return match ? match.collectionViewUrl.replace(/[?&]uo=\d+/, '') : null
}
