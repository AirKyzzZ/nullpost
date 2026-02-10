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
  <a href="#features">Features</a>
  <br /><br />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/next.js-16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/encryption-AES--256--GCM-blue?style=flat-square" alt="Encryption" />
</p>

---

NullPost is a micro-blogging platform for people who want to own their words. Every post is encrypted client-side before it touches the server — your data stays yours, even on hosted infrastructure.

Built with a Watch Dogs 2 terminal aesthetic. No tracking. No algorithms. No AI. Just text.

## Features

**Encryption**
- AES-256-GCM encryption with PBKDF2 key derivation (600k iterations)
- Client-side only — the server never sees your plaintext or passphrase
- Per-post unique IVs, encryption verifier system

**Blogging**
- Two post types: quick **thoughts** and titled **longform** posts
- Create, edit, delete — all with real-time encrypt/decrypt
- Tag system with color coding and feed filtering
- Full-text search across decrypted posts (runs entirely in-browser)

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
| Auth | Session-based (bcrypt + httpOnly cookies) |
| Encryption | Web Crypto API (AES-256-GCM, PBKDF2) |
| State | Zustand |
| Animations | Framer Motion |

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
docker run -d \
  -p 3000:3000 \
  -v nullpost-data:/app/data \
  -e DATABASE_URL=file:./data/nullpost.db \
  ghcr.io/airkyzzz/nullpost:latest
```

Data persists in the `nullpost-data` volume.

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

### Schema Changes

```bash
# Edit src/lib/db/schema.ts, then:
npx drizzle-kit push
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
│   ├── api/auth/           # Auth endpoints (setup, login, logout, session)
│   ├── app/feed/           # Feed page (list + filter posts)
│   ├── app/post/           # New, view, edit post pages
│   ├── app/tags/           # Tag management
│   ├── app/search/         # Client-side encrypted search
│   ├── login/              # Login page
│   └── setup/              # First-time setup wizard
├── components/
│   ├── app/                # App components (editor, cards, sidebar, header)
│   ├── auth/               # Auth components (login form, setup wizard, passphrase gate)
│   ├── landing/            # Landing page sections
│   └── ui/                 # Primitives (button, input, toast, tag badge, etc.)
├── lib/
│   ├── auth/               # Password hashing, session management
│   ├── crypto/             # AES-256-GCM encrypt/decrypt, key derivation, key store
│   └── db/                 # Database connection, schema
└── middleware.ts            # Route protection
```

## Security Model

- **Passphrase** → PBKDF2 (600k iterations, SHA-256) → **CryptoKey**
- **CryptoKey** + random IV → AES-256-GCM → **ciphertext**
- Passphrase never leaves the browser
- Server stores only ciphertext, IVs, and a verifier blob
- Session auth via bcrypt-hashed passwords + httpOnly cookies
- Single-user design eliminates multi-tenant attack surface

**Threat model**: protects against server compromise and database leaks. Does not protect against a compromised browser or keylogger on the client device.

## License

[AGPL-3.0](LICENSE) — free to use, modify, and self-host. Modifications to the source must be shared under the same license.

---

<p align="center">
  Built by <a href="https://maximemansiet.fr">Maxime Mansiet</a>
</p>
