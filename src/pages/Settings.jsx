import { useRef, useState } from 'react'
import { useStore, setSetting, exportData, importData, resetData } from '../store.js'

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

      <section className="card-box">
        <h2>Profil</h2>
        {field('name', 'Pseudo')}
        {field('bio', 'Bio')}
      </section>

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

      <section className="card-box">
        <h2>Sauvegarde</h2>
        <p className="muted small">Tes données sont stockées dans ce navigateur. Exporte-les régulièrement pour ne rien perdre ou les transférer sur un autre appareil.</p>
        <div className="row">
          <button onClick={download}>⬇ Exporter</button>
          <button onClick={() => fileRef.current.click()}>⬆ Importer</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={upload} />
          <button className="danger" onClick={() => confirm('Effacer tout ton journal et tes notes ?') && resetData()}>Tout effacer</button>
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>
    </div>
  )
}
