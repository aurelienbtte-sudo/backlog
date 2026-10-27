// Petit catalogue de démonstration, utilisé tant qu'aucune clé API n'est configurée.
const raw = {
  film: [
    ['Le Fabuleux Destin d\'Amélie Poulain', '2001', 'Jean-Pierre Jeunet'],
    ['Parasite', '2019', 'Bong Joon-ho'],
    ['Dune : Deuxième partie', '2024', 'Denis Villeneuve'],
    ['Le Voyage de Chihiro', '2001', 'Hayao Miyazaki'],
    ['Intouchables', '2011', 'Olivier Nakache, Éric Toledano'],
    ['Interstellar', '2014', 'Christopher Nolan'],
    ['La Haine', '1995', 'Mathieu Kassovitz'],
    ['Portrait de la jeune fille en feu', '2019', 'Céline Sciamma'],
  ],
  serie: [
    ['Breaking Bad', '2008', 'Vince Gilligan'],
    ['Le Bureau des légendes', '2015', 'Éric Rochant'],
    ['Arcane', '2021', 'Christian Linke, Alex Yee'],
    ['The Bear', '2022', 'Christopher Storer'],
    ['Dark', '2017', 'Baran bo Odar, Jantje Friese'],
    ['Kaamelott', '2005', 'Alexandre Astier'],
    ['Severance', '2022', 'Dan Erickson'],
    ['Lupin', '2021', 'George Kay'],
  ],
  jeu: [
    ['The Legend of Zelda: Breath of the Wild', '2017', 'Nintendo'],
    ['Hades', '2020', 'Supergiant Games'],
    ['Clair Obscur: Expedition 33', '2025', 'Sandfall Interactive'],
    ['Elden Ring', '2022', 'FromSoftware'],
    ['Outer Wilds', '2019', 'Mobius Digital'],
    ['Celeste', '2018', 'Maddy Makes Games'],
    ['Hollow Knight', '2017', 'Team Cherry'],
    ['Disco Elysium', '2019', 'ZA/UM'],
  ],
  album: [
    ['Random Access Memories', '2013', 'Daft Punk'],
    ['Discovery', '2001', 'Daft Punk'],
    ['OK Computer', '1997', 'Radiohead'],
    ['To Pimp a Butterfly', '2015', 'Kendrick Lamar'],
    ['Civilisation', '2021', 'Orelsan'],
    ['Racine carrée', '2013', 'Stromae'],
    ['Abbey Road', '1969', 'The Beatles'],
    ['Blonde', '2016', 'Frank Ocean'],
  ],
}

export const DEMO = Object.fromEntries(
  Object.entries(raw).map(([type, list]) => [
    type,
    list.map(([title, year, subtitle], i) => ({
      id: `${type}:demo-${i}`,
      type,
      sourceId: `demo-${i}`,
      title,
      year,
      subtitle,
      cover: null,
      overview: 'Élément de démonstration. Ajoute une clé API dans Réglages pour accéder au vrai catalogue.',
      genres: [],
      facts: ['Démo'],
    })),
  ])
)

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const searchDemo = (type, q) =>
  DEMO[type].filter((i) => fold(`${i.title} ${i.subtitle}`).includes(fold(q)))
