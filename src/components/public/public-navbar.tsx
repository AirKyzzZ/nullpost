"use client"

import Link from "next/link"

type PublicNavbarProps = {
  username: string
}

export function PublicNavbar({ username }: PublicNavbarProps) {
  return (
    <nav className="border-b border-null-border bg-null-surface/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-terminal text-null-green text-sm glow-green hover:opacity-80 transition-opacity"
        >
          {">"} NullPost_
        </Link>
        <span className="font-terminal text-null-cyan text-sm">
          @{username}
        </span>
      </div>
    </nav>
  )
}
