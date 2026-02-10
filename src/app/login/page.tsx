import { LoginForm } from "@/components/auth/login-form"
import { AsciiLogo } from "@/components/ui/ascii-logo"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <AsciiLogo size="sm" />
      </div>
      <div className="mb-2 font-terminal text-null-muted text-xs tracking-wider uppercase">
        Authentication required
      </div>
      <LoginForm />
    </main>
  )
}
