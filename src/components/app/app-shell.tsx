"use client"

import { Sidebar } from "./sidebar"
import { PassphraseGate } from "@/components/auth/passphrase-gate"
import { ToastContainer } from "@/components/ui/toast"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <PassphraseGate>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-56">
          {children}
        </main>
      </div>
      <ToastContainer />
    </PassphraseGate>
  )
}
