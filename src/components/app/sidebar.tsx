"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FileText,
  PenSquare,
  Tags,
  Search,
  Image,
  Settings,
  LogOut,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyStore } from "@/lib/crypto/key-store"

const NAV_ITEMS = [
  { href: "/app/feed", label: "Feed", icon: FileText },
  { href: "/app/post/new", label: "New Post", icon: PenSquare },
  { href: "/app/tags", label: "Tags", icon: Tags },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/media", label: "Media", icon: Image },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const lock = useKeyStore((s) => s.lock)

  async function handleLogout() {
    lock()
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  function handleLock() {
    lock()
  }

  return (
    <aside className="w-56 h-screen bg-null-surface border-r border-null-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-null-border">
        <Link href="/app" className="font-terminal text-null-green text-sm glow-green">
          {">"} NullPost_
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm font-terminal transition-colors",
                active
                  ? "bg-null-green/10 text-null-green"
                  : "text-null-muted hover:text-null-text hover:bg-null-border/50",
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-4 border-t border-null-border space-y-1">
        <button
          onClick={handleLock}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm font-terminal text-null-muted hover:text-null-cyan hover:bg-null-border/50 transition-colors w-full cursor-pointer"
        >
          <Lock size={16} />
          <span>Lock</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm font-terminal text-null-muted hover:text-null-red hover:bg-null-border/50 transition-colors w-full cursor-pointer"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
