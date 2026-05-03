# Accès jury, NullPost

> Document à l'attention de la commission d'interrogation E6.

## 1. Démo en ligne

**URL** : <https://nullpost.maximemansiet.fr>

NullPost est **mono-utilisateur par conception** : la plateforme est restreinte à
l'identifiant GitHub `AirKyzzZ` via la variable d'environnement `ALLOWED_GITHUB_USER`.
Le jury ne peut donc pas se connecter directement.

**Mode de démonstration retenu** : présentation orale en partage d'écran avec mon compte.

## 2. Pages publiques accessibles sans connexion

| URL | Contenu | But |
|---|---|---|
| `/` | Landing page | Présentation produit |
| `/login` | Page de connexion GitHub | Vérifier que l'auth OAuth fonctionne |
| `/rgpd` | Conformité RGPD | Cf. exigences réglementaires |
| `/profile/airkyzzz` | Profil public | Si configuré : posts publics |
| `/api/health` | Health check JSON | `{"status": "ok"}` |

## 3. Démonstration en local (alternative)

Si le jury préfère que la commission démarre l'application elle-même :

```bash
git clone https://github.com/AirKyzzZ/nullpost.git
cd nullpost
npm install
cp .env.example .env.local
# Configurer AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, ALLOWED_GITHUB_USER
npx drizzle-kit push
npm run dev -- -p 3002
```

Visiter <http://localhost:3002/setup> pour créer le compte initial avec une passphrase.

## 4. Démonstration via Docker

```bash
git clone https://github.com/AirKyzzZ/nullpost.git
cd nullpost
docker compose up -d
```

Visiter <http://localhost:3000>. Données persistantes dans le volume `nullpost-data`.

## 5. Parcours de démonstration suggéré (15 min)

1. **Page d'accueil** (`/`) : design Watch Dogs, animations Framer Motion, présentation du
   concept de chiffrement client-side.
2. **Login GitHub** (`/login`) : redirection OAuth, retour avec session.
3. **Premier login → setup chiffrement** : saisie de la passphrase, dérivation PBKDF2,
   création du verifier (le jury voit que la passphrase ne quitte jamais le navigateur via
   l'onglet Réseau des DevTools).
4. **Création d'un post** (`/app/post/new`) : montrer dans l'onglet Réseau que la requête
   POST contient uniquement du ciphertext base64 + IV, pas le contenu en clair.
5. **Lecture du post depuis la base** (via `npx drizzle-kit studio` ou requête directe) :
   le contenu en base est chiffré, illisible sans la clé.
6. **Page RGPD** (`/rgpd`) : conformité.
7. **Settings → changement de passphrase** : montrer la re-chiffrement transactionnel de
   tous les posts.
8. **DevTools → onglet Application → Cookies** : montrer le cookie de session httpOnly
   (impossible à lire en JavaScript).
9. **DevTools → Réseau → en-têtes de réponse** : security headers présents
   (`X-Frame-Options`, `X-Content-Type-Options`, etc.).

## 6. Repository GitHub

URL : <https://github.com/AirKyzzZ/nullpost>

Points d'entrée pour la commission :
- [`README.md`](https://github.com/AirKyzzZ/nullpost/blob/main/README.md) : vue produit
- [`docs/`](https://github.com/AirKyzzZ/nullpost/tree/main/docs) : documentation technique
  (ce que vous lisez)
- [`src/lib/crypto/`](https://github.com/AirKyzzZ/nullpost/tree/main/src/lib/crypto) :
  cœur cryptographique
- [`src/lib/db/schema.ts`](https://github.com/AirKyzzZ/nullpost/blob/main/src/lib/db/schema.ts) :
  modèle de données
- [`tests/e2e/`](https://github.com/AirKyzzZ/nullpost/tree/main/tests/e2e) : tests E2E
  Playwright

## 7. Pipeline d'intégration continue

URL : <https://github.com/AirKyzzZ/nullpost/actions>

Permet de vérifier que chaque commit est validé par : ESLint + Vitest + Build Next.js +
Tests E2E Playwright. Les rapports HTML Playwright sont attachés en artefact pour 7 jours.

## 8. Disponibilité avant l'épreuve

Conformément à la circulaire BTS SIO 2026, l'ensemble des ressources techniques (démo en
ligne, repository GitHub, documentation) sont **accessibles avant le mercredi 20 mai 2026**
et le resteront pendant toute la période d'épreuves.
