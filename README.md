<p align="center">
  <br />
  <code>
  ╔╗╔╦ ╦╦  ╦  ╔═╗╔═╗╔═╗╔╦╗
  ║║║║ ║║  ║  ╠═╝║ ║╚═╗ ║
  ╝╚╝╚═╝╩═╝╩═╝╩  ╚═╝╚═╝ ╩
  </code>
  <br /><br />
  <strong>Micro-blogging privé, chiffré, auto-hébergeable.</strong>
  <br />
  Vos pensées. Vos serveurs. Vos règles.
  <br /><br />
  <a href="https://nullpost.maximemansiet.fr">Démo en ligne</a> &middot;
  <a href="#déploiement">Déploiement</a> &middot;
  <a href="#fonctionnalités">Fonctionnalités</a> &middot;
  <a href="#bts-sio-e6--dossier-de-réalisation-professionnelle">BTS SIO E6</a>
  <br /><br />
  <img src="https://img.shields.io/badge/licence-AGPL--3.0-green?style=flat-square" alt="Licence" />
  <img src="https://img.shields.io/badge/next.js-16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/chiffrement-AES--256--GCM-blue?style=flat-square" alt="Chiffrement" />
  <img src="https://img.shields.io/badge/BTS%20SIO-SLAM%20E6-1F2A44?style=flat-square" alt="BTS SIO SLAM E6" />
</p>

---

> **Réalisation professionnelle n° 1 du dossier de l'épreuve E6 du BTS SIO
> option SLAM, session 2026** (EPSI Bordeaux). La documentation technique
> destinée à la commission d'interrogation est dans le dossier
> [`docs/`](docs/).

NullPost est une plateforme de micro-blogging pour les personnes qui veulent
rester maîtres de leurs écrits. Chaque publication est chiffrée côté client
avant même de toucher le serveur, vos données restent les vôtres, y compris
sur une infrastructure hébergée.

Pensé avec une esthétique terminal façon Watch Dogs 2. Pas de pistage, pas
d'algorithme de recommandation, pas d'IA. Juste du texte.

## Sommaire

- [BTS SIO E6, Dossier de réalisation professionnelle](#bts-sio-e6--dossier-de-réalisation-professionnelle)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Déploiement](#déploiement)
- [Développement local](#développement-local)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Modèle de sécurité](#modèle-de-sécurité)
- [Documentation](#documentation)
- [Licence](#licence)

## BTS SIO E6, Dossier de réalisation professionnelle

Documentation technique destinée à la commission d'interrogation de l'épreuve
E6 du BTS SIO option SLAM (session 2026). Tout est versionné dans le dossier
[`docs/`](docs/).

| Document | Contenu |
|---|---|
| [`docs/README.md`](docs/README.md) | Index de la documentation et parcours suggéré pour le jury |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, architecture multi-couches Next.js, flux d'authentification OAuth, flux de chiffrement, schéma de base de données, routes API, sécurité, tests, CI/CD, déploiement |
| [`docs/COMPETENCES.md`](docs/COMPETENCES.md) | Mapping détaillé des trois compétences SLAM (Concevoir+dev / Maintenance / Gérer les données) avec preuves de code |
| [`docs/SECURITE.md`](docs/SECURITE.md) | Modèle de menace, AES-256-GCM, OAuth 2.0, limitation de débit, en-têtes HTTP, RGPD |
| [`docs/TESTS.md`](docs/TESTS.md) | Stratégie de tests (Vitest unitaires + intégration, Playwright bout-en-bout), couverture, pipeline CI/CD |
| [`docs/ACCES_JURY.md`](docs/ACCES_JURY.md) | URL de démo, parcours suggéré, démarrage local et via Docker |
| [`docs/uml/`](docs/uml/) | Diagrammes Mermaid : cas d'utilisation, séquences (auth, post), classes, déploiement, MCD |

**Compétences SLAM couvertes (bloc 2 du référentiel BTS SIO 2026) :**

- ✓ **Concevoir et développer une solution applicative**, architecture App Router (Server Components et Client Components, routes API REST), authentification OAuth 2.0, chiffrement côté client AES-256-GCM, tests Vitest et Playwright, TypeScript strict, ESLint
- ✓ **Assurer la maintenance corrective ou évolutive**, historique git riche (refactorisation de l'authentification, ajout d'un middleware de sécurité, ajout de la page RGPD, ajout de profils publics, corrections Netlify), pipeline CI/CD garantissant la non-régression, migrations Drizzle versionnées, déploiement Docker reproductible
- ✓ **Gérer les données**, modèle relationnel à 6 tables avec contraintes et suppression en cascade, ORM Drizzle avec migrations versionnées, sauvegarde Turso, habilitations par session OAuth et restriction `ALLOWED_GITHUB_USER`

## Fonctionnalités

**Chiffrement**
- Chiffrement AES-256-GCM avec dérivation de clé PBKDF2 (600 000 itérations)
- Réalisé côté client : pour les publications privées (mode par défaut), le serveur ne voit jamais le texte en clair ni la passphrase
- Les publications publiques (opt-in via `isPublic`) stockent volontairement une copie en clair pour permettre la lecture anonyme
- Vecteur d'initialisation (IV) unique par publication, vérificateur de passphrase

**Publication**
- Deux types de publications : notes courtes (*thoughts*) et articles longs (*longform*) en Markdown
- Création, modification, suppression, chiffrement et déchiffrement en temps réel
- Système d'étiquettes (*tags*) avec couleurs et filtrage du fil
- Recherche plein texte sur les publications déchiffrées (entièrement dans le navigateur)
- Téléversement de médias (images, audio, vidéo) avec noms de fichiers chiffrés
- Fil paginé avec « charger plus »

**Paramètres**
- Changement de mot de passe, changement de passphrase (rechiffrement transactionnel)
- Export de toutes les données déchiffrées au format JSON

**Design**
- Esthétique terminal Watch Dogs 2 sur l'ensemble de l'interface
- Pluie de matrice, effets *glitch*, lignes de balayage, art ASCII
- Couple de polices JetBrains Mono + Inter
- Conçu pour le bureau, responsive

**Auto-hébergeable**
- Mono-utilisateur et mono-tenant par conception
- SQLite (local) ou Turso (cloud), même base de code
- Déploiement partout : Netlify, Vercel, Docker, VPS

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Langage | TypeScript (mode strict) |
| Style | Tailwind CSS v4 |
| Base de données | SQLite via libSQL (local ou Turso) |
| ORM | Drizzle |
| Authentification | Auth.js v5 (OAuth GitHub, JWT en cookie httpOnly) |
| Chiffrement | Web Crypto API (AES-256-GCM, PBKDF2) |
| État | Zustand |
| Animations | Framer Motion |
| Tests | Vitest (unitaires + intégration), Playwright (bout-en-bout) |
| CI/CD | GitHub Actions |

## Déploiement

### Netlify + Turso (recommandé)

1. **Créer une base Turso**

   Inscrivez-vous sur [turso.tech](https://turso.tech) (offre gratuite : 500 M lectures, 10 M écritures/mois), créez une base et générez un jeton.

2. **Pousser le schéma**

   ```bash
   DATABASE_URL=libsql://votre-base.turso.io DATABASE_AUTH_TOKEN=votre-jeton npx drizzle-kit push
   ```

3. **Déployer sur Netlify**

   Connectez votre dépôt et configurez les variables d'environnement :

   ```
   DATABASE_URL=libsql://votre-base.turso.io
   DATABASE_AUTH_TOKEN=votre-jeton
   ```

   Netlify détecte automatiquement Next.js et construit avec `@netlify/plugin-nextjs`.

4. **Visitez `/setup`** pour créer votre compte.

### Docker (auto-hébergement)

```bash
git clone https://github.com/AirKyzzZ/nullpost.git
cd nullpost
docker compose up -d
```

Ou en lancement direct :

```bash
docker run -d \
  -p 3000:3000 \
  -v nullpost-data:/app/data \
  -e DATABASE_URL=file:./data/nullpost.db \
  ghcr.io/airkyzzz/nullpost:latest
```

Les données (SQLite + médias téléversés) persistent dans le volume `nullpost-data`. Les migrations sont appliquées automatiquement au démarrage.

### Manuel

```bash
git clone https://github.com/AirKyzzZ/nullpost.git
cd nullpost
npm install
npx drizzle-kit push
npm run build
npm start
```

## Développement local

```bash
npm install
npm run dev -- -p 3002
```

L'application tourne sur `http://localhost:3002`. Au premier accès, rendez-vous sur `/setup` pour créer votre compte.

### Variables d'environnement

| Variable | Obligatoire | Défaut | Description |
|---|---|---|---|
| `DATABASE_URL` | Non | `file:./data/nullpost.db` | Chaîne de connexion libSQL |
| `DATABASE_AUTH_TOKEN` | Pour Turso |, | Jeton d'authentification Turso |
| `AUTH_SECRET` | Oui |, | Secret de signature JWT (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` | Oui |, | Identifiant client de l'application OAuth GitHub |
| `AUTH_GITHUB_SECRET` | Oui |, | Secret client de l'application OAuth GitHub |
| `ALLOWED_GITHUB_USER` | Non |, | Restreindre l'accès à un seul identifiant GitHub |

### Modifications du schéma

```bash
# Modifier src/lib/db/schema.ts puis :
npx drizzle-kit push
```

### Tests

```bash
npm test                 # unitaires + intégration (Vitest)
npm run test:coverage    # rapport de couverture HTML
npm run test:e2e         # bout-en-bout (Playwright, nécessite un build préalable)
```

## Architecture

```
Navigateur                      Serveur                  Base de données
┌─────────────┐               ┌──────────────┐          ┌─────────┐
│ Texte clair │  encrypt()    │ Texte        │  store   │ SQLite  │
│ post/titre  │ ─────────────>│ chiffré      │ ────────>│ /Turso  │
│             │  AES-256-GCM  │ + IV         │          │         │
│ Texte       │  decrypt()    │ Texte        │  fetch   │         │
│ déchiffré   │ <─────────────│ chiffré      │ <────────│         │
└─────────────┘               └──────────────┘          └─────────┘

Pour les publications privées (mode par défaut), le serveur agit comme
un simple relais de stockage : il ne voit jamais le texte en clair,
ni les titres, ni la passphrase. Les clés de chiffrement existent
uniquement dans la mémoire du navigateur.

Les publications publiées explicitement (drapeau `isPublic` activé par
l'utilisateur) stockent en plus une copie en clair (`plainContent`,
`plainTitle`) pour qu'un visiteur anonyme puisse les consulter sans
passphrase. Cet opt-in est volontaire et désactivé par défaut.
```

## Structure du projet

```
src/
├── app/
│   ├── api/posts/          # Endpoints CRUD des publications
│   ├── api/tags/           # Endpoints CRUD des étiquettes
│   ├── api/media/          # Endpoints d'upload, de service et de suppression de médias
│   ├── api/auth/           # Endpoints d'authentification (setup, login, logout, password, passphrase)
│   ├── app/feed/           # Page du fil (liste + filtre des publications)
│   ├── app/post/           # Pages de création, lecture, modification d'une publication
│   ├── app/media/          # Galerie de médias
│   ├── app/tags/           # Gestion des étiquettes
│   ├── app/search/         # Recherche chiffrée côté client
│   ├── app/settings/       # Paramètres (mot de passe, passphrase, export)
│   ├── login/              # Page de connexion
│   └── setup/              # Assistant de configuration au premier lancement
├── components/
│   ├── app/                # Composants applicatifs (éditeur, cartes, barre latérale, en-tête, médias)
│   ├── auth/               # Composants d'authentification (formulaire de connexion, assistant, déverrouillage par passphrase)
│   ├── landing/            # Sections de la page d'accueil
│   └── ui/                 # Primitives (bouton, champ, toast, badge d'étiquette, etc.)
├── lib/
│   ├── auth/               # Hachage des mots de passe, gestion de session
│   ├── crypto/             # Chiffrement AES-256-GCM, dérivation de clé, magasin de clé
│   └── db/                 # Connexion DB, schéma, migrations
├── instrumentation.ts      # Migrations automatiques au démarrage
└── middleware.ts           # Protection des routes, rate limiting, en-têtes de sécurité
```

## Modèle de sécurité

- **Passphrase** → PBKDF2 (600 000 itérations, SHA-256) → **clé cryptographique**
- **Clé cryptographique** + IV aléatoire → AES-256-GCM → **texte chiffré**
- La passphrase ne quitte jamais le navigateur
- Le serveur ne stocke que du texte chiffré, des IV et un blob vérificateur
- Authentification de session via Auth.js v5 (OAuth GitHub, cookies JWT httpOnly)
- La conception mono-utilisateur élimine la surface d'attaque multi-tenant

**Modèle de menace** : protège contre la compromission du serveur et les fuites de base de données. Ne protège pas contre un navigateur compromis ou un enregistreur de frappe sur la machine de l'utilisateur.

L'analyse de sécurité complète est disponible dans [`docs/SECURITE.md`](docs/SECURITE.md).

## Documentation

- **Documentation utilisateur et technique** : ce README + commentaires dans le code TypeScript typé
- **Documentation BTS SIO E6 (jury)** : dossier [`docs/`](docs/), voir la [section dédiée](#bts-sio-e6--dossier-de-réalisation-professionnelle) en haut de ce fichier

## Licence

[AGPL-3.0](LICENSE), libre d'utilisation, de modification et d'auto-hébergement. Toute modification du code source doit être partagée sous la même licence.

---

<p align="center">
  Conçu et développé par <a href="https://maximemansiet.fr">Maxime Louis François Mansiet</a>
</p>
