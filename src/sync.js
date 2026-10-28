// Comptes utilisateurs et sauvegarde en ligne avec Supabase.
// Les données restent aussi dans le navigateur (affichage instantané, utilisable hors connexion) ;
// chaque modification est envoyée au serveur, et à la connexion on récupère ce qu'il y a en ligne.
import { createClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { getState, onChange, replaceData, setSetting } from './store.js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = URL && KEY ? createClient(URL, KEY, { auth: { detectSessionInUrl: false } }) : null
export const SYNC_ENABLED = Boolean(supabase)

// --- État de la connexion, lisible depuis les composants avec useSync() ---

// state : 'idle' (rien à faire), 'syncing', 'ok', 'error'
let status = { ready: !supabase, user: null, state: 'idle', error: null }
const listeners = new Set()

function setStatus(patch) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}

export function useSync() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => status
  )
}

// --- Conversion entre le format de l'appli et les tables Supabase ---

const entryToRow = (userId, e) => ({
  user_id: userId,
  item_id: e.item.id,
  item: e.item,
  rating: e.rating || 0,
  liked: Boolean(e.liked),
  wishlist: Boolean(e.wishlist),
  done: Boolean(e.done),
  updated_at: e.updatedAt || Date.now(),
})

const rowToEntry = (r) => ({
  item: r.item,
  rating: r.rating,
  liked: r.liked,
  wishlist: r.wishlist,
  done: r.done,
  updatedAt: Number(r.updated_at),
})

const logToRow = (userId, l) => ({
  id: l.id,
  user_id: userId,
  item_id: l.itemId,
  item: l.item,
  date: l.date,
  rating: l.rating || 0,
  review: l.review || '',
  liked: Boolean(l.liked),
  again: Boolean(l.again),
  created_at: l.createdAt,
})

const rowToLog = (r) => ({
  id: r.id,
  itemId: r.item_id,
  item: r.item,
  date: r.date,
  rating: r.rating,
  review: r.review,
  liked: r.liked,
  again: r.again,
  createdAt: Number(r.created_at),
})

// --- Accès au serveur ---

function check({ error }) {
  if (error) throw error
}

// Supabase renvoie au plus 1000 lignes par requête : on lit page par page
async function selectAll(table) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

async function upsertMany(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    check(await supabase.from(table).upsert(rows.slice(i, i + 500)))
  }
}

async function pushProfile(userId) {
  const { name = '', bio = '' } = getState().settings
  check(await supabase.from('profiles').upsert({ id: userId, name, bio, updated_at: new Date().toISOString() }))
}

// Les envois passent par une file d'attente : ils arrivent au serveur dans l'ordre des clics
let queue = Promise.resolve()

function enqueue(task) {
  queue = queue.then(async () => {
    setStatus({ state: 'syncing' })
    try {
      await task()
      setStatus({ state: 'ok', error: null })
    } catch (e) {
      setStatus({ state: 'error', error: e.message || String(e) })
    }
  })
  return queue
}

// Récupère les données en ligne. La première fois sur cet appareil, on fusionne avec ce qui
// était déjà noté ici ; ensuite, la version en ligne fait foi.
async function pull() {
  const userId = status.user.id
  const [entryRows, logRows, profileRes] = await Promise.all([
    selectAll('entries'),
    selectAll('logs'),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ])
  check(profileRes)

  const remoteEntries = Object.fromEntries(entryRows.map((r) => [r.item_id, rowToEntry(r)]))
  const remoteDiary = logRows.map(rowToLog)
  const local = getState()

  if (local.settings.syncedUser === userId) {
    replaceData({ entries: remoteEntries, diary: remoteDiary })
  } else {
    // Fusion : pour chaque œuvre, la version modifiée le plus récemment gagne
    const entries = { ...remoteEntries }
    const entriesToPush = []
    for (const [id, e] of Object.entries(local.entries)) {
      if (!entries[id] || (e.updatedAt || 0) > entries[id].updatedAt) {
        entries[id] = e
        entriesToPush.push(e)
      }
    }
    const remoteIds = new Set(remoteDiary.map((l) => l.id))
    const logsToPush = local.diary.filter((l) => !remoteIds.has(l.id))
    replaceData({ entries, diary: [...remoteDiary, ...logsToPush] })
    await upsertMany('entries', entriesToPush.map((e) => entryToRow(userId, e)))
    await upsertMany('logs', logsToPush.map((l) => logToRow(userId, l)))
    setSetting('syncedUser', userId)
  }

  // Profil : celui en ligne s'il existe, sinon on envoie celui de l'appareil
  const profile = profileRes.data
  if (profile && (profile.name || profile.bio)) {
    setSetting('name', profile.name)
    setSetting('bio', profile.bio)
  } else {
    await pushProfile(userId)
  }
}

// --- Envoi de chaque modification ---

let profileTimer
onChange((change) => {
  const userId = status.user?.id
  if (!supabase || !userId) return
  switch (change.type) {
    case 'entry':
      return enqueue(async () => check(await supabase.from('entries').upsert(entryToRow(userId, change.entry))))
    case 'log':
      return enqueue(async () => check(await supabase.from('logs').upsert(logToRow(userId, change.log))))
    case 'removeLog':
      return enqueue(async () => check(await supabase.from('logs').delete().eq('id', change.id)))
    case 'profile':
      // On attend la fin de la frappe avant d'envoyer
      clearTimeout(profileTimer)
      profileTimer = setTimeout(() => enqueue(() => pushProfile(userId)), 800)
      return
    case 'all':
      return enqueue(async () => {
        const { entries, diary } = getState()
        await upsertMany('entries', Object.values(entries).map((e) => entryToRow(userId, e)))
        await upsertMany('logs', diary.map((l) => logToRow(userId, l)))
      })
    case 'reset':
      return enqueue(async () => {
        check(await supabase.from('logs').delete().eq('user_id', userId))
        check(await supabase.from('entries').delete().eq('user_id', userId))
      })
  }
})

// --- Connexion ---

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null
    const changedUser = user?.id !== status.user?.id
    setStatus({ ready: true, user })
    // Supabase déconseille d'appeler le serveur directement dans ce callback : on décale d'un tour
    if (user && changedUser) setTimeout(() => enqueue(pull), 0)
  })
}

const MESSAGES = {
  'Invalid login credentials': 'E-mail ou mot de passe incorrect.',
  'User already registered': 'Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.',
  'Email not confirmed': "Ton e-mail n'est pas encore confirmé. Ouvre le lien reçu par e-mail, puis reconnecte-toi.",
  'Unable to validate email address: invalid format': "Cette adresse e-mail n'est pas valide.",
}

function translate(error) {
  if (MESSAGES[error.message]) return new Error(MESSAGES[error.message])
  if (/at least \d+ characters/.test(error.message)) return new Error('Le mot de passe doit faire au moins 6 caractères.')
  if (/rate limit/i.test(error.message)) return new Error('Trop de tentatives. Réessaie dans quelques minutes.')
  return error
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw translate(error)
  if (!data.session) {
    throw new Error("Compte créé ! Confirme ton adresse avec le lien reçu par e-mail, puis connecte-toi ici.")
  }
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw translate(error)
}

// À la déconnexion, on vide les notes de cet appareil (elles restent en ligne)
export async function signOut() {
  await queue
  await supabase.auth.signOut()
  replaceData({ entries: {}, diary: [] })
  setSetting('syncedUser', null)
  setStatus({ state: 'idle', error: null })
}
