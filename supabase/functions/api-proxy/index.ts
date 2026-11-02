// Relais vers TMDB et RAWG : les clés API restent sur le serveur (secrets Supabase), invisibles dans le site.
// À créer dans Supabase > Edge Functions sous le nom « api-proxy », avec « Verify JWT » désactivé.
// Secrets à ajouter (Edge Functions > Secrets) : TMDB_KEY et RAWG_KEY.

const APIS: Record<string, string> = {
  tmdb: 'https://api.themoviedb.org/3',
  rawg: 'https://api.rawg.io/api',
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'GET') return json({ error: 'Méthode non autorisée' }, 405)

  const url = new URL(req.url)
  const api = url.searchParams.get('api') ?? ''
  const path = url.searchParams.get('path') ?? ''
  // seulement des chemins simples vers les deux catalogues : le relais ne sert à rien d'autre
  if (!APIS[api] || !/^\/[a-z0-9_\-\/]*$/i.test(path) || path.includes('..')) return json({ error: 'Requête refusée' }, 400)

  const target = new URL(APIS[api] + path)
  url.searchParams.forEach((value, key) => {
    if (key !== 'api' && key !== 'path') target.searchParams.set(key, value)
  })

  const headers: Record<string, string> = {}
  if (api === 'tmdb') {
    const key = Deno.env.get('TMDB_KEY') ?? ''
    if (key.length > 40) headers.Authorization = `Bearer ${key}`
    else target.searchParams.set('api_key', key)
  } else {
    target.searchParams.set('key', Deno.env.get('RAWG_KEY') ?? '')
  }

  const res = await fetch(target, { headers })
  return new Response(res.body, {
    status: res.status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
  })
})
