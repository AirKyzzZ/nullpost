import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      githubLogin?: string
    } & DefaultSession["user"]
  }
}
