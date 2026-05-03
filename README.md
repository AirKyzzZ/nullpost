<p align="center">
  <br />
  <code>
  ╔╗╔╦ ╦╦  ╦  ╔═╗╔═╗╔═╗╔╦╗
  ║║║║ ║║  ║  ╠═╝║ ║╚═╗ ║
  ╝╚╝╚═╝╩═╝╩═╝╩  ╚═╝╚═╝ ╩
  </code>
  <br /><br />
  <strong>Private, encrypted, self-hosted micro-blogging.</strong>
  <br />
  Your thoughts. Your servers. Your rules.
  <br /><br />
  <a href="https://nullpost.maximemansiet.fr">Live Demo</a> &middot;
  <a href="#deploy">Deploy</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#bts-sio-e6--dossier-de-réalisation-professionnelle">BTS SIO E6</a>
  <br /><br />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/next.js-16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/encryption-AES--256--GCM-blue?style=flat-square" alt="Encryption" />
  <img src="https://img.shields.io/badge/BTS%20SIO-SLAM%20E6-1F2A44?style=flat-square" alt="BTS SIO SLAM E6" />
</p>

---

> **Réalisation professionnelle n° 1 du dossier de l'épreuve E6 du BTS SIO
> option SLAM, session 2026** (EPSI Bordeaux). La documentation française
> destinée à la commission d'interrogation est dans le dossier
> [`docs/`](docs/).

NullPost is a micro-blogging platform for people who want to own their words. Every post is encrypted client-side before it touches the server — your data stays yours, even on hosted infrastructure.

Built with a Watch Dogs 2 terminal aesthetic. No tracking. No algorithms. No AI. Just text.

## Table of Contents

- [BTS SIO E6 — Dossier de réalisation professionnelle](#bts-sio-e6--dossier-de-réalisation-professionnelle)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Deploy](#deploy)
- [Development](#development)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Security Model](#security-model)
- [Documentation](#documentation)
- [License](#license)

## BTS SIO E6 — Dossier de réalisation professionnelle

Documentation technique en français destinée à la commission d'interrogation
de l'épreuve E6 du BTS SIO option SLAM (session 2026). Tout est versionné dans
le dossier [`docs/`](docs/).

| Document | Contenu |
|---|---|
| [`docs/README.md`](docs/README.md) | Index de la documentation et parcours suggéré pour le jury |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, architecture multi-couches Next.js, flux d'authentification OAuth, flux de chiffrement, schéma DB, routes API, sécurité, tests, CI/CD, déploiement |
| [`docs/COMPETENCES.md`](docs/COMPETENCES.md) | Mapping détaillé des trois compétences SLAM (Concevoir+dev / Maintenance / Gérer les données) avec preuves de code |
| [`docs/SECURITE.md`](docs/SECURITE.md) | Modèle de menace, AES-256-GCM, OAuth 2.0, rate limiting, headers HTTP, RGPD |
| [`docs/TESTS.md`](docs/TESTS.md) | Stratégie de tests (Vitest unitaires + intégration, Playwright E2E), couverture, pipeline CI/CD |
| [`docs/ACCES_JURY.md`](docs/ACCES_JURY.md) | URL de démo, parcours suggéré, comment tester en local et via Docker |
| [`docs/uml/`](docs/uml/) | Diagrammes Mermaid : cas d'utilisation, séquences (auth, post), classes, déploiement, ERD |

**Compétences SLAM couvertes (bloc 2 du référentiel BTS SIO 2026) :**

- ✓ **Concevoir et développer une solution applicative** — architecture App Router (Server + Client Components, API REST), authentification OAuth 2.0, chiffrement client-side AES-256-GCM, tests Vitest et Playwright, TypeScript strict, ESLint
- ✓ **Assurer la maintenance corrective ou évolutive** — historique git riche (refacto auth, ajout middleware sécurité, RGPD, profils publics, fixes Netlify), pipeline CI/CD garantissant la non-régression, migrations Drizzle versionnées, Docker reproductible
- ✓ **Gérer les données** — modèle relationnel 6 tables avec contraintes et suppression en cascade, ORM Drizzle avec migrations versionnées, sauvegarde Turso, habilitations par session OAuth + `ALLOWED_GITHUB_USER`

## Features

**Encryption**
- AES-256-GCM encryption with PBKDF2 key derivation (600k iterations)
- Client-side only — the server never sees your plaintext or passphrase
- Per-post unique IVs, encryption verifier system

**Blogging**
- Two post types: quick **thoughts** and titled **longform** posts (Markdown)
- Create, edit, delete — all with real-time encrypt/decrypt
- Tag system with color coding and feed filtering
- Full-text search across decrypted posts (runs entirely in-browser)
- Media uploads (images, audio, video) with encrypted filenames
- Paginated feed with "load more"

**Settings**
- Change password, change passphrase (transactional re-encryption)
- Export all decrypted data as JSON

**Design**
- Watch Dogs 2 terminal aesthetic throughout
- Matrix rain, glitch effects, scan lines, ASCII art
- JetBrains Mono + Inter typography pairing
- Desktop-first, responsive

**Self-hostable**
- Single-user, single-tenant by design
- SQLite (local) or Turso (hosted) — same codebase
- Deploy anywhere: Netlify, Vercel, Docker, VPS

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | SQLite via libSQL (local or Turso) |
| ORM | Drizzle |
| Auth | Auth.js v5 (GitHub OAuth, JWT httpOnly cookies) |
| Encryption | Web Crypto API (AES-256-GCM, PBKDF2) |
| State | Zustand |
| Animations | Framer Motion |
| Tests | Vitest (unit + integration), Playwright (E2E) |
| CI/CD | GitHub Actions |

## Deploy

### Netlify + Turso (recommended)

1. **Create a Turso database**

   Sign up at [turso.tech](https://turso.tech) (free tier: 500M reads, 10M writes/month), create a database, and generate a token.

2. **Push the schema**

   ```bash
   DATABASE_URL=libsql://your-db.turso.io DATABASE_AUTH_TOKEN=your-token npx drizzle-kit push
   ```

3. **Deploy to Netlify**

   Connect your repo, then set these environment variables:

   ```
   DATABASE_URL=libsql://your-db.turso.io
   DATABASE_AUTH_TOKEN=your-token
   ```

   Netlify will auto-detect Next.js and build with `@netlify/plugin-nextjs`.

4. **Visit `/setup`** to create your account.

### Docker (self-hosted)

```bash
git clone https://github.com/AirKyzzZ/nullpost.git
cd nullpost
docker compose up -d
```

Or run directly:

```bash
docker run -d \
  -p 3000:3000 \
  -v nullpost-data:/app/data \
  -e DATABASE_URL=file:./data/nullpost.db \
  ghcr.io/airkyzzz/nullpost:latest
```

Data (SQLite + uploaded media) persists in the `nullpost-data` volume. Migrations run automatically on startup.

### Manual

```bash
git clone https://github.com/AirKyzzZ/nullpost.git
cd nullpost
npm install
npx drizzle-kit push
npm run build
npm start
```

## Development

```bash
npm install
npm run dev -- -p 3002
```

The app runs at `http://localhost:3002`. On first visit, go to `/setup` to create your account.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `file:./data/nullpost.db` | libSQL connection string |
| `DATABASE_AUTH_TOKEN` | For Turso | — | Turso authentication token |
| `AUTH_SECRET` | Yes | — | JWT signing secret (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` | Yes | — | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | Yes | — | GitHub OAuth App Client Secret |
| `ALLOWED_GITHUB_USER` | No | — | Restrict access to a single GitHub login |

### Schema Changes

```bash
# Edit src/lib/db/schema.ts, then:
npx drizzle-kit push
```

### Tests

```bash
npm test                 # unit + integration (Vitest)
npm run test:coverage    # HTML coverage report
npm run test:e2e         # E2E (Playwright, requires build first)
```

## Architecture

```
Browser                          Server                    Database
┌─────────────┐                ┌──────────────┐          ┌─────────┐
│ Plaintext   │  encrypt()     │ Encrypted    │  store   │ SQLite  │
│ post/title  │ ──────────────>│ ciphertext   │ ────────>│ /Turso  │
│             │  AES-256-GCM   │ + IV         │          │         │
│ Decrypted   │  decrypt()     │ Encrypted    │  fetch   │         │
│ content     │ <──────────────│ ciphertext   │ <────────│         │
└─────────────┘                └──────────────┘          └─────────┘

The server is a storage relay. It never sees plaintext content,
titles, or your passphrase. Encryption keys exist only in browser memory.
```

## Project Structure

```
src/
├── app/
│   ├── api/posts/          # Post CRUD endpoints
│   ├── api/tags/           # Tag CRUD endpoints
│   ├── api/media/          # Media upload, serve, delete endpoints
│   ├── api/auth/           # Auth endpoints (setup, login, logout, password, passphrase)
│   ├── app/feed/           # Feed page (list + filter posts)
│   ├── app/post/           # New, view, edit post pages
│   ├── app/media/          # Media gallery
│   ├── app/tags/           # Tag management
│   ├── app/search/         # Client-side encrypted search
│   ├── app/settings/       # Settings (password, passphrase, export)
│   ├── login/              # Login page
│   └── setup/              # First-time setup wizard
├── components/
│   ├── app/                # App components (editor, cards, sidebar, header, media)
│   ├── auth/               # Auth components (login form, setup wizard, passphrase gate)
│   ├── landing/            # Landing page sections
│   └── ui/                 # Primitives (button, input, toast, tag badge, etc.)
├── lib/
│   ├── auth/               # Password hashing, session management
│   ├── crypto/             # AES-256-GCM encrypt/decrypt, key derivation, key store
│   └── db/                 # Database connection, schema, migrations
├── instrumentation.ts      # Auto-runs migrations on startup
└── middleware.ts           # Route protection, rate limiting, security headers
```

## Security Model

- **Passphrase** → PBKDF2 (600k iterations, SHA-256) → **CryptoKey**
- **CryptoKey** + random IV → AES-256-GCM → **ciphertext**
- Passphrase never leaves the browser
- Server stores only ciphertext, IVs, and a verifier blob
- Session auth via Auth.js v5 (GitHub OAuth, JWT httpOnly cookies)
- Single-user design eliminates multi-tenant attack surface

**Threat model**: protects against server compromise and database leaks. Does not protect against a compromised browser or keylogger on the client device.

See [`docs/SECURITE.md`](docs/SECURITE.md) for the full security analysis (in French).

## Documentation

- **English / Tech**: this README + inline TypeScript types
- **Français / BTS SIO E6**: [`docs/`](docs/) — see the [BTS SIO E6 section](#bts-sio-e6--dossier-de-réalisation-professionnelle) above

## License

[AGPL-3.0](LICENSE) — free to use, modify, and self-host. Modifications to the source must be shared under the same license.

---

<p align="center">
  Built by <a href="https://maximemansiet.fr">Maxime Louis François Mansiet</a>
</p>
