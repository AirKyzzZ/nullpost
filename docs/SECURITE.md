# Sécurité, NullPost

> Synthèse pour l'épreuve E6 BTS SIO SLAM. Détails complets dans
> [`ARCHITECTURE.md`](ARCHITECTURE.md#sécurité).

## 1. Principe central : chiffrement client-side

Le serveur ne voit **jamais** le contenu en clair des publications.

```
                  Passphrase (saisie utilisateur)
                            │
                            ▼
       PBKDF2 (600 000 itérations, SHA-256)
                            │
                            ▼
            Clé AES-256 (extractable: false)
                            │
                            ▼
              AES-256-GCM (IV unique par op.)
                            │
                            ▼
           Ciphertext (base64) + IV (base64)
                            │
                            ▼
              Stocké en base de données
```

**Implémentation** : Web Crypto API native (`window.crypto.subtle`), aucune dépendance npm de
crypto. Voir [`src/lib/crypto/`](../src/lib/crypto/).

## 2. Authentification OAuth 2.0 (GitHub)

- Aucun mot de passe stocké côté NullPost.
- Authorization Code Flow géré par Auth.js v5 (`src/auth.ts`).
- Cookies de session : **httpOnly**, **SameSite**, signés par JWT (Auth.js).
- Restriction mono-utilisateur via `ALLOWED_GITHUB_USER` : seul l'identifiant GitHub
  configuré peut se connecter.

## 3. Headers HTTP de sécurité

Configurés dans [`src/middleware.ts`](../src/middleware.ts) :

| Header | Valeur | But |
|---|---|---|
| `X-Frame-Options` | `DENY` | Bloque le clickjacking (impossible d'embarquer NullPost dans un iframe) |
| `X-Content-Type-Options` | `nosniff` | Empêche le navigateur de deviner le type MIME |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limite les fuites d'URL aux sites tiers |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Désactive les API sensibles |

## 4. Rate limiting

- 100 requêtes/minute par IP.
- Implémentation en mémoire (Map glissante) dans [`src/middleware.ts`](../src/middleware.ts).
- Renvoie `429 Too Many Requests` avec en-tête `Retry-After`.

## 5. Garde d'authentification

- **Middleware** : protège toutes les routes `/app/*` (redirection vers `/login` si non
  connecté).
- **API Routes** : appellent `requireAuth()` ([`src/lib/auth/guard.ts`](../src/lib/auth/guard.ts))
  avant tout traitement → renvoient `401` si pas de session valide.
- **Habilitations** : chaque ressource (post, tag, media) est filtrée par `userId` extrait
  de la session, jamais de l'URL.

## 6. Modèle de menace

| Menace | Couverte ? | Notes |
|---|---|---|
| Compromission du serveur | **Oui** | Les données sont chiffrées ; serveur ne voit rien d'utile |
| Fuite de la base de données | **Oui** | Aucun mot de passe ; contenu illisible sans la passphrase |
| Attaque CSRF | **Oui** | Cookies httpOnly + SameSite, vérifications Auth.js |
| Clickjacking | **Oui** | `X-Frame-Options: DENY` |
| Abus d'API (scraping, brute) | **Oui** | Rate limiting 100/min/IP |
| Injection SQL | **Oui** | Drizzle ORM (requêtes paramétrées par défaut) |
| XSS | **Oui** | React échappe le contenu, CSP appliquée |
| Compromission du navigateur (keylogger, malware) | Hors scope | Si la machine de l'utilisateur est compromise, la passphrase peut être capturée |
| Mot de passe GitHub faible | Hors scope | Délégué à GitHub (responsabilité de l'utilisateur) |

## 7. RGPD

Page dédiée : [`/rgpd`](https://nullpost.maximemansiet.fr/rgpd), code dans
[`src/app/rgpd/page.tsx`](../src/app/rgpd/page.tsx).

Documenté :
- **Données collectées** : identifiant GitHub, login, email (provenant d'OAuth) ; contenu
  des publications **uniquement chiffré** ; horodatages.
- **Bases légales** : exécution du contrat (mise à disposition du service) + intérêt
  légitime (sécurité).
- **Durée de conservation** : tant que le compte existe ; export/suppression sur demande.
- **Droits utilisateur** : accès, rectification, suppression, portabilité (export JSON
  intégré dans `/app/settings`).
- **Contact** : adresse email du responsable de traitement.

## 8. Vérifications automatisées

Le pipeline CI [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) vérifie :

- ESLint (règles strictes incluant `no-explicit-any`).
- TypeScript en mode strict (compilation échoue à la moindre incohérence de type).
- Tests unitaires de la couche crypto (11 tests dans
  [`src/lib/crypto/crypto.test.ts`](../src/lib/crypto/crypto.test.ts)).
- Tests E2E qui valident la présence des security headers en production.

## 9. Audits réguliers

```bash
# Vulnérabilités des dépendances
npm audit

# Audit Lighthouse (sécurité, performance, accessibilité)
# Disponible automatiquement sur les déploiements Vercel
```
