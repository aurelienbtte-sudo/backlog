import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Item from './pages/Item.jsx'
import Diary from './pages/Diary.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
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
        Données : TMDB · RAWG · MusicBrainz. Ce produit utilise l'API TMDB sans être approuvé ni certifié par TMDB.
      </footer>
    </>
  )
}
