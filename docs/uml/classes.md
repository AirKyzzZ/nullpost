# Diagramme de classes / composants, NullPost

```mermaid
classDiagram
    direction LR

    class CryptoModule {
        <<lib/crypto>>
        +generateSalt() Uint8Array
        +deriveKey(passphrase, salt) CryptoKey
        +encrypt(plaintext, key) ciphertext
        +decrypt(ciphertext, iv, key) plaintext
        +createVerifier(key) verifier
        +verifyPassphrase(key, verifier) bool
    }

    class KeyStore {
        <<Zustand>>
        -cryptoKey: CryptoKey | null
        +setKey(key)
        +clearKey()
        +getKey() CryptoKey
    }

    class AuthGuard {
        <<lib/auth>>
        +requireAuth(req) Session
        +getSession() Session | null
    }

    class Middleware {
        <<src/middleware.ts>>
        +rateLimitCheck(ip) bool
        +securityHeaders() Headers
        +authGate(req) Response
    }

    class DBConnection {
        <<lib/db>>
        +db: DrizzleClient
        +runMigrations()
    }

    class PostsAPI {
        <<api/posts>>
        +GET(req) Response
        +POST(req) Response
        +PATCH(id, req) Response
        +DELETE(id) Response
    }

    class TagsAPI {
        <<api/tags>>
        +GET(req) Response
        +POST(req) Response
        +PATCH(id, req) Response
        +DELETE(id) Response
    }

    class MediaAPI {
        <<api/media>>
        +POST(req) Response
        +GET(id) StreamResponse
        +DELETE(id) Response
    }

    class AuthAPI {
        <<api/auth>>
        +signIn() Response
        +callback() Response
        +setupEncryption() Response
        +changePassphrase() Response
    }

    class PostEditor {
        <<components/app>>
        +onSubmit(plaintext) void
    }

    class PostCard {
        <<components/app>>
        +decryptAndRender()
    }

    class Sidebar {
        <<components/app>>
        +navigation()
    }

    PostEditor          --> KeyStore : récupère clé
    PostEditor          --> CryptoModule : encrypt
    PostEditor          --> PostsAPI : POST /api/posts

    PostCard            --> KeyStore
    PostCard            --> CryptoModule : decrypt

    PostsAPI            --> AuthGuard
    PostsAPI            --> DBConnection
    TagsAPI             --> AuthGuard
    TagsAPI             --> DBConnection
    MediaAPI            --> AuthGuard
    MediaAPI            --> DBConnection
    AuthAPI             --> DBConnection

    Middleware          --> AuthGuard
```

## Découpage par responsabilité

- **`lib/crypto/`** : cryptographie pure (sans dépendance UI ni DB).
- **`lib/auth/`** : gestion de session (utilisé partout).
- **`lib/db/`** : connexion + schéma + migrations.
- **`app/api/`** : endpoints REST (validation + DB).
- **`components/app/`** : composants applicatifs (utilisent crypto + appellent l'API).
- **`components/ui/`** : composants visuels purs (sans logique métier).

## Inversion de dépendance

- Les composants UI ne connaissent pas la base de données : ils passent par l'API.
- L'API ne connaît pas la cryptographie : elle stocke et renvoie du ciphertext.
- La cryptographie ne connaît pas la base : elle travaille sur des `string` / `Uint8Array`.

Cette séparation rend chaque couche **testable indépendamment** :
- `crypto.test.ts` teste la cryptographie sans serveur.
- `db/integration.test.ts` teste la DB sans navigateur.
- `e2e/*.spec.ts` teste l'ensemble sans mocks.
