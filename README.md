# Pop up 🎬📺🎮🎵

Un « Letterboxd » pour **les films, les séries, les jeux vidéo et la musique** : note sur 5 étoiles (demi-étoiles comprises), écris des critiques, tiens un journal daté, garde une liste « à découvrir » et consulte tes statistiques.

## Fonctionnalités

- 🔎 Recherche dans 4 catalogues : films et séries (TMDB), jeux (RAWG), albums (MusicBrainz)
- ⭐ Note de ½ à 5 étoiles, ♥ coups de cœur, statut vu / joué / écouté
- 📓 Journal daté avec critiques (et « revu / rejoué »)
- ⏳ Liste « À découvrir »
- 📊 Profil : compteurs par type, moyenne, répartition des notes, coups de cœur
- 💾 Export / import de tes données (fichier JSON)
- 📱 Responsive (mobile, tablette, ordinateur)

Sans clé API, l'appli fonctionne en **mode démo** pour les films/séries/jeux. La musique marche sans clé.

## Lancer le projet sur ton ordinateur

Prérequis : [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173.

## Clés API (gratuites)

| Catalogue | Où l'obtenir |
|---|---|
| Films + séries | https://www.themoviedb.org/settings/api (crée un compte, puis demande une clé « Developer ») |
| Jeux vidéo | https://rawg.io/apidocs |

Deux façons de les utiliser :
1. **Le plus simple** : les coller dans la page ⚙︎ Réglages de l'appli (elles restent dans ton navigateur).
2. Copier `.env.example` en `.env` et les y mettre (elles seront intégrées au site publié).

## Publier gratuitement

### Option A — GitHub Pages (automatique)
1. Crée un dépôt sur GitHub et pousse ce projet sur la branche `main`.
2. Sur GitHub : **Settings → Pages → Source : GitHub Actions**.
3. (Facultatif) **Settings → Secrets and variables → Actions** : ajoute `VITE_TMDB_KEY` et `VITE_RAWG_KEY`.
4. Chaque push publie le site sur `https://<ton-pseudo>.github.io/<nom-du-depot>/`.

### Option B — Netlify ou Vercel
Importe le dépôt GitHub, commande de build `npm run build`, dossier de sortie `dist`. C'est tout.

## Organisation du code

```
src/
  api/          # appels aux catalogues (tmdb.js, rawg.js, musicbrainz.js, demo.js)
  components/   # éléments réutilisables (jaquette, étoiles, carte, onglets…)
  pages/        # Accueil, Recherche, Fiche, Journal, À découvrir, Profil, Réglages
  store.js      # données de l'utilisateur (sauvegardées dans le navigateur)
  types.js      # les 4 types de médias (libellés, couleurs, icônes)
  styles.css    # tout le style
```

## Idées pour la suite

- **Comptes utilisateurs + partie sociale** (suivre des amis, voir leurs critiques, fil d'actualité) : brancher [Supabase](https://supabase.com) (gratuit) à la place de `store.js`.
- Listes personnalisées (« Mes 10 jeux préférés », « Films de Noël »…)
- Suivi des séries épisode par épisode, temps de jeu pour les jeux
- Import depuis Letterboxd (export CSV), Steam, Last.fm
- Application installable sur téléphone (PWA)

## Mentions

Ce produit utilise l'API TMDB sans être approuvé ni certifié par TMDB. Données de jeux fournies par RAWG, données musicales par MusicBrainz et Cover Art Archive.
