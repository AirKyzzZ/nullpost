"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type TerminalTextProps = {
  lines: readonly { readonly text: string; readonly delay: number }[]
  className?: string
  onComplete?: () => void
  typingSpeed?: number
}

export function TerminalText({
  lines,
  className,
  onComplete,
  typingSpeed = 20,
}: TerminalTextProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      onComplete?.()
      return
    }

    const line = lines[currentLineIndex]

    // Wait for delay before starting to type this line
    if (!isTyping) {
      const delayTimeout = setTimeout(() => {
        setIsTyping(true)
        setCurrentCharIndex(0)
      }, line.delay - (currentLineIndex > 0 ? lines[currentLineIndex - 1].delay : 0))

      return () => clearTimeout(delayTimeout)
    }

    // Type character by character
    if (currentCharIndex < line.text.length) {
      const typeTimeout = setTimeout(() => {
        setVisibleLines((prev) => {
          const updated = [...prev]
          updated[currentLineIndex] = line.text.slice(0, currentCharIndex + 1)
          return updated
        })
        setCurrentCharIndex((prev) => prev + 1)
      }, typingSpeed)

      return () => clearTimeout(typeTimeout)
    }

    // Line complete, move to next
    setIsTyping(false)
    setCurrentLineIndex((prev) => prev + 1)
  }, [currentLineIndex, currentCharIndex, isTyping, lines, onComplete, typingSpeed])

  return (
    <div className={cn("font-terminal text-null-green space-y-1", className)}>
      {visibleLines.map((line, i) => (
        <div key={i} className="flex items-start">
          <span className={cn(
            i === visibleLines.length - 1 && currentLineIndex < lines.length && "cursor-blink"
          )}>
            {line}
          </span>
        </div>
      ))}
    </div>
  )
}
