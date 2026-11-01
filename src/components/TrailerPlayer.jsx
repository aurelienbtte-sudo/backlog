import { useState } from 'react'

// Bande-annonce lue directement dans la fiche, sur fond noir
// (YouTube pour les films et séries, fichier vidéo pour les jeux).
// Un bouton permet de passer de la VO à la VF quand les deux existent ; le choix est mémorisé.
const PREF_KEY = 'popup:langue-bande-annonce'

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) === 'vf' ? 'vf' : 'vo'
  } catch {
    return 'vo'
  }
}

export default function TrailerPlayer({ item, onClose }) {
  const [lang, setLang] = useState(readPref)
  const keys = item.trailerKeys
  const key = keys ? keys[lang] : item.trailerKey

  const toggle = () => {
    const next = lang === 'vo' ? 'vf' : 'vo'
    setLang(next)
    try {
      localStorage.setItem(PREF_KEY, next)
    } catch {
      // stockage indisponible : le choix n'est pas mémorisé
    }
  }

  return (
    <div className="trailer">
      <div className="trailer-frame">
        {key ? (
          <iframe
            key={key}
            src={`https://www.youtube-nocookie.com/embed/${key}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={`Bande-annonce de ${item.title} (${lang.toUpperCase()})`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video src={item.trailerVideo} controls autoPlay playsInline />
        )}
      </div>
      <div className="trailer-tools">
        {keys && (
          <button className="glass-btn small" onClick={toggle} aria-label={lang === 'vo' ? 'Voir la bande-annonce en VF' : 'Voir la bande-annonce en VO'}>
            {lang === 'vo' ? 'Passer en VF' : 'Passer en VO'}
          </button>
        )}
        <button className="glass-btn small" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
