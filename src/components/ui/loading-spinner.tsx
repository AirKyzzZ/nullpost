"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const FRAMES = ["[ |    ]", "[ ||   ]", "[ |||  ]", "[ |||| ]", "[ |||||]", "[ |||| ]", "[ |||  ]", "[ ||   ]"]

type LoadingSpinnerProps = {
  text?: string
  className?: string
}

export function LoadingSpinner({ text = "Loading", className }: LoadingSpinnerProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length)
    }, 120)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("font-terminal text-null-green text-sm", className)}>
      <span className="text-null-muted">{FRAMES[frame]}</span>{" "}
      <span>{text}...</span>
    </div>
  )
}
