import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Vérifie que l'utilisateur GitHub est autorisé (si ALLOWED_GITHUB_USER est défini)
    // et crée l'utilisateur en DB lors du premier login
    async signIn({ profile }) {
      if (!profile?.login) return false

      // Restriction d'accès : seul l'utilisateur autorisé peut se connecter
      const allowedUser = process.env.ALLOWED_GITHUB_USER
      if (allowedUser && profile.login !== allowedUser) {
        return false
      }

      // Créer l'utilisateur en DB s'il n'existe pas encore (premier login)
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

    // Ajoute le login GitHub dans le token JWT
    async jwt({ token, profile }) {
      if (profile?.login) {
        token.githubLogin = profile.login
      }
      return token
    },

    // Expose le login GitHub dans la session côté client
    async session({ session, token }) {
      if (token.githubLogin) {
        session.user.githubLogin = token.githubLogin as string
      }
      return session
    },
  },
})
