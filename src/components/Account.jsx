import { useState } from 'react'
import { useSync, signIn, signUp, signOut } from '../sync.js'

const STATE_LABEL = {
  idle: '',
  syncing: 'Synchronisation…',
  ok: 'Tout est sauvegardé en ligne ✔',
}

export default function Account() {
  const { ready, user, state, error } = useSync()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  if (!ready) return <section className="card-box"><p className="muted">Chargement du compte…</p></section>

  if (user) {
    return (
      <section className="card-box">
        <h2>Compte</h2>
        <p>Connecté avec <strong>{user.email}</strong></p>
        <p className={`small ${state === 'error' ? 'error' : 'muted'}`}>
          {state === 'error' ? `Erreur de synchronisation : ${error}` : STATE_LABEL[state]}
        </p>
        <p className="muted small">Tes notes, ton journal et ta liste sont sauvegardés en ligne. Connecte-toi avec le même compte sur ton téléphone ou ton ordinateur pour les retrouver.</p>
        <button onClick={() => signOut()}>Se déconnecter</button>
      </section>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await (mode === 'signup' ? signUp : signIn)(email.trim(), password)
    } catch (err) {
      setMessage(err.message)
    }
    setBusy(false)
  }

  return (
    <section className="card-box">
      <h2>{mode === 'signup' ? 'Créer un compte' : 'Se connecter'}</h2>
      <p className="muted small">
        Avec un compte, tes notes sont sauvegardées en ligne et tu les retrouves sur tous tes appareils.
        Ce que tu as déjà noté sur cet appareil sera ajouté à ton compte.
      </p>
      <form className="account-form" onSubmit={submit}>
        <label>
          E-mail
          <input id="account-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Mot de passe
          <input
            id="account-password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message && <p className="small error">{message}</p>}
        <div className="row">
          <button type="submit" className="primary" disabled={busy}>
            {busy ? '…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
          <button type="button" className="link-btn" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(null) }}>
            {mode === 'signup' ? "J'ai déjà un compte" : 'Pas de compte ? En créer un'}
          </button>
        </div>
      </form>
    </section>
  )
}
