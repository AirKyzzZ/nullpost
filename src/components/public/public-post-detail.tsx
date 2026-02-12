"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, MessageSquare, FileText, Hash, Type } from "lucide-react"
import { TagBadge } from "@/components/ui/tag-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownContent } from "@/components/app/markdown-content"
import { formatFullDate } from "@/lib/format"

type PostTag = { id: string; name: string; color: string }
type PostMedia = { id: string; mimeType: string; size: number }
type PublicPost = {
  id: string
  contentType: "thought" | "longform"
  plainContent: string
  plainTitle: string | null
  charCount: number | null
  wordCount: number | null
  createdAt: string
  tags: PostTag[]
  media: PostMedia[]
}

export function PublicPostDetail({
  username,
  postId,
}: {
  username: string
  postId: string
}) {
  const [post, setPost] = useState<PublicPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/${username}/posts/${postId}`)
        if (!res.ok) throw new Error("Post not found")
        const data = await res.json()
        setPost(data)
      } catch {
        setError("Post not found")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username, postId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Loading post" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="font-terminal text-null-red text-sm">
          {">"} {error || "Post not found"}
        </p>
        <Link
          href={`/@${username}`}
          className="font-terminal text-xs text-null-cyan hover:underline"
        >
          Back to profile
        </Link>
      </div>
    )
  }

  const isThought = post.contentType === "thought"

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/@${username}`}
        className="inline-flex items-center gap-1.5 font-terminal text-xs text-null-muted hover:text-null-cyan transition-colors"
      >
        <ArrowLeft size={12} />
        back to @{username}
      </Link>

      {/* Title */}
      {post.plainTitle && (
        <h1 className="font-terminal text-null-text text-2xl font-medium leading-tight">
          {post.plainTitle}
        </h1>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-terminal text-null-dim">
        {isThought ? (
          <span className="inline-flex items-center gap-1 text-null-cyan">
            <MessageSquare size={12} />
            thought
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-null-purple">
            <FileText size={12} />
            longform
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />
          {formatFullDate(post.createdAt)}
        </span>
        {post.wordCount && (
          <span className="inline-flex items-center gap-1">
            <Type size={12} />
            {post.wordCount} words
          </span>
        )}
        {post.charCount && (
          <span className="inline-flex items-center gap-1">
            <Hash size={12} />
            {post.charCount} chars
          </span>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}

      <hr className="terminal-divider" />

      {/* Content */}
      {isThought ? (
        <div className="text-null-text leading-relaxed whitespace-pre-wrap text-sm">
          {post.plainContent}
        </div>
      ) : (
        <MarkdownContent content={post.plainContent} />
      )}

      {/* Media */}
      {post.media.length > 0 && (
        <div className="space-y-3">
          {post.media.map((m) => {
            const src = `/api/public/media/${m.id}/file`
            if (m.mimeType.startsWith("image/")) {
              return (
                <img key={m.id} src={src} alt="" className="max-w-full rounded border border-null-border" loading="lazy" />
              )
            }
            if (m.mimeType.startsWith("audio/")) {
              return <audio key={m.id} src={src} controls className="w-full" />
            }
            if (m.mimeType.startsWith("video/")) {
              return (
                <video key={m.id} src={src} controls className="max-w-full rounded border border-null-border" />
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
