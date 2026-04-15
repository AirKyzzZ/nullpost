# Architecture technique — NullPost

> Documentation orientée développeur pour le dossier BTS SIO SLAM E6.

## Vue d'ensemble

NullPost est une application web de micro-blogging privé et chiffré. L'architecture repose sur un principe fondamental : **le serveur ne voit jamais les données en clair**.

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR (Client)                   │
│                                                         │
│  Passphrase ──→ PBKDF2 (600k itérations) ──→ Clé AES  │
│                                                         │
│  Texte en clair ──→ AES-256-GCM + IV ──→ Texte chiffré │
│  Texte chiffré ──→ AES-256-GCM + IV ──→ Texte en clair │
│                                                         │
│  La clé existe UNIQUEMENT dans la mémoire du navigateur │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (données chiffrées uniquement)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVEUR (Next.js)                     │
│                                                         │
│  API Routes ──→ Validation ──→ Drizzle ORM ──→ SQLite  │
│                                                         │
│  Le serveur stocke :                                    │
│  - Texte chiffré (base64) + IV (base64)                 │
│  - Métadonnées (date, type, tags)                       │
│  - Données GitHub OAuth (id, login, email)              │
│                                                         │
│  Le serveur ne stocke JAMAIS :                          │
│  - La passphrase                                        │
│  - La clé de chiffrement                                │
│  - Le contenu en clair (sauf posts publics)             │
└─────────────────────────────────────────────────────────┘
```

## Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | Next.js 16 (App Router) | Server Components + Client Components, routing intégré, API routes |
| Langage | TypeScript (strict) | Détection d'erreurs à la compilation, autocomplétion IDE |
| Styling | Tailwind CSS v4 | Utilitaire CSS, pas de fichiers CSS séparés à maintenir |
| Base de données | SQLite via libSQL | Fichier unique, pas de serveur DB, compatible Turso (cloud) |
| ORM | Drizzle | Léger, typage natif TypeScript, parfait pour SQLite |
| Auth | Auth.js v5 (GitHub OAuth) | Authentification déléguée, pas de stockage de mots de passe |
| Chiffrement | Web Crypto API (AES-256-GCM) | API native du navigateur, pas de dépendance externe |
| State management | Zustand | Léger, simple, pas de boilerplate (vs Redux) |
| Animations | Framer Motion | Animations déclaratives React |

## Structure du projet

```
src/
├── app/                          # Pages et API routes (Next.js App Router)
│   ├── page.tsx                  # Landing page (Server Component)
│   ├── layout.tsx                # Layout racine (police, métadonnées)
│   ├── login/page.tsx            # Page de connexion GitHub OAuth
│   ├── rgpd/page.tsx             # Page RGPD (conformité européenne)
│   ├── app/                      # Zone protégée (nécessite auth)
│   │   ├── feed/                 # Fil d'actualité des posts
│   │   ├── post/new/             # Création de post
│   │   ├── post/[id]/            # Visualisation/édition d'un post
│   │   ├── settings/             # Paramètres utilisateur
│   │   └── tags/                 # Gestion des tags
│   └── api/                      # Routes API REST
│       ├── auth/                 # Endpoints d'authentification
│       ├── posts/                # CRUD des posts
│       ├── tags/                 # CRUD des tags
│       ├── media/                # Gestion des fichiers uploadés
│       ├── public/               # Endpoints publics (profils, posts publics)
│       └── health/               # Health check
├── components/
│   ├── ui/                       # Composants réutilisables (Button, Input, etc.)
│   ├── landing/                  # Sections de la landing page
│   ├── auth/                     # Composants d'authentification
│   └── app/                      # Composants de l'application
├── lib/
│   ├── auth/                     # Guard d'authentification + gestion de session
│   ├── crypto/                   # Chiffrement AES-256-GCM + dérivation de clé
│   ├── db/                       # Connexion DB, schéma Drizzle, migrations
│   ├── constants.ts              # Configuration de l'application
│   ├── format.ts                 # Fonctions de formatage (dates, tailles)
│   └── utils.ts                  # Utilitaire cn() pour les classes CSS
├── middleware.ts                  # Auth guard, rate limiting, security headers
├── auth.ts                       # Configuration Auth.js (GitHub OAuth)
└── instrumentation.ts            # Auto-migration au démarrage
```

## Flux d'authentification (OAuth 2.0)

```
Utilisateur           NullPost             GitHub
    │                    │                    │
    │  Clic "Login"      │                    │
    ├───────────────────►│                    │
    │                    │  Redirect OAuth    │
    │                    ├───────────────────►│
    │                    │                    │
    │                    │  Page de login     │
    │◄───────────────────┤                    │
    │  Autoriser         │                    │
    ├───────────────────────────────────────►│
    │                    │  Authorization Code│
    │                    │◄───────────────────┤
    │                    │  Exchange → Token  │
    │                    ├───────────────────►│
    │                    │  Profile data      │
    │                    │◄───────────────────┤
    │                    │                    │
    │  JWT cookie set    │                    │
    │◄───────────────────┤                    │
    │                    │                    │
    │  Redirect /app     │                    │
    │◄───────────────────┤                    │
```

**Pourquoi OAuth 2.0 (GitHub) plutôt qu'un mot de passe local ?**
- Pas de stockage de mots de passe sur le serveur NullPost
- Authentification déléguée à un service de confiance
- Pas de risque de fuite de credentials
- L'utilisateur n'a qu'un seul compte à gérer

## Flux de chiffrement

### Premier login (Setup)

```
1. L'utilisateur choisit sa passphrase
2. generateSalt() → sel aléatoire de 32 octets
3. deriveKey(passphrase, sel) → clé AES-256 via PBKDF2
4. createVerifier(clé) → chiffre un texte connu avec la clé
5. Envoi au serveur : { sel, verifier_chiffré, iv_du_verifier }
6. Le serveur stocke ces données (il ne connaît PAS la passphrase)
```

### Login suivants (Déverrouillage)

```
1. L'utilisateur saisit sa passphrase
2. deriveKey(passphrase, sel_stocké) → clé AES-256
3. verifyPassphrase(clé, verifier_stocké, iv_stocké)
   → Tente de déchiffrer le verifier
   → Si le résultat = texte connu → passphrase correcte
   → Sinon → passphrase incorrecte
4. La clé est stockée en mémoire (Zustand) pour la session
```

### Chiffrement d'un post

```
1. L'utilisateur écrit son post (texte en clair)
2. encrypt(clé, texte) → { ciphertext, iv } (AES-256-GCM)
3. Le client envoie au serveur : { encryptedContent: ciphertext, iv }
4. Le serveur stocke tel quel en base de données
```

### Déchiffrement d'un post

```
1. Le client récupère { encryptedContent, iv } depuis l'API
2. decrypt(clé, encryptedContent, iv) → texte en clair
3. Affichage dans le navigateur
```

## Schéma de la base de données

```
┌──────────────────┐     ┌──────────────────┐
│     users         │     │     sessions      │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │◄────┤ userId (FK)       │
│ githubId (unique)│     │ expiresAt         │
│ githubLogin      │     └──────────────────┘
│ githubEmail      │
│ encryptionSalt   │     ┌──────────────────┐
│ encryptionVerif. │     │     posts          │
│ encryptionVerifIv│     ├──────────────────┤
│ createdAt        │◄────┤ userId (FK)       │
│ updatedAt        │     │ encryptedContent  │
└──────────────────┘     │ iv                │
                         │ contentType       │
                         │ isPublic          │
                         │ plainContent      │
                         │ createdAt         │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
              ┌─────┴──────┐ ┌───┴────┐  ┌──────┴──────┐
              │ post_tags   │ │ media  │  │   tags      │
              ├────────────┤ ├────────┤  ├─────────────┤
              │ postId (FK)│ │ postId │  │ id (PK)     │
              │ tagId (FK) │ │ userId │  │ name (unique│
              └────────────┘ │ size   │  │ color       │
                             │ mime   │  └─────────────┘
                             └────────┘
```

**Relations :**
- `users` → `posts` : 1-N (un utilisateur a plusieurs posts)
- `posts` → `post_tags` → `tags` : N-N (relation many-to-many via table de liaison)
- `posts` → `media` : 1-N (un post peut avoir plusieurs médias)
- `users` → `sessions` : 1-N (un utilisateur peut avoir plusieurs sessions)

**Suppression en cascade :**
- Supprimer un utilisateur → supprime ses posts, sessions, médias
- Supprimer un post → supprime ses associations de tags (post_tags)
- Supprimer un post → les médias restent mais deviennent orphelins (postId = null)

## Routes API

### Authentification

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `*` | `/api/auth/[...nextauth]` | — | Handler Auth.js (GitHub OAuth) |
| `GET` | `/api/auth/session` | Oui | Session courante + données chiffrement |
| `POST` | `/api/auth/setup-encryption` | Oui | Initialiser le chiffrement (1er login) |
| `POST` | `/api/auth/change-passphrase` | Oui | Changer la passphrase (re-chiffre tout) |
| `POST` | `/api/auth/logout` | Oui | Déconnexion |

### Posts

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/posts` | Oui | Lister les posts (pagination + filtre par tag) |
| `POST` | `/api/posts` | Oui | Créer un post chiffré |
| `GET` | `/api/posts/[id]` | Oui | Récupérer un post avec ses tags et médias |
| `PATCH` | `/api/posts/[id]` | Oui | Modifier un post |
| `DELETE` | `/api/posts/[id]` | Oui | Supprimer un post |

### Tags

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/tags` | Oui | Lister tous les tags |
| `POST` | `/api/tags` | Oui | Créer un tag |
| `PATCH` | `/api/tags/[id]` | Oui | Modifier un tag |
| `DELETE` | `/api/tags/[id]` | Oui | Supprimer un tag |

### Endpoints publics

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/api/public/[username]/posts` | Non | Posts publics d'un utilisateur |
| `GET` | `/api/public/[username]/posts/[id]` | Non | Un post public |
| `GET` | `/api/health` | Non | Health check |

## Sécurité

### Mesures implémentées

| Mesure | Implémentation | Fichier |
|--------|----------------|---------|
| Chiffrement client-side | AES-256-GCM + PBKDF2 (600k iter.) | `src/lib/crypto/` |
| Auth OAuth 2.0 | Auth.js v5 + GitHub provider | `src/auth.ts` |
| Session JWT | Cookie httpOnly signé | Auth.js (automatique) |
| Rate limiting | 100 req/min par IP | `src/middleware.ts` |
| Security headers | X-Frame-Options, CSP, etc. | `src/middleware.ts` |
| Auth guard | Middleware centralisé | `src/middleware.ts` |
| Restriction d'accès | ALLOWED_GITHUB_USER (mono-utilisateur) | `src/auth.ts` |
| RGPD | Page de conformité | `src/app/rgpd/page.tsx` |

### Modèle de menace

**Protège contre :**
- Compromission du serveur (les données sont chiffrées)
- Fuite de base de données (aucun mot de passe, contenu illisible)
- Attaques CSRF (cookies httpOnly + SameSite)
- Clickjacking (X-Frame-Options: DENY)
- Abus d'API (rate limiting)

**Ne protège PAS contre :**
- Navigateur compromis ou keylogger (la passphrase est saisie dans le navigateur)
- Attaque physique sur l'appareil de l'utilisateur

## Tests

| Type | Outil | Fichiers | Description |
|------|-------|----------|-------------|
| Unitaires | Vitest | `src/lib/crypto/crypto.test.ts` | Chiffrement AES-256-GCM |
| Unitaires | Vitest | `src/lib/format.test.ts` | Formatage dates/tailles |
| Unitaires | Vitest | `src/lib/reserved-usernames.test.ts` | Validation noms d'utilisateur |
| Intégration | Vitest | `src/lib/db/integration.test.ts` | CRUD DB (users, posts, tags, media) |
| E2E | Playwright | `tests/e2e/auth.spec.ts` | Redirections auth, security headers |
| E2E | Playwright | `tests/e2e/landing.spec.ts` | Landing page |
| E2E | Playwright | `tests/e2e/rgpd.spec.ts` | Page RGPD |
| E2E | Playwright | `tests/e2e/api.spec.ts` | Routes API (health, auth guards) |

### Commandes

```bash
npm test                  # Tests unitaires + intégration
npm run test:coverage     # Avec rapport de couverture
npm run test:e2e          # Tests E2E (nécessite build + serveur)
```

## CI/CD

Pipeline GitHub Actions (`ci.yml`) :

```
Push/PR → main
    │
    ▼
┌─── Job 1: CI ────────────┐
│ 1. npm ci                 │
│ 2. ESLint (lint)          │
│ 3. Vitest (tests + cover.)│
│ 4. Next.js build          │
└───────────┬───────────────┘
            │ (si succès)
            ▼
┌─── Job 2: E2E ───────────┐
│ 1. npm ci                 │
│ 2. Playwright install     │
│ 3. Playwright tests       │
│ 4. Upload rapport HTML    │
└───────────────────────────┘
```

## Déploiement

### Vercel (production)

- **URL** : https://nullpost.maximemansiet.fr
- Déploiement automatique sur push vers `main`
- Variables d'environnement configurées dans le dashboard Vercel

### Docker (self-hosted)

```bash
docker compose up -d
# SQLite stocké dans un volume Docker
# Migrations automatiques au démarrage (instrumentation.ts)
```

### Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Non | URL de la DB (défaut: `file:./data/nullpost.db`) |
| `DATABASE_AUTH_TOKEN` | Pour Turso | Token d'authentification Turso |
| `AUTH_SECRET` | Oui | Secret pour signer les JWT Auth.js |
| `AUTH_GITHUB_ID` | Oui | Client ID de l'app GitHub OAuth |
| `AUTH_GITHUB_SECRET` | Oui | Client Secret de l'app GitHub OAuth |
| `ALLOWED_GITHUB_USER` | Non | Restreindre l'accès à un seul utilisateur GitHub |
