"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type GlitchTextProps = {
  text: string
  className?: string
  as?: "h1" | "h2" | "h3" | "span" | "p"
  glitchOnHover?: boolean
  decodeEffect?: boolean
  decodeSpeed?: number
}

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~0123456789ABCDEF"

export function GlitchText({
  text,
  className,
  as: Tag = "span",
  glitchOnHover = false,
  decodeEffect = false,
  decodeSpeed = 30,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(decodeEffect ? "" : text)
  const [isGlitching, setIsGlitching] = useState(false)
  const hasDecoded = useRef(false)
  const elementRef = useRef<HTMLElement>(null)

  // Decode effect on mount or when visible
  useEffect(() => {
    if (!decodeEffect || hasDecoded.current) return
    hasDecoded.current = true

    let currentIndex = 0
    const finalText = text
    let scrambleInterval: ReturnType<typeof setInterval>

    const decode = () => {
      scrambleInterval = setInterval(() => {
        if (currentIndex >= finalText.length) {
          clearInterval(scrambleInterval)
          setDisplayText(finalText)
          return
        }

        const decoded = finalText.slice(0, currentIndex)
        const scrambled = Array.from({ length: Math.min(3, finalText.length - currentIndex) })
          .map(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)])
          .join("")
        const remaining = finalText.slice(currentIndex + scrambled.length)

        setDisplayText(decoded + scrambled + remaining.replace(/./g, " "))
        currentIndex++
      }, decodeSpeed)
    }

    const timeout = setTimeout(decode, 200)

    return () => {
      clearTimeout(timeout)
      clearInterval(scrambleInterval)
    }
  }, [decodeEffect, decodeSpeed, text])

  // Glitch on hover
  const handleMouseEnter = () => {
    if (!glitchOnHover) return
    setIsGlitching(true)
    setTimeout(() => setIsGlitching(false), 300)
  }

  return (
    <Tag
      ref={elementRef as never}
      className={cn("relative inline-block font-terminal", className)}
      onMouseEnter={handleMouseEnter}
    >
      {displayText || text}
      {isGlitching && (
        <>
          <span
            className="absolute inset-0 text-null-cyan"
            style={{ animation: "glitch-1 0.3s linear" }}
            aria-hidden
          >
            {displayText || text}
          </span>
          <span
            className="absolute inset-0 text-null-red"
            style={{ animation: "glitch-2 0.3s linear" }}
            aria-hidden
          >
            {displayText || text}
          </span>
        </>
      )}
    </Tag>
  )
}
