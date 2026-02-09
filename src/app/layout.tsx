import type { Metadata } from "next"
import { JetBrains_Mono, Inter } from "next/font/google"
import "./globals.css"

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "NullPost — Your thoughts. Your servers. Your rules.",
  description:
    "A private, encrypted, self-hosted micro-blogging platform. Open source. No tracking. No algorithms. Your words belong to you.",
  keywords: [
    "privacy",
    "self-hosted",
    "micro-blogging",
    "encrypted",
    "open-source",
    "journal",
  ],
  authors: [{ name: "Maxime Mansiet", url: "https://maximemansiet.fr" }],
  openGraph: {
    title: "NullPost",
    description: "Your thoughts. Your servers. Your rules.",
    url: "https://nullpost.maximemansiet.fr",
    siteName: "NullPost",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrains.variable} ${inter.variable} antialiased`}>
        <div className="scan-line" />
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  )
}
