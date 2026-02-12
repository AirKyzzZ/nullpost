"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  PenSquare,
  Tags,
  Search,
  Image,
  Settings,
  LogOut,
  Lock,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyStore } from "@/lib/crypto/key-store"
import { useSidebarStore } from "@/lib/sidebar-store"

const NAV_ITEMS = [
  { href: "/app/feed", label: "Feed", icon: FileText },
  { href: "/app/post/new", label: "New Post", icon: PenSquare },
  { href: "/app/tags", label: "Tags", icon: Tags },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/media", label: "Media", icon: Image },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const lock = useKeyStore((s) => s.lock)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user?.username) setUsername(data.user.username)
      })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    lock()
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-null-border">
        <Link
          href="/app"
          className="font-terminal text-null-green text-sm glow-green"
          onClick={onNavigate}
        >
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
              onClick={onNavigate}
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
        {username && (
          <a
            href={`/@${username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm font-terminal text-null-muted hover:text-null-cyan hover:bg-null-border/50 transition-colors"
          >
            <ExternalLink size={16} />
            <span>My Profile</span>
          </a>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-4 border-t border-null-border space-y-1">
        <button
          onClick={lock}
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
    </>
  )
}

export function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen)
  const close = useSidebarStore((s) => s.close)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, close])

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-56 h-screen bg-null-surface border-r border-null-border flex-col fixed left-0 top-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — animated overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-30 md:hidden"
              onClick={close}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed left-0 top-0 w-56 h-screen bg-null-surface border-r border-null-border flex flex-col z-40 md:hidden"
            >
              <SidebarContent onNavigate={close} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
