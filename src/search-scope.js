// Portée de la barre de recherche selon l'onglet où l'on se trouve :
// Jeux → jeux, Cinéma → films et séries, Musique → artistes et albums, Accueil → tout
export const SCOPES = {
  jeux: { types: ['jeu'], placeholder: 'Rechercher un jeu…' },
  cinema: { types: ['film', 'serie'], placeholder: 'Rechercher un film, une série…' },
  musique: { types: ['artiste', 'album'], placeholder: 'Rechercher un artiste, un album…' },
  tout: { types: ['film', 'serie', 'jeu', 'artiste', 'album'], placeholder: 'Rechercher un film, une série, un jeu…' },
}

export function scopeOf(pathname, params) {
  if (pathname === '/recherche') return SCOPES[params.get('dans')] ? params.get('dans') : 'tout'
  if (pathname === '/jeux' || pathname.startsWith('/jeu/')) return 'jeux'
  if (pathname === '/cinema' || pathname.startsWith('/film/') || pathname.startsWith('/serie/')) return 'cinema'
  if (pathname === '/musique' || pathname.startsWith('/album/') || pathname.startsWith('/artiste/')) return 'musique'
  return 'tout'
}
