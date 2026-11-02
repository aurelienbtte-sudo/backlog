import { useState } from 'react'
import { Link } from 'react-router-dom'
import { setNewPassword, useSync, AUTH_LINK } from '../sync.js'

// Page ouverte par le lien « mot de passe oublié » reçu par e-mail
export default function NewPassword() {
  const { ready, user } = useSync()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await setNewPassword(password)
      setDone(true)
    } catch (err) {
      setMessage(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="settings">
      <h1 className="page-title">Nouveau mot de passe</h1>
      <section className="card-box">
        {done ? (
          <>
            <p>Ton mot de passe est changé ✔</p>
            <p className="muted small">Si tu utilises Pop up depuis ton écran d'accueil, ouvre l'appli et connecte-toi avec ce nouveau mot de passe.</p>
            <Link to="/">Aller à l'accueil →</Link>
          </>
        ) : !ready || (!user && AUTH_LINK?.access_token && !AUTH_LINK.checked) ? (
          <p className="muted">Vérification du lien…</p>
        ) : !user ? (
          <p className="error">Ce lien a expiré ou a déjà servi. Redemande un lien depuis <Link to="/reglages">les Réglages</Link>.</p>
        ) : (
          <form className="account-form" onSubmit={submit}>
            <p className="muted small">Compte : {user.email}</p>
            <label>
              Nouveau mot de passe (8 caractères minimum)
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {message && <p className="small error">{message}</p>}
            <button type="submit" className="primary" disabled={busy}>{busy ? '…' : 'Enregistrer'}</button>
          </form>
        )}
      </section>
    </div>
  )
}
