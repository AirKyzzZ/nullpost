import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("nullpost_session")

  // API routes and static files — pass through
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Rewrite /@username URLs to /profile/username (browser keeps /@username in address bar)
  if (pathname.startsWith("/@")) {
    const rest = pathname.slice(2)
    const url = request.nextUrl.clone()
    url.pathname = `/profile/${rest}`
    return NextResponse.rewrite(url)
  }

  // Public profile pages — no auth required
  if (pathname.startsWith("/profile/")) {
    return NextResponse.next()
  }

  // App routes require authentication
  if (pathname.startsWith("/app")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  // Login page — redirect to app if already authenticated
  if (pathname === "/login") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/app", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*", "/login", "/setup", "/@:path*", "/profile/:path*"],
}
