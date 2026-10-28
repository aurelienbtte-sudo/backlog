-- Base de données de Backlog sur Supabase.
-- À coller dans Supabase > SQL Editor > New query, puis cliquer sur "Run".

-- Profil (pseudo, bio)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  bio text not null default '',
  updated_at timestamptz not null default now()
);

-- Une ligne par œuvre : note, coup de cœur, "à découvrir", vu/joué/écouté
create table if not exists public.entries (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id text not null,
  item jsonb not null,
  rating smallint not null default 0,
  liked boolean not null default false,
  wishlist boolean not null default false,
  done boolean not null default false,
  updated_at bigint not null,
  primary key (user_id, item_id)
);

-- Le journal : une ligne par visionnage / partie / écoute
create table if not exists public.logs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id text not null,
  item jsonb not null,
  date date not null,
  rating smallint not null default 0,
  review text not null default '',
  liked boolean not null default false,
  again boolean not null default false,
  created_at bigint not null
);
create index if not exists logs_user_date on public.logs (user_id, date desc);

-- Sécurité : chacun ne peut lire et modifier que ses propres données
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.logs enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "own entries" on public.entries;
create policy "own entries" on public.entries for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own logs" on public.logs;
create policy "own logs" on public.logs for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
