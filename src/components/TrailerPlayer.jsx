import { useEffect, useRef, useState } from 'react'

// Bande-annonce lue directement dans la fiche (YouTube pour films et séries, fichier vidéo pour les jeux),
// avec un mode plein écran. Tout est dans ce composant : facile à retirer si on revient à l'ancienne version.
export default function TrailerPlayer({ item, onClose }) {
  const boxRef = useRef(null)
  const [full, setFull] = useState(false)

  // Si on quitte le vrai plein écran (touche Échap, geste), on sort aussi de notre mode plein écran
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement) setFull(false)
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggleFull = () => {
    if (full) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      setFull(false)
      return
    }
    // Vrai plein écran quand le navigateur le permet (ordinateur) ; sur iPhone, la vidéo occupe tout l'écran de l'appli
    if (document.fullscreenEnabled && boxRef.current.requestFullscreen) boxRef.current.requestFullscreen().catch(() => {})
    setFull(true)
  }

  const src = item.trailerKey
    ? `https://www.youtube-nocookie.com/embed/${item.trailerKey}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
    : null

  return (
    <div ref={boxRef} className={`trailer ${full ? 'full' : ''}`}>
      <div className="trailer-frame">
        {src ? (
          <iframe
            src={src}
            title={`Bande-annonce de ${item.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video src={item.trailerVideo} controls autoPlay playsInline />
        )}
      </div>
      <div className="trailer-tools">
        <button className="glass-btn small" onClick={toggleFull}>
          {full ? 'Réduire' : 'Plein écran'}
        </button>
        <button className="glass-btn small" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
