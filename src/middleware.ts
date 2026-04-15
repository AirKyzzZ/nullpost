/**
 * Middleware Next.js — Intercepte CHAQUE requête avant qu'elle n'atteigne les pages/API.
 *
 * Trois responsabilités :
 * 1. Rate limiting : protège l'API contre les abus (100 requêtes/minute par IP)
 * 2. Security headers : ajoute des en-têtes HTTP de sécurité à toutes les réponses
 * 3. Auth guard : redirige les utilisateurs non connectés vers /login
 *
 * Pourquoi un middleware plutôt que vérifier dans chaque page ?
 * → Centralisation : un seul fichier gère toute la sécurité des routes.
 *   Si on ajoutait une nouvelle page /app/*, elle serait automatiquement protégée.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"

/**
 * Rate limiting en mémoire par adresse IP.
 *
 * Pourquoi en mémoire (Map) plutôt qu'en base de données ?
 * → Pour un projet mono-instance, c'est suffisant et très rapide (O(1)).
 *   En production multi-serveurs, on utiliserait Redis, mais ici SQLite est
 *   mono-processus donc la Map en mémoire est cohérente.
 *
 * Fonctionnement : chaque IP a un compteur qui se réinitialise toutes les 60 secondes.
 * Si une IP dépasse 100 requêtes dans cette fenêtre, elle reçoit une erreur 429.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Première requête ou fenêtre expirée → réinitialiser le compteur
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  entry.count++
  // Seuil : 100 requêtes par minute par IP
  return entry.count > 100
}

/**
 * En-têtes de sécurité HTTP ajoutés à CHAQUE réponse.
 *
 * - X-Frame-Options: DENY → empêche l'inclusion de NullPost dans une iframe
 *   (protection contre le clickjacking)
 * - X-Content-Type-Options: nosniff → empêche le navigateur de deviner le type MIME
 *   (protection contre les attaques MIME sniffing)
 * - Referrer-Policy → limite les informations envoyées dans le header Referer
 * - Permissions-Policy → désactive l'accès caméra/micro/géolocalisation
 *   (NullPost n'en a pas besoin, donc on les bloque par précaution)
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  )
  return response
}

/**
 * Fonction principale du middleware — appelée par auth() d'Auth.js.
 * auth() injecte automatiquement req.auth avec la session de l'utilisateur
 * (ou null s'il n'est pas connecté).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl

  // Récupération de l'IP : x-forwarded-for est défini par le reverse proxy (Vercel, Nginx...)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  // Rate limiting sur les routes API (sauf /api/auth qui est géré par Auth.js)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    if (isRateLimited(ip)) {
      const res = new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
      // Retry-After indique au client combien de secondes attendre
      res.headers.set("Retry-After", "60")
      return addSecurityHeaders(res)
    }
  }

  // Auth guard : les routes /app/* nécessitent une session active
  if (pathname.startsWith("/app")) {
    if (!req.auth) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/login", req.url))
      )
    }
  }

  // Redirection : un utilisateur déjà connecté n'a pas besoin de voir /login
  if (pathname === "/login") {
    if (req.auth) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/app/feed", req.url))
      )
    }
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response)
})

/**
 * Matcher : détermine quelles routes passent par le middleware.
 * On exclut les fichiers statiques (_next/static, images, favicon) car
 * ils n'ont pas besoin d'authentification ni de rate limiting.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
