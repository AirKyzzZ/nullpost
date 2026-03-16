import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Rate limiting : compteur en mémoire par IP (reset toutes les 60s)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  entry.count++
  return entry.count > 100
}

// Security headers appliqués à toutes les réponses
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

export default auth((req) => {
  const { pathname } = req.nextUrl
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  // Rate limiting sur les routes API (sauf /api/auth qui est géré par Auth.js)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    if (isRateLimited(ip)) {
      const res = new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
      res.headers.set("Retry-After", "60")
      return addSecurityHeaders(res)
    }
  }

  // Protection des routes /app/* : rediriger vers /login si pas connecté
  if (pathname.startsWith("/app")) {
    if (!req.auth) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/login", req.url))
      )
    }
  }

  // Page /login : rediriger vers /app/feed si déjà connecté
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
