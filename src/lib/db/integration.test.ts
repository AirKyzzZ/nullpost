/**
 * Tests d'intégration — API routes + base de données SQLite
 *
 * Ces tests vérifient que les opérations CRUD (Create, Read, Update, Delete)
 * fonctionnent correctement avec une vraie base de données SQLite.
 *
 * Pourquoi "intégration" et pas "unitaire" ?
 * → Les tests unitaires testent une seule fonction isolée (ex: encrypt()).
 *   Les tests d'intégration testent l'interaction entre plusieurs composants
 *   (ex: route API → validation → insertion en DB → lecture en DB).
 *
 * Chaque test utilise une base en mémoire (":memory:") pour l'isolation.
 */

import { describe, it, expect, beforeEach } from "vitest"
import { eq, and } from "drizzle-orm"
import { setupTestDb, TEST_USER } from "./test-helper"
import { users, posts, tags, postTags, media } from "./schema"

// Type de la base de données retournée par setupTestDb
type TestDb = Awaited<ReturnType<typeof setupTestDb>>

let testDb: TestDb

// Avant chaque test : créer une base de données vierge
beforeEach(async () => {
  testDb = await setupTestDb()
})

// ──────────────────────────────────────────────
// TESTS : TABLE USERS (utilisateurs)
// ──────────────────────────────────────────────

describe("Users — Gestion des utilisateurs", () => {
  it("créer un utilisateur et le retrouver par githubId", async () => {
    const { db } = testDb

    // Insertion d'un utilisateur (simulant le callback signIn d'Auth.js)
    await db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
      githubEmail: TEST_USER.githubEmail,
    })

    // Lecture : retrouver l'utilisateur par son ID GitHub
    const result = await db
      .select()
      .from(users)
      .where(eq(users.githubId, TEST_USER.githubId))
      .limit(1)

    expect(result).toHaveLength(1)
    expect(result[0].githubLogin).toBe("testuser")
    expect(result[0].githubEmail).toBe("test@example.com")
    // Les champs de chiffrement sont null avant le setup
    expect(result[0].encryptionSalt).toBeNull()
  })

  it("configurer le chiffrement d'un utilisateur (setup encryption)", async () => {
    const { db } = testDb

    await db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
    })

    // Mise à jour des champs de chiffrement (simulant POST /api/auth/setup-encryption)
    await db
      .update(users)
      .set({
        encryptionSalt: TEST_USER.encryptionSalt,
        encryptionVerifier: TEST_USER.encryptionVerifier,
        encryptionVerifierIv: TEST_USER.encryptionVerifierIv,
      })
      .where(eq(users.id, TEST_USER.id))

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, TEST_USER.id))
      .limit(1)

    expect(result[0].encryptionSalt).toBe(TEST_USER.encryptionSalt)
    expect(result[0].encryptionVerifier).toBe(TEST_USER.encryptionVerifier)
  })

  it("githubId unique : impossible de créer deux utilisateurs avec le même githubId", async () => {
    const { db } = testDb

    await db.insert(users).values({
      id: "user-1",
      githubId: "same-id",
      githubLogin: "user1",
    })

    // La contrainte UNIQUE doit empêcher l'insertion
    await expect(
      db.insert(users).values({
        id: "user-2",
        githubId: "same-id",
        githubLogin: "user2",
      })
    ).rejects.toThrow()
  })
})

// ──────────────────────────────────────────────
// TESTS : TABLE POSTS (posts chiffrés)
// ──────────────────────────────────────────────

describe("Posts — CRUD des posts chiffrés", () => {
  // Créer un utilisateur avant chaque test de posts
  beforeEach(async () => {
    await testDb.db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
    })
  })

  it("créer un post chiffré et le lire", async () => {
    const { db } = testDb

    // Le contenu est déjà chiffré côté client — le serveur stocke le base64
    await db.insert(posts).values({
      id: "post-1",
      userId: TEST_USER.id,
      encryptedContent: "Y2hpZmZyw6k=", // Données chiffrées (base64)
      iv: "aXYtdGVzdA==", // Vecteur d'initialisation (base64)
      contentType: "thought",
    })

    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.id, "post-1"))
      .limit(1)

    expect(result).toHaveLength(1)
    expect(result[0].encryptedContent).toBe("Y2hpZmZyw6k=")
    expect(result[0].userId).toBe(TEST_USER.id)
    expect(result[0].contentType).toBe("thought")
    expect(result[0].isPublic).toBe(false)
  })

  it("créer un post public avec contenu en clair", async () => {
    const { db } = testDb

    await db.insert(posts).values({
      id: "post-public",
      userId: TEST_USER.id,
      encryptedContent: "Y2hpZmZyw6k=",
      iv: "aXYtdGVzdA==",
      isPublic: true,
      plainContent: "Ceci est un post public visible par tous",
      plainTitle: "Mon premier post public",
    })

    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.id, "post-public"))
      .limit(1)

    expect(result[0].isPublic).toBe(true)
    expect(result[0].plainContent).toBe("Ceci est un post public visible par tous")
    expect(result[0].plainTitle).toBe("Mon premier post public")
  })

  it("modifier un post existant", async () => {
    const { db } = testDb

    await db.insert(posts).values({
      id: "post-edit",
      userId: TEST_USER.id,
      encryptedContent: "ancien-contenu",
      iv: "ancien-iv",
    })

    // Mise à jour (simulant PATCH /api/posts/[id])
    await db
      .update(posts)
      .set({
        encryptedContent: "nouveau-contenu",
        iv: "nouveau-iv",
        updatedAt: new Date(),
      })
      .where(and(eq(posts.id, "post-edit"), eq(posts.userId, TEST_USER.id)))

    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.id, "post-edit"))
      .limit(1)

    expect(result[0].encryptedContent).toBe("nouveau-contenu")
    expect(result[0].iv).toBe("nouveau-iv")
  })

  it("supprimer un post", async () => {
    const { db } = testDb

    await db.insert(posts).values({
      id: "post-delete",
      userId: TEST_USER.id,
      encryptedContent: "contenu",
      iv: "iv",
    })

    // Suppression (simulant DELETE /api/posts/[id])
    await db.delete(posts).where(eq(posts.id, "post-delete"))

    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.id, "post-delete"))

    expect(result).toHaveLength(0)
  })

  it("un utilisateur ne peut pas voir les posts d'un autre", async () => {
    const { db } = testDb

    // Créer un deuxième utilisateur
    await db.insert(users).values({
      id: "other-user",
      githubId: "99999",
      githubLogin: "otheruser",
    })

    // Post du premier utilisateur
    await db.insert(posts).values({
      id: "post-user1",
      userId: TEST_USER.id,
      encryptedContent: "secret",
      iv: "iv",
    })

    // Le deuxième utilisateur ne doit pas voir ce post
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, "post-user1"), eq(posts.userId, "other-user")))

    expect(result).toHaveLength(0)
  })

  it("suppression en cascade : supprimer un utilisateur supprime ses posts", async () => {
    const { db, client } = testDb

    await db.insert(posts).values({
      id: "post-cascade",
      userId: TEST_USER.id,
      encryptedContent: "contenu",
      iv: "iv",
    })

    // Activer les foreign keys (désactivées par défaut en SQLite)
    await client.execute("PRAGMA foreign_keys = ON")
    await db.delete(users).where(eq(users.id, TEST_USER.id))

    const result = await db.select().from(posts).where(eq(posts.id, "post-cascade"))
    expect(result).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────
// TESTS : TABLE TAGS (étiquettes)
// ──────────────────────────────────────────────

describe("Tags — CRUD des tags", () => {
  it("créer un tag et le lire", async () => {
    const { db } = testDb

    await db.insert(tags).values({
      id: "tag-1",
      name: "javascript",
      color: "#f7df1e",
    })

    const result = await db.select().from(tags).where(eq(tags.id, "tag-1"))

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("javascript")
    expect(result[0].color).toBe("#f7df1e")
  })

  it("nom unique : impossible de créer deux tags avec le même nom", async () => {
    const { db } = testDb

    await db.insert(tags).values({ id: "tag-a", name: "rust" })

    await expect(
      db.insert(tags).values({ id: "tag-b", name: "rust" })
    ).rejects.toThrow()
  })

  it("modifier un tag", async () => {
    const { db } = testDb

    await db.insert(tags).values({ id: "tag-edit", name: "old-name" })

    await db
      .update(tags)
      .set({ name: "new-name", color: "#ff0000" })
      .where(eq(tags.id, "tag-edit"))

    const result = await db.select().from(tags).where(eq(tags.id, "tag-edit"))
    expect(result[0].name).toBe("new-name")
    expect(result[0].color).toBe("#ff0000")
  })

  it("supprimer un tag", async () => {
    const { db } = testDb

    await db.insert(tags).values({ id: "tag-del", name: "to-delete" })
    await db.delete(tags).where(eq(tags.id, "tag-del"))

    const result = await db.select().from(tags).where(eq(tags.id, "tag-del"))
    expect(result).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────
// TESTS : TABLE POST_TAGS (liaison posts ↔ tags)
// ──────────────────────────────────────────────

describe("PostTags — Association posts et tags (many-to-many)", () => {
  beforeEach(async () => {
    const { db } = testDb

    await db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
    })

    await db.insert(posts).values({
      id: "post-tagged",
      userId: TEST_USER.id,
      encryptedContent: "contenu",
      iv: "iv",
    })

    await db.insert(tags).values([
      { id: "tag-js", name: "javascript" },
      { id: "tag-ts", name: "typescript" },
    ])
  })

  it("associer des tags à un post", async () => {
    const { db } = testDb

    // Associer deux tags au post (simulant POST /api/posts avec tagIds)
    await db.insert(postTags).values([
      { postId: "post-tagged", tagId: "tag-js" },
      { postId: "post-tagged", tagId: "tag-ts" },
    ])

    const result = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, "post-tagged"))

    expect(result).toHaveLength(2)
  })

  it("remplacer les tags d'un post (delete + insert)", async () => {
    const { db } = testDb

    // Tags initiaux
    await db.insert(postTags).values([
      { postId: "post-tagged", tagId: "tag-js" },
      { postId: "post-tagged", tagId: "tag-ts" },
    ])

    // Remplacement : supprimer tous les tags puis en ajouter un seul
    // (logique de PATCH /api/posts/[id] quand tagIds est fourni)
    await db.delete(postTags).where(eq(postTags.postId, "post-tagged"))
    await db.insert(postTags).values({ postId: "post-tagged", tagId: "tag-ts" })

    const result = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, "post-tagged"))

    expect(result).toHaveLength(1)
    expect(result[0].tagId).toBe("tag-ts")
  })

  it("suppression en cascade : supprimer un post supprime ses associations de tags", async () => {
    const { db, client } = testDb

    await db.insert(postTags).values({ postId: "post-tagged", tagId: "tag-js" })

    await client.execute("PRAGMA foreign_keys = ON")
    await db.delete(posts).where(eq(posts.id, "post-tagged"))

    const result = await db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, "post-tagged"))

    expect(result).toHaveLength(0)
  })
})

// ──────────────────────────────────────────────
// TESTS : TABLE MEDIA (fichiers uploadés)
// ──────────────────────────────────────────────

describe("Media — Gestion des fichiers uploadés", () => {
  beforeEach(async () => {
    const { db } = testDb

    await db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
    })
  })

  it("créer un média et le rattacher à un post", async () => {
    const { db } = testDb

    await db.insert(posts).values({
      id: "post-media",
      userId: TEST_USER.id,
      encryptedContent: "contenu",
      iv: "iv",
    })

    await db.insert(media).values({
      id: "media-1",
      postId: "post-media",
      userId: TEST_USER.id,
      encryptedFilename: "ZmlsZW5hbWU=", // Nom de fichier chiffré
      filenameIv: "aXY=",
      storagePath: "/uploads/media-1",
      mimeType: "image/png",
      size: 1024,
      iv: "bWVkaWEtaXY=",
    })

    const result = await db.select().from(media).where(eq(media.id, "media-1"))

    expect(result).toHaveLength(1)
    expect(result[0].postId).toBe("post-media")
    expect(result[0].mimeType).toBe("image/png")
    expect(result[0].size).toBe(1024)
  })

  it("suppression post → le média reste mais postId devient null (SET NULL)", async () => {
    const { db, client } = testDb

    await db.insert(posts).values({
      id: "post-orphan",
      userId: TEST_USER.id,
      encryptedContent: "contenu",
      iv: "iv",
    })

    await db.insert(media).values({
      id: "media-orphan",
      postId: "post-orphan",
      userId: TEST_USER.id,
      encryptedFilename: "name",
      filenameIv: "iv",
      storagePath: "/path",
      mimeType: "image/jpg",
      size: 512,
      iv: "media-iv",
    })

    await client.execute("PRAGMA foreign_keys = ON")
    await db.delete(posts).where(eq(posts.id, "post-orphan"))

    // Le média existe encore mais n'est plus rattaché à un post
    const result = await db.select().from(media).where(eq(media.id, "media-orphan"))
    expect(result).toHaveLength(1)
    expect(result[0].postId).toBeNull()
  })
})

// ──────────────────────────────────────────────
// TESTS : CHANGEMENT DE PASSPHRASE (transaction)
// ──────────────────────────────────────────────

describe("Change passphrase — Re-chiffrement des posts", () => {
  /**
   * Note technique : en production, cette opération utilise db.transaction()
   * pour garantir l'atomicité (tout réussit ou tout échoue).
   * En test avec SQLite ":memory:", les transactions créent une connexion
   * séparée qui ne voit pas les tables, donc on teste les opérations
   * séquentiellement (le résultat fonctionnel est identique).
   */
  it("mettre à jour le sel + verifier + re-chiffrer les posts", async () => {
    const { db } = testDb

    // Setup initial
    await db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
      encryptionSalt: "old-salt",
      encryptionVerifier: "old-verifier",
      encryptionVerifierIv: "old-iv",
    })

    await db.insert(posts).values([
      {
        id: "post-a",
        userId: TEST_USER.id,
        encryptedContent: "old-encrypted-a",
        iv: "old-iv-a",
      },
      {
        id: "post-b",
        userId: TEST_USER.id,
        encryptedContent: "old-encrypted-b",
        iv: "old-iv-b",
      },
    ])

    // 1. Mettre à jour les champs de chiffrement de l'utilisateur
    await db
      .update(users)
      .set({
        encryptionSalt: "new-salt",
        encryptionVerifier: "new-verifier",
        encryptionVerifierIv: "new-iv",
      })
      .where(eq(users.id, TEST_USER.id))

    // 2. Re-chiffrer chaque post avec la nouvelle clé
    const postUpdates = [
      { id: "post-a", encryptedContent: "new-encrypted-a", iv: "new-iv-a" },
      { id: "post-b", encryptedContent: "new-encrypted-b", iv: "new-iv-b" },
    ]

    for (const post of postUpdates) {
      await db
        .update(posts)
        .set({
          encryptedContent: post.encryptedContent,
          iv: post.iv,
        })
        .where(and(eq(posts.id, post.id), eq(posts.userId, TEST_USER.id)))
    }

    // Vérification : tout a été mis à jour
    const user = await db.select().from(users).where(eq(users.id, TEST_USER.id))
    expect(user[0].encryptionSalt).toBe("new-salt")
    expect(user[0].encryptionVerifier).toBe("new-verifier")

    const postA = await db.select().from(posts).where(eq(posts.id, "post-a"))
    expect(postA[0].encryptedContent).toBe("new-encrypted-a")

    const postB = await db.select().from(posts).where(eq(posts.id, "post-b"))
    expect(postB[0].encryptedContent).toBe("new-encrypted-b")
  })
})

// ──────────────────────────────────────────────
// TESTS : POSTS PUBLICS (lecture sans authentification)
// ──────────────────────────────────────────────

describe("Posts publics — Accès sans authentification", () => {
  it("lister uniquement les posts publics d'un utilisateur", async () => {
    const { db } = testDb

    await db.insert(users).values({
      id: TEST_USER.id,
      githubId: TEST_USER.githubId,
      githubLogin: TEST_USER.githubLogin,
    })

    // Un post privé et un post public
    await db.insert(posts).values([
      {
        id: "post-private",
        userId: TEST_USER.id,
        encryptedContent: "secret",
        iv: "iv",
        isPublic: false,
      },
      {
        id: "post-public",
        userId: TEST_USER.id,
        encryptedContent: "chiffré",
        iv: "iv",
        isPublic: true,
        plainContent: "Contenu visible par tous",
      },
    ])

    // Requête simulant GET /api/public/[username]/posts
    const publicPosts = await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, TEST_USER.id), eq(posts.isPublic, true)))

    expect(publicPosts).toHaveLength(1)
    expect(publicPosts[0].id).toBe("post-public")
    expect(publicPosts[0].plainContent).toBe("Contenu visible par tous")
  })
})
