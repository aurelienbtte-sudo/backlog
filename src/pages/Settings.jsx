import { useEffect, useRef, useState } from 'react'
import { useStore, setSetting, exportData, importData, resetData } from '../store.js'
import ConfirmButton from '../components/ConfirmButton.jsx'
import { ARTIFACT } from '../types.js'
import Account from '../components/Account.jsx'
import { SYNC_ENABLED } from '../sync.js'

// Petit diagnostic d'affichage (utile pour vérifier le mode plein écran sur iPhone)
function DisplayInfo() {
  const [info, setInfo] = useState('')
  useEffect(() => {
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden'
    document.body.appendChild(probe)
    const inset = Math.round(probe.getBoundingClientRect().height)
    probe.remove()
    const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
    const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.content
    setInfo(`${standalone ? 'Appli écran d’accueil' : 'Navigateur'} · zone du haut : ${inset} px · barre d’état : ${meta} · écran ${window.innerWidth}×${window.innerHeight}`)
  }, [])
  return <p className="muted small">{info}</p>
}

export default function Settings() {
  const settings = useStore((s) => s.settings)
  const fileRef = useRef()
  const [msg, setMsg] = useState('')

  const field = (key, label, props = {}) => (
    <label>
      {label}
      <input value={settings[key] || ''} onChange={(e) => setSetting(key, e.target.value)} {...props} />
    </label>
  )

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `backlog-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setSetting('lastBackupAt', Date.now())
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportData())
      setSetting('lastBackupAt', Date.now())
      setMsg('Données copiées dans le presse-papiers ✔')
    } catch {
      setMsg('Copie impossible ici. Utilise le bouton Exporter.')
    }
  }

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      importData(await file.text())
      setMsg('Données importées ✔')
    } catch (err) {
      setMsg(`Import impossible : ${err.message}`)
    }
    e.target.value = ''
  }

  return (
    <div className="settings">
      <h1>Réglages</h1>

      {SYNC_ENABLED && <Account />}

      <section className="card-box">
        <h2>Profil</h2>
        {field('name', 'Pseudo')}
        {field('bio', 'Bio')}
      </section>

      {!ARTIFACT && (
      <section className="card-box">
        <h2>Clés API (gratuites)</h2>
        <p className="muted small">
          Sans clé, les films, séries et jeux fonctionnent en mode démo. La musique (MusicBrainz) n'en a pas besoin.
          Les clés sont gardées dans ton navigateur uniquement.
        </p>
        {field('tmdbKey', 'TMDB — films et séries', { placeholder: 'Clé API v3 ou Read Access Token', autoComplete: 'off' })}
        <p className="small"><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">Obtenir une clé TMDB →</a></p>
        {field('rawgKey', 'RAWG — jeux vidéo', { placeholder: 'Clé API RAWG', autoComplete: 'off' })}
        <p className="small"><a href="https://rawg.io/apidocs" target="_blank" rel="noreferrer">Obtenir une clé RAWG →</a></p>
      </section>
      )}

      <section className="card-box">
        <h2>Sauvegarde</h2>
        <p className="muted small">Tes données sont stockées dans ce navigateur. Exporte-les régulièrement pour ne rien perdre ou les transférer sur un autre appareil.</p>
        <div className="row">
          {!ARTIFACT && <button onClick={download}>⬇ Exporter</button>}
          <button onClick={copy}>⧉ Copier</button>
          <button onClick={() => fileRef.current.click()}>⬆ Importer</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={upload} />
          <ConfirmButton className="danger" onConfirm={() => { resetData(); setMsg('Données effacées.') }} confirmLabel="Oui, tout effacer">Tout effacer</ConfirmButton>
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>
      <DisplayInfo />
    </div>
  )
}
