"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type TagBadgeProps = {
  name: string
  color: string
  onRemove?: () => void
  onClick?: () => void
  active?: boolean
  className?: string
}

export function TagBadge({
  name,
  color,
  onRemove,
  onClick,
  active = false,
  className,
}: TagBadgeProps) {
  const Component = onClick ? "button" : "span"

  return (
    <Component
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-terminal text-xs transition-colors",
        onClick && "cursor-pointer",
        active
          ? "bg-opacity-20 border"
          : "bg-null-surface border border-null-border hover:border-null-dim",
        className,
      )}
      style={{
        color,
        borderColor: active ? color : undefined,
        backgroundColor: active ? `${color}15` : undefined,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:opacity-70 transition-opacity cursor-pointer"
        >
          <X size={10} />
        </button>
      )}
    </Component>
  )
}
