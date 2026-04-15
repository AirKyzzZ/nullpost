/**
 * Configuration Auth.js v5 — Authentification OAuth 2.0 via GitHub
 *
 * Pourquoi OAuth 2.0 plutôt qu'un système de mot de passe ?
 * → On délègue l'authentification à GitHub (Authorization Code Flow).
 *   L'utilisateur ne crée jamais de mot de passe sur NullPost, donc aucun
 *   risque de fuite de credentials côté serveur.
 *
 * Pourquoi Auth.js v5 ?
 * → Bibliothèque standard pour Next.js, gère automatiquement :
 *   - Les tokens JWT signés (session côté client sans base de données)
 *   - La rotation des tokens (refresh automatique)
 *   - Les cookies httpOnly (protection contre le vol de session via XSS)
 */

import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Fournisseur OAuth : GitHub
  // AUTH_GITHUB_ID et AUTH_GITHUB_SECRET viennent de l'app OAuth créée sur GitHub
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],

  // Pages personnalisées : on remplace les pages par défaut d'Auth.js
  // par notre propre page /login avec le design NullPost
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    /**
     * Callback signIn — Appelé après que GitHub a authentifié l'utilisateur.
     *
     * Deux responsabilités :
     * 1. Vérifier que l'utilisateur est autorisé (si ALLOWED_GITHUB_USER est défini,
     *    seul ce compte peut se connecter — utile pour une instance mono-utilisateur)
     * 2. Créer l'utilisateur en base de données lors de son premier login
     *    (les champs de chiffrement seront ajoutés plus tard via /setup)
     */
    async signIn({ profile }) {
      if (!profile?.login) return false

      // Restriction d'accès : si la variable d'environnement est définie,
      // seul cet utilisateur GitHub peut se connecter à cette instance
      const allowedUser = process.env.ALLOWED_GITHUB_USER
      if (allowedUser && profile.login !== allowedUser) {
        return false
      }

      // Créer l'utilisateur en DB s'il n'existe pas encore (premier login)
      // nanoid() génère un identifiant unique de 21 caractères, URL-safe
      const db = getDb()
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.githubId, String(profile.id)))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(users).values({
          id: nanoid(),
          githubId: String(profile.id),
          githubLogin: profile.login as string,
          githubEmail: (profile.email as string) || null,
        })
      }

      return true
    },

    /**
     * Callback jwt — Enrichit le token JWT avec le login GitHub.
     * Le token est signé par AUTH_SECRET et stocké dans un cookie httpOnly.
     * On y ajoute le login pour pouvoir identifier l'utilisateur sans
     * appel supplémentaire à la base de données côté client.
     */
    async jwt({ token, profile }) {
      if (profile?.login) {
        token.githubLogin = profile.login
      }
      return token
    },

    /**
     * Callback session — Expose le login GitHub dans l'objet session côté client.
     * Seules les données explicitement ajoutées ici sont accessibles via useSession().
     * On n'expose jamais le token brut ni les données sensibles.
     */
    async session({ session, token }) {
      if (token.githubLogin) {
        session.user.githubLogin = token.githubLogin as string
      }
      return session
    },
  },
})
