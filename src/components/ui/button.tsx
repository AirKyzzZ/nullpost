"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-null-green/10 text-null-green border-null-green/30 hover:bg-null-green/20 hover:border-null-green/50",
  secondary:
    "bg-null-cyan/10 text-null-cyan border-null-cyan/30 hover:bg-null-cyan/20 hover:border-null-cyan/50",
  danger:
    "bg-null-red/10 text-null-red border-null-red/30 hover:bg-null-red/20 hover:border-null-red/50",
  ghost:
    "bg-transparent text-null-muted border-transparent hover:text-null-text hover:bg-null-surface",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "font-terminal inline-flex items-center justify-center gap-2 border rounded transition-all duration-200 cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading && <span className="animate-pulse">[ ... ]</span>}
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"
