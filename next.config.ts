import type { NextConfig } from "next"

const isServerless = !!(process.env.NETLIFY || process.env.VERCEL)

const nextConfig: NextConfig = {
  // standalone output is for Docker self-hosting only
  ...(!isServerless && { output: "standalone" as const }),
  serverExternalPackages: ["better-sqlite3"],
  ...(!isServerless && {
    outputFileTracingIncludes: {
      "/*": ["./drizzle/**/*"],
    },
  }),
  async rewrites() {
    return [
      {
        source: "/@:username/:path*",
        destination: "/profile/:username/:path*",
      },
      {
        source: "/@:username",
        destination: "/profile/:username",
      },
    ]
  },
}

export default nextConfig
