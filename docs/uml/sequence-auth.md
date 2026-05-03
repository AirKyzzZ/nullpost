# Diagramme de séquence, Authentification + déverrouillage chiffrement

## Phase 1, OAuth 2.0 GitHub

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant NB as NullPost (browser)
    participant NS as NullPost (server)
    participant GH as GitHub OAuth

    U->>NB: clique "Continue with GitHub"
    NB->>NS: GET /api/auth/signin/github
    NS->>NS: génère state + code_verifier (PKCE)
    NS-->>NB: 302 Redirect → GitHub /authorize
    NB->>GH: GET /authorize?...
    GH->>U: page d'autorisation
    U->>GH: autorise

    GH-->>NB: 302 Redirect → /api/auth/callback/github?code=...
    NB->>NS: GET /api/auth/callback/github?code=...
    NS->>GH: POST /access_token (échange code → token)
    GH-->>NS: { access_token }
    NS->>GH: GET /user (profil)
    GH-->>NS: { id, login, email }

    alt login != ALLOWED_GITHUB_USER
        NS-->>NB: 403 Forbidden
    else login autorisé
        NS->>NS: upsert user en DB
        NS-->>NB: cookie JWT httpOnly + 302 Redirect /app
        NB->>U: tableau de bord
    end
```

## Phase 2, Déverrouillage du chiffrement

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant NB as NullPost (browser, JS)
    participant WC as Web Crypto API
    participant NS as NullPost (server)
    participant DB as Base de données

    U->>NB: saisit la passphrase
    NB->>NS: GET /api/auth/session
    NS->>DB: SELECT encryptionSalt, encryptionVerifier, encryptionVerifierIv<br/>FROM users WHERE id = ?
    DB-->>NS: salt, verifier, iv
    NS-->>NB: { salt, verifier, iv }

    NB->>WC: deriveKey(passphrase, salt, 600000 itér.)
    Note over WC: PBKDF2 + SHA-256<br/>extractable: false
    WC-->>NB: cryptoKey

    NB->>WC: decrypt(verifier, iv, cryptoKey)
    alt déchiffrement OK (texte connu)
        WC-->>NB: "VERIFIER_OK"
        NB->>NB: stocker cryptoKey dans Zustand (mémoire)
        NB-->>U: tableau de bord déverrouillé
    else échec
        WC-->>NB: erreur AES-GCM
        NB-->>U: "Passphrase incorrecte"
    end
```

## Notes de sécurité

- **Étape 13 (clé non extractible)** : `extractable: false` empêche l'export via JavaScript.
  Seules les fonctions `encrypt` / `decrypt` natives de Web Crypto peuvent l'utiliser.
- **Étape 16 (vérificateur)** : on chiffre un texte connu (« VERIFIER_OK ») au moment du
  setup. Au login, on tente de le déchiffrer ; si on retrouve le texte d'origine, la
  passphrase est correcte.
- **Aucun mot de passe en base** : l'authentification HTTP est entièrement déléguée à
  GitHub. La passphrase ne quitte jamais le navigateur.
- **Cookie JWT httpOnly + SameSite** : non-accessible en JavaScript, immune au XSS et CSRF.
