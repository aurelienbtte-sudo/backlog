import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import TabBar from './components/TabBar.jsx'
import Browse from './pages/Browse.jsx'
import Search from './pages/Search.jsx'
import Item from './pages/Item.jsx'
import Diary from './pages/Diary.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import { ARTIFACT } from './types.js'

export default function App() {
  const { pathname } = useLocation()
  // Chaque changement de page repart du haut de l'écran
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      {/* Sur la fiche d'une œuvre, l'image prend tout le haut de l'écran : pas d'en-tête */}
      {!/^\/(film|serie|jeu|album)\//.test(pathname) && <Header />}
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
          <Route path="/reglages" element={<Settings />} />
          <Route path="/:type/:sourceId" element={<Item />} />
          <Route path="*" element={<p>Page introuvable.</p>} />
        </Routes>
      </main>
      <footer className="footer">
        {ARTIFACT
          ? 'Version d\'essai avec un catalogue de démonstration. Tes notes restent dans ce navigateur.'
          : 'Données : TMDB · RAWG · MusicBrainz. Ce produit utilise l\'API TMDB sans être approuvé ni certifié par TMDB.'}
      </footer>
      <TabBar />
    </>
  )
}
