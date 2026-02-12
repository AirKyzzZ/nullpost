import { PublicNavbar } from "@/components/public/public-navbar"

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  return (
    <div className="min-h-screen bg-null-black">
      <PublicNavbar username={username} />
      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
