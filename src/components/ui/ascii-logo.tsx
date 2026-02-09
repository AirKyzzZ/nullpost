"use client"

import { cn } from "@/lib/utils"

type AsciiLogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
}

// Half-block ASCII art — compact (2 lines), 39 chars wide, very readable
const ASCII_ART = `█▄░█ █░█ █░░ █░░ █▀█ █▀█ █▀ ▀█▀
█░▀█ █▄█ █▄▄ █▄▄ █▀▀ █▄█ ▄█ ░█░`

// Thinner variant for medium breakpoints
const ASCII_ART_THIN = `╔╗╔╦ ╦╦  ╦  ╔═╗╔═╗╔═╗╔╦╗
║║║║ ║║  ║  ╠═╝║ ║╚═╗ ║
╝╚╝╚═╝╩═╝╩═╝╩  ╚═╝╚═╝ ╩`

export function AsciiLogo({ className, size = "lg" }: AsciiLogoProps) {
  if (size === "sm") {
    return (
      <span
        className={cn(
          "font-terminal text-null-green glow-green text-sm tracking-widest select-none",
          className
        )}
        aria-label="NullPost"
      >
        {">"} NULLPOST
      </span>
    )
  }

  return (
    <div
      className={cn("select-none flex flex-col items-center", className)}
      aria-label="NullPost"
    >
      {/* ASCII art — scales with viewport via clamp() */}
      {/* Half-block version for sm+ screens */}
      <pre
        className="font-terminal text-null-green glow-green leading-tight text-center hidden sm:block"
        style={{ fontSize: "clamp(0.55rem, 2.2vw, 1.15rem)" }}
      >
        {ASCII_ART}
      </pre>

      {/* Thin version for xs screens (< 640px) */}
      <pre
        className="font-terminal text-null-green glow-green leading-tight text-center block sm:hidden"
        style={{ fontSize: "clamp(0.5rem, 3.5vw, 0.85rem)" }}
      >
        {ASCII_ART_THIN}
      </pre>

      {/* Version tag */}
      <div className="font-terminal text-null-dim text-[10px] tracking-wider mt-3">
        v0.1.0 // ENCRYPTED // SOVEREIGN
      </div>
    </div>
  )
}
