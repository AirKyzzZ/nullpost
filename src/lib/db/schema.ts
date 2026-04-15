/**
 * Schéma de la base de données — Drizzle ORM + SQLite
 *
 * Pourquoi Drizzle plutôt que Prisma ?
 * → Drizzle est plus léger et offre un typage TypeScript natif sans génération
 *   de code. Parfait pour SQLite où Prisma a des limitations.
 *
 * Pourquoi SQLite plutôt que PostgreSQL ?
 * → SQLite est un fichier unique, pas besoin de serveur de base de données.
 *   Idéal pour le self-hosting (Docker) et le développement local.
 *   Pour la production cloud, on utilise Turso (SQLite distribué).
 *
 * Architecture de chiffrement :
 * → Les posts sont chiffrés côté CLIENT avant d'être envoyés au serveur.
 *   Le serveur ne stocke que du texte chiffré (encryptedContent + iv).
 *   Même un administrateur de la base de données ne peut pas lire les posts.
 *   Exception : les posts publics ont aussi une copie en clair (plainContent)
 *   pour permettre l'affichage sans passphrase.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

// Table des utilisateurs — créés automatiquement lors du premier login GitHub
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoid() — identifiant unique URL-safe
  githubId: text("github_id").notNull().unique(), // ID numérique GitHub (stable, ne change jamais)
  githubLogin: text("github_login").notNull().unique(), // Nom d'utilisateur GitHub (ex: "AirKyzzZ")
  githubEmail: text("github_email"), // Email GitHub (peut être null si privé)
  // Champs de chiffrement — définis lors du setup initial (après le premier login)
  encryptionSalt: text("encryption_salt"), // Sel pour PBKDF2 (dérivation de clé)
  encryptionVerifier: text("encryption_verifier"), // Texte connu chiffré avec la passphrase
  encryptionVerifierIv: text("encryption_verifier_iv"), // IV du verifier
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Table des sessions — utilisée pour le suivi des connexions actives
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    // CASCADE : si l'utilisateur est supprimé, ses sessions sont aussi supprimées
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Table WebAuthn — prévue pour une future authentification par clé de sécurité (YubiKey, etc.)
export const webauthnCredentials = sqliteTable("webauthn_credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  backedUp: integer("backed_up", { mode: "boolean" }).default(false),
  transports: text("transports"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Table des posts — le contenu est TOUJOURS chiffré côté client
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  encryptedContent: text("encrypted_content").notNull(), // Contenu chiffré AES-256-GCM (base64)
  iv: text("iv").notNull(), // Vecteur d'initialisation unique pour ce post (base64)
  contentType: text("content_type", { enum: ["thought", "longform"] })
    .notNull()
    .default("thought"), // "thought" = court, "longform" = article long
  encryptedTitle: text("encrypted_title"), // Titre chiffré (optionnel, surtout pour longform)
  titleIv: text("title_iv"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  // Copies en clair — uniquement pour les posts publics (visibles sans passphrase)
  plainContent: text("plain_content"),
  plainTitle: text("plain_title"),
  charCount: integer("char_count"), // Statistiques (calculées côté client avant chiffrement)
  wordCount: integer("word_count"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Table des tags — catégorisation des posts
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // Nom unique, stocké en minuscules
  color: text("color").notNull().default("#00ff41"), // Couleur hexadécimale (vert matrix par défaut)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Table de liaison posts ↔ tags (relation many-to-many)
// Un post peut avoir plusieurs tags, un tag peut être sur plusieurs posts
export const postTags = sqliteTable("post_tags", {
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
})

// Table des médias — fichiers uploadés (images, etc.)
// Les noms de fichiers sont aussi chiffrés pour préserver la confidentialité
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  // SET NULL : si le post est supprimé, le média reste mais devient orphelin
  postId: text("post_id").references(() => posts.id, { onDelete: "set null" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  encryptedFilename: text("encrypted_filename").notNull(), // Nom de fichier chiffré
  filenameIv: text("filename_iv").notNull(),
  storagePath: text("storage_path").notNull(), // Chemin physique sur le serveur
  mimeType: text("mime_type").notNull(), // Type MIME (image/png, etc.)
  size: integer("size").notNull(), // Taille en octets
  iv: text("iv").notNull(), // IV pour le chiffrement du contenu du fichier
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})
