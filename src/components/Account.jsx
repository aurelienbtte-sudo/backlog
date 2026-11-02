import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSync, signIn, signUp, signOut, sendPasswordReset, deleteAccount, AUTH_LINK } from '../sync.js'
import ConfirmButton from './ConfirmButton.jsx'

const STATE_LABEL = {
  idle: '',
  syncing: 'Synchronisation…',
  ok: 'Tout est sauvegardé en ligne ✔',
}

// Message affiché au retour d'un lien reçu par e-mail
const linkMessage = () => {
  if (!AUTH_LINK) return null
  if (AUTH_LINK.error) return { error: true, text: 'Ce lien a expiré ou a déjà servi. Demande-en un nouveau.' }
  if (AUTH_LINK.type === 'signup') return { text: 'Adresse confirmée ✔ Tu es connecté.' }
  return null
}

export default function Account() {
  const { ready, user, state, error } = useSync()
  const [mode, setMode] = useState('signin') // signin, signup, reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [website, setWebsite] = useState('') // champ piège invisible : seuls les robots le remplissent
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(linkMessage)
  const shownAt = useRef(Date.now())

  if (!ready) return <section className="card-box"><p className="muted">Chargement du compte…</p></section>

  if (user) {
    return (
      <section className="card-box">
        <h2>Compte</h2>
        {message && <p className={`small ${message.error ? 'error' : ''}`}>{message.text}</p>}
        <p>Connecté avec <strong>{user.email}</strong></p>
        <p className={`small ${state === 'error' ? 'error' : 'muted'}`}>
          {state === 'error' ? `Erreur de synchronisation : ${error}` : STATE_LABEL[state]}
        </p>
        <p className="muted small">Tes notes, ton journal et ta liste sont sauvegardés en ligne. Connecte-toi avec le même compte sur ton téléphone ou ton ordinateur pour les retrouver.</p>
        <div className="row">
          <button onClick={() => signOut()}>Se déconnecter</button>
        </div>
        <div className="danger-zone">
          <p className="small muted">
            Supprimer ton compte efface définitivement ton profil, tes notes, ton journal et ta liste, en ligne et sur cet appareil.
          </p>
          <ConfirmButton
            className="danger"
            confirmLabel="Oui, tout supprimer définitivement"
            onConfirm={async () => {
              try {
                await deleteAccount()
                setMessage({ text: 'Ton compte et toutes tes données ont été supprimés.' })
              } catch (err) {
                setMessage({ error: true, text: err.message })
              }
            }}
          >
            Supprimer mon compte
          </ConfirmButton>
        </div>
      </section>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    // anti-robots : champ piège rempli, ou formulaire envoyé en moins de 2 secondes
    if (website || Date.now() - shownAt.current < 2000) {
      setMessage({ error: true, text: 'Petit souci, réessaie dans quelques secondes.' })
      shownAt.current = Date.now()
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'reset') {
        await sendPasswordReset(email.trim())
        setMessage({ text: 'E-mail envoyé ✔ Ouvre le lien qu’il contient pour choisir un nouveau mot de passe.' })
      } else {
        await (mode === 'signup' ? signUp : signIn)(email.trim(), password)
      }
    } catch (err) {
      setMessage({ error: !/Compte créé/.test(err.message), text: err.message })
    }
    setBusy(false)
  }

  const switchTo = (m) => {
    setMode(m)
    setMessage(null)
  }

  return (
    <section className="card-box">
      <h2>{mode === 'signup' ? 'Créer un compte' : mode === 'reset' ? 'Mot de passe oublié' : 'Se connecter'}</h2>
      <p className="muted small">
        {mode === 'reset'
          ? 'Entre ton adresse e-mail : tu recevras un lien pour choisir un nouveau mot de passe.'
          : 'Avec un compte, tes notes sont sauvegardées en ligne et tu les retrouves sur tous tes appareils. Ce que tu as déjà noté sur cet appareil sera ajouté à ton compte.'}
      </p>
      <form className="account-form" onSubmit={submit}>
        <label>
          E-mail
          <input id="account-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== 'reset' && (
          <label>
            Mot de passe
            <input
              id="account-password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 8 : 6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        <label className="trap" aria-hidden="true">
          Site web
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        {mode === 'signup' && (
          <p className="muted small">
            En créant un compte, tu acceptes la <Link to="/confidentialite">politique de confidentialité</Link>. 8 caractères minimum.
          </p>
        )}
        {message && <p className={`small ${message.error ? 'error' : ''}`}>{message.text}</p>}
        <div className="row">
          <button type="submit" className="primary" disabled={busy}>
            {busy ? '…' : mode === 'signup' ? 'Créer mon compte' : mode === 'reset' ? 'Envoyer le lien' : 'Se connecter'}
          </button>
          <button type="button" className="link-btn" onClick={() => switchTo(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? "J'ai déjà un compte" : 'Pas de compte ? En créer un'}
          </button>
        </div>
        {mode === 'signin' && (
          <button type="button" className="link-btn" onClick={() => switchTo('reset')}>
            Mot de passe oublié ?
          </button>
        )}
        {mode === 'reset' && (
          <button type="button" className="link-btn" onClick={() => switchTo('signin')}>
            Retour à la connexion
          </button>
        )}
      </form>
    </section>
  )
}
