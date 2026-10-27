// Les 4 types de médias gérés par l'appli
export const TYPES = {
  film: { label: 'Films', one: 'Film', done: 'Vu', wish: 'À voir', icon: '🎬', color: 'var(--film)' },
  serie: { label: 'Séries', one: 'Série', done: 'Vue', wish: 'À voir', icon: '📺', color: 'var(--serie)' },
  jeu: { label: 'Jeux', one: 'Jeu', done: 'Joué', wish: 'À jouer', icon: '🎮', color: 'var(--jeu)' },
  album: { label: 'Musique', one: 'Album', done: 'Écouté', wish: 'À écouter', icon: '🎵', color: 'var(--album)' },
}

export const TYPE_KEYS = Object.keys(TYPES)

export const todayISO = () => new Date().toISOString().slice(0, 10)
