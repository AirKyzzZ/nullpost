# Diagramme de séquence — Création et lecture d'un post chiffré

## Création d'un post

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant NB as Navigateur (PostEditor)
    participant ZU as Zustand (key store)
    participant WC as Web Crypto API
    participant API as /api/posts
    participant MW as Middleware (auth + rate-limit)
    participant DR as Drizzle ORM
    participant DB as SQLite / Turso

    U->>NB: rédige son post + clique "Publier"
    NB->>ZU: récupère cryptoKey
    ZU-->>NB: cryptoKey

    NB->>WC: generateRandomIV()
    WC-->>NB: iv (12 octets)
    NB->>WC: encrypt(plaintext, cryptoKey, iv)
    WC-->>NB: ciphertext

    NB->>NB: btoa(ciphertext) + btoa(iv)

    NB->>API: POST /api/posts<br/>{ encryptedContent, iv, contentType, tags }
    API->>MW: requête entrante
    MW->>MW: vérifier session JWT
    MW->>MW: rate-limit OK ?
    MW-->>API: session valide

    API->>DR: db.insert(posts).values({ userId, encryptedContent, iv, ... })
    DR->>DB: INSERT INTO posts (...) (paramétré)
    DB-->>DR: id du nouveau post
    DR-->>API: { id, createdAt }

    alt tags présents
        API->>DR: db.insert(post_tags).values([...])
        DR->>DB: INSERT (M:N)
    end

    API-->>NB: 201 Created { id }
    NB-->>U: redirection /app/feed
```

## Lecture du feed

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant NB as Navigateur (Feed)
    participant API as /api/posts
    participant DR as Drizzle ORM
    participant DB as SQLite / Turso
    participant ZU as Zustand
    participant WC as Web Crypto API

    NB->>API: GET /api/posts?cursor=...
    API->>DR: SELECT posts + LEFT JOIN tags
    DR->>DB: requête paramétrée
    DB-->>DR: rows
    DR-->>API: posts (avec ciphertext)
    API-->>NB: 200 { posts, nextCursor }

    loop pour chaque post
        NB->>ZU: récupère cryptoKey
        NB->>WC: decrypt(post.encryptedContent, post.iv, cryptoKey)
        WC-->>NB: plaintext
        NB->>NB: rendre dans <PostCard />
    end

    NB-->>U: feed décrypté affiché
```

## Notes

- **Étape 4 (génération IV)** : un IV unique de 12 octets est généré pour CHAQUE post.
  Réutiliser un IV avec la même clé en mode GCM compromettrait la confidentialité — d'où
  l'unicité stricte vérifiée par les tests (`crypto.test.ts`).
- **Étape 14-17** : Drizzle ORM produit du SQL paramétré, pas de risque d'injection.
- **Étape 11 (rate-limit)** : 100 req/min/IP. Au-delà, 429 + en-tête `Retry-After`.
- **Étapes 26-28** : le déchiffrement se fait **côté navigateur**, jamais sur le serveur.
- **Pagination par curseur** : `nextCursor` permet de charger les pages suivantes sans
  duplication ni saut.
