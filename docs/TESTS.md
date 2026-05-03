# Tests — NullPost

> Stratégie de tests automatisés, pour l'épreuve E6 BTS SIO SLAM.

## 1. Pyramide de tests

```
                ╱──────────────╲
               ╱   E2E (Playwright) ╲   ← tests/e2e/* — auth, landing, rgpd, api
              ╱──────────────────────╲
             ╱   Intégration (Vitest) ╲ ← src/lib/db/integration.test.ts (CRUD complet)
            ╱──────────────────────────╲
           ╱   Unitaires (Vitest)        ╲← crypto, format, reserved-usernames
          ╱──────────────────────────────╲
```

## 2. Outils

- **[Vitest](https://vitest.dev)** : framework de tests moderne pour TypeScript, compatible
  Vite/Next.js. Plus rapide que Jest grâce à esbuild et au cache intelligent.
- **[Playwright](https://playwright.dev)** : navigateur réel (Chromium) pour les tests E2E.
- **`drizzle-orm`** + base SQLite éphémère pour les tests d'intégration.

## 3. Tests unitaires

### Chiffrement (`src/lib/crypto/crypto.test.ts`)

Couvre la couche cryptographique :
- Roundtrip encrypt/decrypt avec une clé valide.
- Décryptage avec une mauvaise passphrase → erreur explicite.
- IV unique pour chaque opération (vérification statistique).
- Vérificateur de passphrase (`createVerifier` / `verifyPassphrase`).
- Dérivation `deriveKey` reproductible pour le même couple `(passphrase, sel)`.
- Cas limites : message vide, message Unicode, message volumineux.

### Formatage (`src/lib/format.test.ts`)

- Dates relatives (« il y a 5 minutes »).
- Tailles de fichiers (`formatBytes`).

### Validation (`src/lib/reserved-usernames.test.ts`)

- Détection des noms d'utilisateur réservés (`api`, `admin`, etc.).

## 4. Tests d'intégration

`src/lib/db/integration.test.ts` valide la couche persistance sur une base SQLite
éphémère (créée puis supprimée par le test) :

- Création d'utilisateur avec contraintes d'unicité.
- CRUD complet posts (insert, select, update, delete).
- CRUD complet tags.
- Relation many-to-many `posts ↔ tags` via `post_tags`.
- Suppression en cascade (supprimer un user supprime ses posts).
- Médias avec `postId` nullable (médias orphelins).
- Migrations Drizzle exécutées automatiquement avant chaque suite.

## 5. Tests end-to-end (Playwright)

`tests/e2e/` lance un vrai serveur Next.js en mode production et exécute des scénarios
utilisateur dans Chromium :

| Fichier | Scénarios |
|---|---|
| `auth.spec.ts` | Redirection `/app/*` vers `/login` si non authentifié, security headers présents |
| `landing.spec.ts` | Landing page accessible, éléments principaux visibles |
| `rgpd.spec.ts` | Page RGPD accessible, mentions légales présentes |
| `api.spec.ts` | Endpoint `/api/health` répond 200, endpoints protégés répondent 401 |

## 6. Pipeline CI/CD

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) :

```
Push ou PR vers main
    │
    ▼
Job 1 — CI (obligatoire)
    ├── npm ci          (installation déterministe)
    ├── ESLint          (vérification du style)
    ├── Vitest          (tests unitaires + intégration)
    └── Next.js build   (vérification de la compilation)
    │
    ▼ (si Job 1 réussi)
Job 2 — E2E
    ├── Playwright install (navigateurs)
    ├── npm run build (production)
    ├── npm run test:e2e
    └── Upload rapport HTML (artefact 7 jours)
```

**Le build production est obligatoire** avant les E2E pour que les tests valident le code
réellement déployé, pas la version de développement.

## 7. Commandes locales

```bash
# Tests unitaires + intégration (rapide, ~10s)
npm test

# Avec rapport de couverture HTML
npm run test:coverage
# → ouvre coverage/index.html

# Tests E2E (nécessite un build préalable)
npm run build
npm run test:e2e

# Tests E2E avec UI (debugging)
npm run test:e2e -- --ui
```

## 8. Tests de non-régression

Toutes les évolutions visibles dans l'historique git ont été couvertes par des tests :

- Refactor `bcrypt → OAuth` : ajout des tests E2E vérifiant les redirections.
- Ajout du middleware sécurité : tests E2E des security headers.
- Ajout de la page RGPD : test E2E `rgpd.spec.ts`.
- Ajout des profils publics : tests d'API `/api/public/[username]`.

Aucun PR n'a été mergé sur `main` sans que le pipeline CI ne soit vert.

## 9. Couverture mesurée

Vitest produit un rapport HTML détaillé via `npm run test:coverage`. Cibles :

- Couche crypto : > 90 % (sécurité critique).
- Couche DB : > 80 % (logique métier).
- Couche UI / pages : non instrumentée (couverte par les E2E).
