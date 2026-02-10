import { redirect } from "next/navigation"
import { isSetupComplete } from "@/lib/auth/session"
import { runMigrations } from "@/lib/db/migrate"
import { SetupWizard } from "@/components/auth/setup-wizard"
import { AsciiLogo } from "@/components/ui/ascii-logo"

export default async function SetupPage() {
  runMigrations()

  const setupDone = await isSetupComplete()
  if (setupDone) {
    redirect("/login")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <AsciiLogo size="sm" />
      </div>
      <div className="mb-2 font-terminal text-null-muted text-xs tracking-wider uppercase">
        First-time setup
      </div>
      <SetupWizard />
    </main>
  )
}
