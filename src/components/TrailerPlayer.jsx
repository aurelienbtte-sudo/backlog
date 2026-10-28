import { useEffect, useRef } from 'react'

// Bande-annonce lue directement dans la fiche (YouTube pour films et séries, fichier vidéo pour les jeux),
// sur fond noir. Pour les jeux, un halo façon Ambilight suit la vidéo.
// Tout est dans ce composant : facile à retirer si on revient à l'ancienne version.
export default function TrailerPlayer({ item, onClose }) {
  const videoRef = useRef(null)
  const glowRef = useRef(null)

  // Vidéo des jeux : une copie floutée et muette suit la vraie vidéo (vrai Ambilight, en direct)
  useEffect(() => {
    const video = videoRef.current
    const glow = glowRef.current
    if (!video || !glow) return
    const sync = () => {
      if (Math.abs(glow.currentTime - video.currentTime) > 0.25) glow.currentTime = video.currentTime
      if (video.paused) glow.pause()
      else glow.play().catch(() => {})
    }
    const events = ['play', 'pause', 'seeked', 'timeupdate']
    events.forEach((e) => video.addEventListener(e, sync))
    return () => events.forEach((e) => video.removeEventListener(e, sync))
  }, [])

  return (
    <div className="trailer">
      {item.trailerKey ? (
        <div className="trailer-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.trailerKey}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={`Bande-annonce de ${item.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <>
          <div className="trailer-glow" aria-hidden="true">
            <video ref={glowRef} src={item.trailerVideo} muted playsInline autoPlay preload="auto" />
          </div>
          <div className="trailer-frame">
            <video ref={videoRef} src={item.trailerVideo} controls autoPlay playsInline />
          </div>
        </>
      )}
      <div className="trailer-tools">
        <button className="glass-btn small" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
