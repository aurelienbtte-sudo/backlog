# Pop up — étapes restantes avant de publier

À faire dans l'ordre (prévu le lundi 2 novembre au matin). Le code est déjà en ligne.

## 1. Autoriser l'adresse du site (Supabase)
Authentication → URL Configuration
- Site URL : `https://aurelienbtte-sudo.github.io/backlog/`
- Redirect URLs → Add URL : `https://aurelienbtte-sudo.github.io/backlog/**`
- Save

## 2. Activer la suppression de compte (Supabase → SQL Editor → Run)
```sql
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
```

## 3. Réactiver la confirmation par e-mail (Supabase)
Authentication → Sign In / Providers → Email → activer « Confirm email » → Save

## 4. Créer le relais des clés API (Supabase → Edge Functions)
1. Deploy a new function → Via Editor
2. Nom : `api-proxy`
3. Coller le code de `supabase/functions/api-proxy/index.ts` → Deploy
4. Désactiver « Verify JWT » dans les réglages de la fonction → Save
5. Edge Functions → Secrets : `TMDB_KEY` (clé TMDB) et `RAWG_KEY` (clé RAWG)

## 5. Retirer les clés du site (GitHub) — seulement après l'étape 4
1. Settings → Secrets and variables → Actions : supprimer `VITE_TMDB_KEY` et `VITE_RAWG_KEY`
2. Actions → dernier déploiement → Re-run all jobs
3. Vérifier que les films et les jeux s'affichent toujours

## À compléter
- Mentions légales et Confidentialité : remplacer [Prénom Nom] et [adresse e-mail de contact] (src/pages/Legal.jsx)
- Plus tard, si l'appli prend : brancher un service d'e-mails (ex. Resend), Supabase gratuit n'envoie que 2 à 4 e-mails par heure
