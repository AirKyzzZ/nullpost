import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get("nullpost_session")

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
  matcher: ["/app/:path*", "/login", "/setup"],
}
