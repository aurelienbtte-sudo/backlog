import { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import TabBar from './components/TabBar.jsx'
import SearchBar from './components/SearchBar.jsx'
import Browse from './pages/Browse.jsx'
import Search from './pages/Search.jsx'
import Item from './pages/Item.jsx'
import Diary from './pages/Diary.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Recap from './pages/Recap.jsx'
import Top3 from './pages/Top3.jsx'
import Artist from './pages/Artist.jsx'
import NewPassword from './pages/NewPassword.jsx'
import { MentionsLegales, Confidentialite } from './pages/Legal.jsx'
import { ARTIFACT } from './types.js'

export default function App() {
  const { pathname } = useLocation()
  // Chaque changement de page repart du haut de l'écran
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      {/* Bande derrière l'heure et la batterie, pour que le contenu qui défile reste lisible.
          Absente sur la fiche d'une œuvre, où l'image passe sous l'heure. */}
      {!/^\/(film|serie|jeu|album)\//.test(pathname) && <div className="status-band" aria-hidden="true" />}
      <main className="container">
        <Routes>
          <Route path="/" element={<Profile />} />
          <Route path="/jeux" element={<Browse key="jeux" title="Jeux" types={['jeu']} />} />
          <Route path="/cinema" element={<Browse key="cinema" title="Cinéma" types={['film', 'serie']} />} />
          <Route path="/musique" element={<Browse key="musique" title="Musique" types={['album']} />} />
          <Route path="/recherche" element={<Search />} />
          <Route path="/journal" element={<Diary />} />
          <Route path="/a-decouvrir" element={<Watchlist />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/bilan/:type" element={<Recap />} />
          <Route path="/nouveau-mot-de-passe" element={<NewPassword />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/artiste/:id" element={<Artist />} />
          <Route path="/top3" element={<Top3 />} />
          <Route path="/reglages" element={<Settings />} />
          <Route path="/:type/:sourceId" element={<Item />} />
          <Route path="*" element={<p>Page introuvable.</p>} />
        </Routes>
      </main>
      <footer className="footer">
        {ARTIFACT ? (
          "Version d'essai avec un catalogue de démonstration. Tes notes restent dans ce navigateur."
        ) : (
          <>
            <p>
              Données :{' '}
              <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a> ·{' '}
              <a href="https://rawg.io" target="_blank" rel="noreferrer">RAWG</a> ·{' '}
              <a href="https://musicbrainz.org" target="_blank" rel="noreferrer">MusicBrainz</a> ·{' '}
              <a href="https://www.deezer.com" target="_blank" rel="noreferrer">Deezer</a> · YouTube
            </p>
            <p>Ce produit utilise l'API TMDB sans être approuvé ni certifié par TMDB. Données de jeux fournies par RAWG.</p>
            <p>
              <Link to="/mentions-legales">Mentions légales</Link> · <Link to="/confidentialite">Confidentialité</Link>
            </p>
          </>
        )}
      </footer>
      <SearchBar />
      <TabBar />
    </>
  )
}
