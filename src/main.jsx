import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'
import { ARTIFACT } from './types.js'
import './sync.js'

// Dans un artefact, la navigation reste en mémoire (l'adresse de la page ne peut pas changer)
const Router = ARTIFACT ? MemoryRouter : HashRouter

// Demande au navigateur de ne pas effacer nos données quand il manque de place
navigator.storage?.persist?.().catch(() => {})

// HashRouter : les URL du type /#/film/123 marchent sur n'importe quel hébergeur statique
ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
)
