import { redirect } from "next/navigation"

// Le setup n'est plus nécessaire : les comptes sont créés via GitHub OAuth.
// Rediriger vers la page de login.
export default function SetupPage() {
  redirect("/login")
}
