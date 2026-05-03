# Compétences SLAM — NullPost

> Mapping détaillé des trois compétences du bloc 2 SLAM (BTS SIO 2026) avec liens
> directs vers le code source.

## Compétence 1 — Concevoir et développer une solution applicative

### Sous-compétence : Analyser un besoin exprimé et son contexte juridique

- **Besoin** documenté dans le [`README.md`](../README.md#nullpost) : plateforme de
  micro-blogging privée, mono-utilisateur, où le serveur ne voit jamais le contenu.
- **Contexte juridique** : le projet est conforme au RGPD (page dédiée
  [`/rgpd`](../src/app/rgpd/page.tsx)). La licence AGPL-3.0 garantit la transparence du code
  source : tout fork doit publier ses modifications.

### Sous-compétence : Participer à la conception de l'architecture

- Architecture Next.js 16 App Router : Server Components + Client Components + API Routes.
- Séparation : `src/app/` (pages + API), `src/components/` (UI), `src/lib/` (logique métier).
- Voir [`ARCHITECTURE.md`](ARCHITECTURE.md) et [`uml/classes.md`](uml/classes.md).

### Sous-compétence : Modéliser une solution applicative

- **MCD relationnel** : voir [`uml/erd.md`](uml/erd.md) et
  [`src/lib/db/schema.ts`](../src/lib/db/schema.ts).
- **Diagrammes de séquence** :
  - [`uml/sequence-auth.md`](uml/sequence-auth.md) — login OAuth + déverrouillage chiffrement
  - [`uml/sequence-post.md`](uml/sequence-post.md) — création / lecture d'un post chiffré

### Sous-compétence : Exploiter les ressources du cadre applicatif (framework)

- **Next.js 16** (App Router, Turbopack) : routing fichier, Server Actions, API Routes,
  middleware, instrumentation.
- **Auth.js v5** : OAuth 2.0 GitHub, callbacks `signIn` / `jwt` / `session`.
- **Drizzle ORM** : typage natif TypeScript, migrations versionnées via `drizzle-kit`.
- **Tailwind CSS v4** : système de design utilitaire avec thème personnalisé dans
  `src/app/globals.css`.

### Sous-compétence : Identifier, développer, utiliser ou adapter des composants logiciels

Composants réutilisables développés :

- **UI primitives** : `src/components/ui/` (Button, Input, Toast, GlitchText, MatrixRain,
  TerminalText, AsciiLogo, etc.).
- **Composants fonctionnels** : `src/components/app/` (PostEditor, PostCard, Sidebar,
  Header, MediaUploader, TagFilter).
- **Composants d'authentification** : `src/components/auth/` (LoginForm, SetupWizard,
  PassphraseGate).
- **Composants de landing** : `src/components/landing/` (Hero, Features, FAQ).

### Sous-compétence : Exploiter les technologies Web pour les échanges entre applications

- **Service Web REST** complet : 23 endpoints dans [`src/app/api/`](../src/app/api/).
- **Échanges JSON** typés via `Response.json()` Next.js.
- **Authentification API** : sessions OAuth, headers, status codes RESTful.

### Sous-compétence : Utiliser des composants d'accès aux données

- **Drizzle ORM** comme couche d'abstraction de la base.
- Toutes les requêtes en TypeScript typé statiquement, jamais de SQL en dur.
- Migrations gérées par `drizzle-kit push` ou `drizzle-kit migrate`.

### Sous-compétence : Intégrer en continu les versions

- **Pipeline CI/CD** GitHub Actions : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
- À chaque push : ESLint → Vitest → Build → Playwright E2E → upload des rapports.
- Déploiement automatique sur Vercel (branche `main`).

### Sous-compétence : Réaliser les tests

- Voir [`TESTS.md`](TESTS.md). Trois niveaux : unitaires (Vitest), intégration (Vitest sur
  base SQLite éphémère), E2E (Playwright).

### Sous-compétence : Rédiger des documentations technique et d'utilisation

- **Documentation utilisateur** : [`README.md`](../README.md), page d'accueil.
- **Documentation technique** : ce dossier `docs/` (architecture, compétences, sécurité,
  tests, accès jury, UML).
- **Documentation API** : code TypeScript typé + commentaires sur chaque route.

### Sous-compétence : Exploiter les fonctionnalités d'un environnement de développement et de tests

- **VS Code** + ESLint + Prettier + Tailwind IntelliSense.
- **Drizzle Studio** (`npx drizzle-kit studio`) pour l'inspection visuelle de la base.
- **Playwright UI mode** (`npm run test:e2e -- --ui`) pour le débogage des E2E.

---

## Compétence 2 — Assurer la maintenance corrective ou évolutive

### Sous-compétence : Recueillir, analyser et mettre à jour les informations sur une version

- **Historique git** riche et lisible (commits conventionnels) :
  - `feat:` nouvelles fonctionnalités
  - `fix:` corrections
  - `refactor:` restructurations
  - `docs:` documentation
  - `test:` tests
  - `chore:` outillage
- **Branches** : `main` protégée ; les évolutions passent par des PR.

### Sous-compétence : Évaluer la qualité d'une solution applicative

- **TypeScript strict** : 0 type `any` toléré.
- **ESLint** : 0 warning toléré en CI.
- **Couverture** des tests mesurée par Vitest, ciblée > 80 % sur la couche métier.

### Sous-compétence : Analyser et corriger un dysfonctionnement

Exemples concrets visibles dans `git log` :

- **Fixes Netlify** : crashs au démarrage en production (`fix: skip auto-migrations on
  serverless`, `fix: resolve Netlify 500 by removing @ from middleware matcher`).
- **Crash Netlify production** (`fix: resolve production crash on Netlify`).
- **Refactor authentification** : passage de bcrypt local à OAuth 2.0 GitHub
  (`feat: remplace auth bcrypt par OAuth 2.0 GitHub (Auth.js v5)`).

### Sous-compétence : Mettre à jour des documentations technique et d'utilisation

- README mis à jour à chaque feature majeure (`docs: update README with Phase 1 features`).
- Ce dossier `docs/` reflète l'état courant et est régénéré à chaque évolution majeure.

### Sous-compétence : Élaborer et réaliser les tests des éléments mis à jour

À chaque évolution majeure, des tests dédiés ont été ajoutés :

- Ajout du middleware → `tests/e2e/auth.spec.ts` (vérification des security headers).
- Ajout de la page RGPD → `tests/e2e/rgpd.spec.ts`.
- Ajout des profils publics → `tests/e2e/api.spec.ts` (endpoints publics).
- Refactor crypto → 11 tests unitaires dans `src/lib/crypto/crypto.test.ts`.

---

## Compétence 3 — Gérer les données

### Sous-compétence : Exploiter des données à l'aide d'un langage de requêtes

Drizzle ORM expose une API typée fluent qui se compile en SQL paramétré :

```typescript
// Liste paginée avec filtre par tag (src/app/api/posts/route.ts)
const posts = await db
  .select()
  .from(posts)
  .leftJoin(postTags, eq(postTags.postId, posts.id))
  .where(and(
    eq(posts.userId, userId),
    tagId ? eq(postTags.tagId, tagId) : undefined
  ))
  .orderBy(desc(posts.createdAt))
  .limit(pageSize)
  .offset(offset)
```

Toutes les requêtes sont **paramétrées** ; aucune concaténation de chaînes.

### Sous-compétence : Développer des fonctionnalités applicatives au sein d'un SGBD

- **Schéma Drizzle** : [`src/lib/db/schema.ts`](../src/lib/db/schema.ts).
- **Migrations versionnées** : dossier [`drizzle/`](../drizzle/) auto-généré par
  `drizzle-kit`. Chaque modification de schéma produit un fichier SQL versionné.
- **Auto-migration au démarrage** : [`src/instrumentation.ts`](../src/instrumentation.ts)
  applique les migrations en attente au boot du serveur (sauf en environnement
  serverless Netlify/Vercel où on les pousse manuellement avant le déploiement).

### Sous-compétence : Concevoir ou adapter une base de données

- **Modélisation** : 6 tables avec relations 1-N et N-N (via `post_tags`).
- **Contraintes** : `PRIMARY KEY`, `FOREIGN KEY` avec `ON DELETE CASCADE`, `UNIQUE`,
  `NOT NULL`, `DEFAULT`.
- **Évolutions** :
  - Ajout de `media.postId` nullable pour permettre des médias orphelins.
  - Ajout de `posts.isPublic` et `posts.plainContent` pour les profils publics
    (avec contenu en clair uniquement si l'utilisateur l'autorise explicitement).
  - Ajout d'un champ `users.encryptionVerifier` pour valider la passphrase au login.

### Sous-compétence : Administrer et déployer une base de données

- **Local** : SQLite mono-fichier dans `data/nullpost.db`. Sauvegarde par copie du fichier.
- **Production** : Turso (SQLite distribué) avec réplication multi-régions et
  sauvegardes automatiques toutes les 24 h.
- **Habilitations** : chaque utilisateur est filtré par `userId` extrait de la session
  OAuth ; `ALLOWED_GITHUB_USER` restreint l'accès au seul propriétaire de l'instance.
- **Tests de restauration** : la procédure consiste à remplacer le fichier `nullpost.db`
  ou restaurer un point de récupération Turso, puis relancer le serveur. Validée
  manuellement avant chaque déploiement majeur.

---

## Compétences transverses (référentiel global SLAM)

### Outil collaboratif de gestion de versions et suivi de problèmes

- **Git + GitHub** : <https://github.com/AirKyzzZ/nullpost>.
- **Issues** GitHub pour le suivi des problèmes.
- **Pull Requests** pour les revues de code.
- **Actions** pour la CI/CD.

### Préoccupations de développement durable

- **Bundle minimisé** par le code splitting natif Next.js.
- **Server Components** réduisent le JavaScript envoyé au client.
- **Cache HTTP** sur les ressources statiques.
- **Hébergement Vercel** : data centers à énergie renouvelable (engagement Vercel).
- **Pas de tracking** ni d'algorithmes : économie de calcul côté serveur.
- **Mono-utilisateur** : pas de stockage de données inutiles.

### Documentation par destinataire

- **Utilisateur final** : [`README.md`](../README.md), page d'accueil, [`/rgpd`](../src/app/rgpd/page.tsx).
- **Développeur** : ce dossier `docs/`, commentaires dans le code, types TypeScript.
- **Opérateur** : [`Dockerfile`](../Dockerfile), [`docker-compose.yml`](../docker-compose.yml),
  variables d'environnement documentées dans `.env.example`.
