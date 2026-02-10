"use client"

import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyStore } from "@/lib/crypto/key-store"
import { useSidebarStore } from "@/lib/sidebar-store"

type HeaderProps = {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const isUnlocked = useKeyStore((s) => s.isUnlocked)
  const toggle = useSidebarStore((s) => s.toggle)

  return (
    <header className="h-14 border-b border-null-border bg-null-surface/50 backdrop-blur-sm flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={toggle}
          className="md:hidden text-null-muted hover:text-null-text transition-colors cursor-pointer -ml-1 p-1"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="font-terminal text-null-text text-sm">
            <span className="text-null-green">{">"}</span> {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-terminal">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isUnlocked ? "bg-null-green" : "bg-null-red",
            )}
          />
          <span className={isUnlocked ? "text-null-green" : "text-null-red"}>
            {isUnlocked ? "DECRYPTED" : "LOCKED"}
          </span>
        </div>
      </div>
    </header>
  )
}
