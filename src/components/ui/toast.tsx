"use client"

import { create } from "zustand"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

type ToastType = "success" | "error" | "info"

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastStore = {
  toasts: Toast[]
  add: (message: string, type?: ToastType) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "info") => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4000)
  },
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function toast(message: string, type?: ToastType) {
  useToastStore.getState().add(message, type)
}

const typeStyles: Record<ToastType, string> = {
  success: "border-null-green/30 text-null-green",
  error: "border-null-red/30 text-null-red",
  info: "border-null-cyan/30 text-null-cyan",
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-null-surface border rounded font-terminal text-sm transition-all duration-300",
        typeStyles[t.type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <span className="text-null-muted">{">"}</span>
      <span className="flex-1">{t.message}</span>
      <button
        onClick={onDismiss}
        className="text-null-dim hover:text-null-text transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
      ))}
    </div>
  )
}
