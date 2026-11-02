import { useNavigate } from 'react-router-dom'

// Pages légales. Les passages entre crochets [ ] sont à compléter par l'éditeur du site.
const UPDATED = '2 novembre 2026'

function Page({ title, children }) {
  const navigate = useNavigate()
  return (
    <article className="legal">
      <button className="float-back" onClick={() => navigate(-1)} aria-label="Retour">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="page-title">{title}</h1>
      <p className="muted small">Dernière mise à jour : {UPDATED}</p>
      {children}
    </article>
  )
}

export function MentionsLegales() {
  return (
    <Page title="Mentions légales">
      <h2>Éditeur</h2>
      <p>
        Pop up est un projet personnel et non commercial, édité par un particulier : <strong>[Prénom Nom]</strong>.
        <br />Contact : <strong>[adresse e-mail de contact]</strong>
      </p>
      <p className="muted small">
        Conformément à la loi, un particulier peut ne pas publier son adresse personnelle ; ses coordonnées complètes sont alors
        communiquées à l'hébergeur.
      </p>

      <h2>Hébergement</h2>
      <p>
        <strong>Site</strong> : GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis — github.com
        <br />
        <strong>Comptes et données</strong> : Supabase, Inc., 970 Toa Payoh North #07-04, Singapour 318992 — supabase.com.
        Les données sont stockées dans l'Union européenne.
      </p>

      <h2>Contenus et données</h2>
      <p>
        Les informations sur les films et les séries proviennent de TMDB, celles sur les jeux de RAWG, celles sur la musique de
        MusicBrainz, Cover Art Archive et Deezer, et les bandes-annonces de YouTube. Les affiches, pochettes et marques
        appartiennent à leurs ayants droit. Ce produit utilise l'API TMDB sans être approuvé ni certifié par TMDB.
      </p>
      <p>Les notes et critiques sont écrites par les utilisateurs, qui en sont responsables.</p>
    </Page>
  )
}

export function Confidentialite() {
  return (
    <Page title="Confidentialité">
      <p>
        Pop up est un projet personnel, gratuit et sans publicité. Aucune donnée n'est vendue ni utilisée à des fins publicitaires,
        et le site ne contient aucun outil de suivi : pas de cookies de mesure d'audience.
      </p>

      <h2>Données enregistrées</h2>
      <ul>
        <li><strong>Sans compte</strong> : tes notes, ton journal et tes réglages restent uniquement dans ton navigateur.</li>
        <li>
          <strong>Avec un compte</strong> : ton adresse e-mail, ton mot de passe (chiffré, illisible même pour l'éditeur), ton pseudo,
          ta bio, ta photo de profil, ton top 4, tes notes, ton journal, tes critiques et ta liste « À découvrir ».
        </li>
      </ul>

      <h2>Pourquoi</h2>
      <p>
        Uniquement pour faire fonctionner ton compte : retrouver tes données sur tous tes appareils. La base légale est l'exécution
        du service que tu demandes en créant un compte.
      </p>

      <h2>Où et combien de temps</h2>
      <p>
        Chez Supabase, dans l'Union européenne, tant que ton compte existe. Seul toi peux lire tes données ; l'éditeur peut y
        accéder techniquement pour l'entretien du service, sans les exploiter.
      </p>

      <h2>Services tiers</h2>
      <p>
        Pour afficher les fiches, ton navigateur contacte TMDB, RAWG, MusicBrainz, Cover Art Archive, Deezer, Apple Music et YouTube
        (adresse IP et recherche effectuée), selon leurs propres politiques de confidentialité. Aucune donnée de ton compte ne leur
        est transmise. Les bandes-annonces utilisent le mode « confidentialité renforcée » de YouTube.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux à tout moment consulter et modifier tes données dans l'appli, les exporter (Réglages → Sauvegarde) et supprimer ton
        compte avec toutes tes données (Réglages → Compte → Supprimer mon compte). Pour toute question :{' '}
        <strong>[adresse e-mail de contact]</strong>. Tu peux aussi contacter la CNIL (cnil.fr).
      </p>
    </Page>
  )
}
