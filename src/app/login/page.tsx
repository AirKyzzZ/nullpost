import { redirect } from "next/navigation"
import { auth, signIn } from "@/auth"
import { AsciiLogo } from "@/components/ui/ascii-logo"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // Si déjà connecté, rediriger vers le feed
  const session = await auth()
  if (session) redirect("/app/feed")

  const { error } = await searchParams

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <AsciiLogo size="sm" />
      </div>

      <div className="mb-2 font-terminal text-null-muted text-xs tracking-wider uppercase">
        Authentication required
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">
        <div>
          <h2 className="font-terminal text-null-green text-lg mb-1">
            {">"} Authenticate
          </h2>
          <p className="text-sm text-null-muted">
            Sign in with your GitHub account to access NullPost.
          </p>
        </div>

        {error === "AccessDenied" && (
          <div className="p-3 border border-null-red/30 bg-null-red/5 rounded">
            <p className="text-xs font-terminal text-null-red">
              {"[!]"} Access denied. Your GitHub account is not authorized.
            </p>
          </div>
        )}

        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/app/feed" })
          }}
        >
          <button
            type="submit"
            className="w-full px-4 py-3 bg-null-surface border border-null-border rounded font-terminal text-sm text-null-text hover:border-null-green hover:text-null-green transition-colors cursor-pointer"
          >
            [ SIGN IN WITH GITHUB ]
          </button>
        </form>

        <p className="text-xs text-null-dim text-center font-terminal">
          {">"} OAuth 2.0 — no password stored on this server
        </p>
      </div>
    </main>
  )
}
