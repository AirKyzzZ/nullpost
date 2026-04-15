# Compétences BTS SIO SLAM — NullPost

> Référentiel de compétences couvertes par le projet NullPost pour l'épreuve E6.
> Chaque compétence est illustrée par du code concret et un fichier précis.

---

## B1 — Gérer le patrimoine informatique

### B1.1 — Recenser et identifier les ressources numériques

- Stack complète documentée dans `docs/ARCHITECTURE.md` (stack technique, justifications)
- Variables d'environnement listées dans `.env.example`
- Schéma de base de données dans `src/lib/db/schema.ts`

---

## B2 — Répondre aux incidents et demandes d'assistance et d'évolution

### B2.2 — Collecter, suivre et orienter des demandes

- CI/CD GitHub Actions : chaque push déclenche lint + tests + build → `.github/workflows/ci.yml`
- Les tests détectent les régressions automatiquement

---

## B3 — Développer la présence en ligne de l'organisation

### B3.1 — Développer et maintenir des solutions informatiques

Voir section **B6** ci-dessous (développement applicatif).

---

## B6 — Organiser son développement professionnel

_(Cette section couvre les compétences SLAM spécifiques au développement.)_

---

## Compétences SLAM spécifiques

### 1. Développer des applications multicouches

**Architecture :**
```
Couche présentation  → src/components/ (React Server + Client Components)
Couche métier        → src/app/api/ (API Routes Next.js)
Couche données       → src/lib/db/ (Drizzle ORM + SQLite)
```

**Fichiers clés :**
- `src/app/api/posts/route.ts` — API REST (GET/POST)
- `src/app/api/posts/[id]/route.ts` — API REST (GET/PATCH/DELETE)
- `src/lib/db/schema.ts` — Schéma de la base de données
- `src/lib/db/index.ts` — Connexion à la base de données

---

### 2. Mettre en œuvre une solution d'authentification

**Mécanisme : OAuth 2.0 avec GitHub (Authorization Code Flow)**

```
Utilisateur → GitHub OAuth → Code d'autorisation → Token → Profil
```

**Pourquoi OAuth 2.0 ?**
→ L'utilisateur n'a pas de mot de passe sur NullPost.
→ L'authentification est déléguée à GitHub (service de confiance).
→ Pas de risque de fuite de credentials côté serveur.

**Fichiers clés :**
- `src/auth.ts` — Configuration Auth.js v5, callbacks signIn/jwt/session
- `src/middleware.ts` — Protection des routes `/app/*` (redirection si non connecté)
- `src/lib/auth/guard.ts` — Fonction `requireAuth()` appelée dans chaque API route
- `src/lib/auth/session.ts` — Récupération de la session utilisateur complète

**Test couvert :**
- `tests/e2e/auth.spec.ts` — Redirections auth (non connecté → /login)

---

### 3. Sécuriser les données et les échanges

**Chiffrement côté client (AES-256-GCM + PBKDF2) :**

Le serveur ne voit jamais le contenu des posts en clair.

```
Passphrase utilisateur
    ↓ PBKDF2 (600 000 itérations, SHA-256)
Clé AES-256 (256 bits, non-extractible)
    ↓ AES-GCM (IV aléatoire par opération)
Texte chiffré (base64) + IV (base64)
    → Stocké en base de données
```

**Fichiers clés :**
- `src/lib/crypto/index.ts` — Fonctions encrypt, decrypt, deriveKey, generateSalt
- `src/lib/crypto/constants.ts` — Paramètres cryptographiques (PBKDF2_ITERATIONS = 600 000)
- `src/lib/crypto/key-store.ts` — Stockage de la clé en mémoire (Zustand)

**Sécurité HTTP (middleware) :**
- Rate limiting : 100 requêtes/minute par IP
- Headers : X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- `src/middleware.ts`

**Tests couverts :**
- `src/lib/crypto/crypto.test.ts` — 11 tests unitaires (roundtrip, mauvaise clé, IV unique...)
- `tests/e2e/api.spec.ts` — Vérification des security headers en E2E

---

### 4. Mettre en place une base de données et gérer la persistance

**Base de données : SQLite via libSQL + Drizzle ORM**

**Tables :**

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (créés au premier login GitHub) |
| `sessions` | Sessions actives (géré par Auth.js) |
| `posts` | Posts chiffrés (encryptedContent + iv) |
| `tags` | Tags/étiquettes |
| `post_tags` | Table de liaison posts ↔ tags (many-to-many) |
| `media` | Fichiers uploadés (noms chiffrés) |

**Pourquoi SQLite ?**
→ Fichier unique, pas de serveur de base de données à démarrer.
→ Parfait pour un projet mono-utilisateur auto-hébergé.
→ Compatible avec Turso (SQLite distribué) pour le cloud.

**Fichiers clés :**
- `src/lib/db/schema.ts` — Définition des tables et relations
- `src/lib/db/index.ts` — Connexion et singleton de base de données
- `src/lib/db/migrate.ts` — Migrations automatiques au démarrage
- `drizzle/` — Fichiers SQL de migration générés

**Tests couverts :**
- `src/lib/db/integration.test.ts` — 14 tests d'intégration CRUD complets

---

### 5. Développer des composants web et réaliser des interfaces

**Next.js App Router — Hybride Server + Client :**

```
Server Components (par défaut)   → Données, pas d'interactivité
Client Components ("use client") → Formulaires, animations, état
```

**Composants UI :**
- `src/components/ui/` — Primitives réutilisables (Button, Input, GlitchText...)
- `src/components/app/` — Composants de l'application (PostCard, PostEditor, Sidebar...)
- `src/components/landing/` — Sections de la page d'accueil

**Pages :**
- `/` — Landing page (Server Component)
- `/login` — Connexion GitHub OAuth
- `/app/feed` — Fil de posts (protégé)
- `/app/post/new` — Création de post
- `/app/settings` — Paramètres utilisateur
- `/profile/[username]` — Profil public

---

### 6. Mettre en place des tests

**Trois niveaux de tests :**

| Type | Outil | Nb tests | Ce qui est testé |
|------|-------|----------|-----------------|
| Unitaires | Vitest | 11 | Chiffrement AES-256-GCM |
| Unitaires | Vitest | 6 | Formatage dates/tailles |
| Unitaires | Vitest | 12 | Validation noms d'utilisateur |
| Intégration | Vitest | ~15 | CRUD complet en base SQLite |
| E2E | Playwright | ~15 | Parcours utilisateur complet |

**Commandes :**
```bash
npm test                 # Tests unitaires + intégration (58 tests)
npm run test:coverage    # Avec rapport de couverture HTML
npm run test:e2e         # Tests E2E Playwright
```

---

### 7. Mettre en place un processus de déploiement (CI/CD)

**Pipeline GitHub Actions (`.github/workflows/ci.yml`) :**

```
Push ou PR vers main
    │
    ▼
Job 1 — CI (obligatoire)
    ├── npm ci          (installation des dépendances)
    ├── ESLint          (vérification du style de code)
    ├── Vitest          (58 tests unitaires + intégration)
    └── Next.js build   (vérification de la compilation)
    │
    ▼ (si Job 1 réussi)
Job 2 — E2E
    ├── Playwright install
    ├── Tests E2E (navigateur Chromium)
    └── Upload rapport HTML (7 jours de rétention)
```

**Déploiement :**
- Production : Vercel (déploiement automatique sur push `main`)
- Self-hosted : Docker + docker-compose (`Dockerfile`, `docker-compose.yml`)

---

### 8. Conformité RGPD

**Page RGPD disponible sur `/rgpd` :**
- Données collectées et pourquoi
- Droits de l'utilisateur (accès, suppression)
- Durée de conservation
- Contact

**Fichier :** `src/app/rgpd/page.tsx`
**Test E2E :** `tests/e2e/rgpd.spec.ts`

---

## Résumé — Critères de l'examen

| Critère attendu | Status | Fichier principal |
|-----------------|--------|-------------------|
| Application web JS/TS (pas de BaaS) | ✅ | `src/app/` |
| Middleware | ✅ | `src/middleware.ts` |
| Authentification OAuth 2.0 | ✅ | `src/auth.ts` |
| Tests unitaires front + back | ✅ | `src/lib/crypto/crypto.test.ts` + `format.test.ts` |
| Tests d'intégration | ✅ | `src/lib/db/integration.test.ts` |
| Tests E2E | ✅ | `tests/e2e/` |
| Documentation technique | ✅ | `docs/ARCHITECTURE.md` |
| Linter configuré | ✅ | `eslint.config.mjs` |
| Page RGPD | ✅ | `src/app/rgpd/page.tsx` |
| CI/CD GitHub Actions | ✅ | `.github/workflows/ci.yml` |
