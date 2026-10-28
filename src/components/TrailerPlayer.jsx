// Bande-annonce lue directement dans la fiche, sur fond noir
// (YouTube pour les films et séries, fichier vidéo pour les jeux).
// Tout est dans ce composant : facile à retirer si on revient à l'ancienne version.
export default function TrailerPlayer({ item, onClose }) {
  return (
    <div className="trailer">
      <div className="trailer-frame">
        {item.trailerKey ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.trailerKey}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={`Bande-annonce de ${item.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video src={item.trailerVideo} controls autoPlay playsInline />
        )}
      </div>
      <div className="trailer-tools">
        <button className="glass-btn small" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  )
}
