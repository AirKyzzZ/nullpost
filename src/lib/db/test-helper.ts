/**
 * Helper pour les tests d'intégration — crée une base de données SQLite en mémoire.
 *
 * Pourquoi en mémoire (":memory:") ?
 * → Chaque test démarre avec une base vide, pas de pollution entre tests.
 *   La base est détruite automatiquement quand le test termine.
 *   Pas besoin de nettoyer des fichiers après les tests.
 */

import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

/** Crée une base de données SQLite en mémoire avec les tables NullPost */
export function createTestDb() {
  const client = createClient({ url: ":memory:" })
  const db = drizzle(client, { schema })
  return { db, client }
}

/**
 * SQL pour créer toutes les tables (version actuelle du schéma).
 * On utilise du SQL brut plutôt que les migrations Drizzle car les migrations
 * ont un historique (email/password → GitHub OAuth) qui complique les tests.
 */
const CREATE_TABLES_SQL = `
  CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    github_id TEXT NOT NULL UNIQUE,
    github_login TEXT NOT NULL UNIQUE,
    github_email TEXT,
    encryption_salt TEXT,
    encryption_verifier TEXT,
    encryption_verifier_iv TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE webauthn_credentials (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL DEFAULT 0,
    device_type TEXT,
    backed_up INTEGER DEFAULT 0,
    transports TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE posts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_content TEXT NOT NULL,
    iv TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'thought',
    encrypted_title TEXT,
    title_iv TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    plain_content TEXT,
    plain_title TEXT,
    char_count INTEGER,
    word_count INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE tags (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#00ff41',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE post_tags (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE media (
    id TEXT PRIMARY KEY NOT NULL,
    post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_filename TEXT NOT NULL,
    filename_iv TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    iv TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`

/** Initialise les tables dans une base de données en mémoire */
export async function setupTestDb() {
  const { db, client } = createTestDb()

  // Exécution du SQL de création des tables
  // On sépare par ";" car libSQL exécute une seule requête à la fois
  const statements = CREATE_TABLES_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const sql of statements) {
    await client.execute(sql)
  }

  return { db, client }
}

/** Données d'un utilisateur de test */
export const TEST_USER = {
  id: "test-user-id",
  githubId: "12345",
  githubLogin: "testuser",
  githubEmail: "test@example.com",
  encryptionSalt: "dGVzdC1zYWx0", // "test-salt" en base64
  encryptionVerifier: "dGVzdC12ZXJpZmllcg==", // "test-verifier" en base64
  encryptionVerifierIv: "dGVzdC1pdg==", // "test-iv" en base64
} as const
