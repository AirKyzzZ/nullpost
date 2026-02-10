"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-terminal text-null-muted uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full bg-null-black border border-null-border rounded px-3 py-2",
            "font-terminal text-sm text-null-text placeholder:text-null-dim",
            "focus:outline-none focus:border-null-green/50 focus:ring-1 focus:ring-null-green/20",
            "transition-colors duration-200",
            error && "border-null-red/50 focus:border-null-red/50 focus:ring-null-red/20",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-terminal text-null-red">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = "Input"
