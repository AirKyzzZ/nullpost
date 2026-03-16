-- Migration: remplacer auth email/password par GitHub OAuth
-- Ajoute les colonnes GitHub, supprime email/username/passwordHash
-- Les champs encryption deviennent nullable (premier login sans passphrase)

ALTER TABLE users ADD COLUMN github_id TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN github_login TEXT;--> statement-breakpoint
ALTER TABLE users ADD COLUMN github_email TEXT;--> statement-breakpoint

-- Rendre les champs encryption nullable (ils sont NOT NULL actuellement)
-- SQLite ne supporte pas ALTER COLUMN, donc on crée une nouvelle table

CREATE TABLE users_new (
  id TEXT PRIMARY KEY NOT NULL,
  github_id TEXT NOT NULL UNIQUE,
  github_login TEXT NOT NULL UNIQUE,
  github_email TEXT,
  encryption_salt TEXT,
  encryption_verifier TEXT,
  encryption_verifier_iv TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);--> statement-breakpoint

INSERT INTO users_new (id, github_id, github_login, encryption_salt, encryption_verifier, encryption_verifier_iv, created_at, updated_at)
  SELECT id, id, id, encryption_salt, encryption_verifier, encryption_verifier_iv, created_at, updated_at FROM users;--> statement-breakpoint

DROP TABLE users;--> statement-breakpoint
ALTER TABLE users_new RENAME TO users;--> statement-breakpoint

-- Recréer les index
CREATE UNIQUE INDEX users_github_id_unique ON users(github_id);--> statement-breakpoint
CREATE UNIQUE INDEX users_github_login_unique ON users(github_login);
