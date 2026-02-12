"use client"

import { GlitchText } from "@/components/ui/glitch-text"

type ProfileHeaderProps = {
  username: string
  postCount: number
}

export function ProfileHeader({ username, postCount }: ProfileHeaderProps) {
  return (
    <div className="space-y-2 pb-6 border-b border-null-border">
      <GlitchText
        text={`@${username}`}
        as="h1"
        className="text-2xl text-null-green glow-green"
        glitchOnHover
      />
      <p className="font-terminal text-xs text-null-muted">
        {postCount} public post{postCount !== 1 ? "s" : ""}
      </p>
    </div>
  )
}
