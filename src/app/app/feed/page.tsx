"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PenSquare, Filter, ChevronDown } from "lucide-react"
import { Header } from "@/components/app/header"
import { PostCard } from "@/components/app/post-card"
import { TagBadge } from "@/components/ui/tag-badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useKeyStore } from "@/lib/crypto/key-store"
import { toast } from "@/components/ui/toast"

const PAGE_SIZE = 20

type PostTag = {
  id: string
  name: string
  color: string
}

type PostMedia = {
  id: string
  mimeType: string
}

type Post = {
  id: string
  encryptedContent: string
  iv: string
  contentType: "thought" | "longform"
  encryptedTitle: string | null
  titleIv: string | null
  charCount: number | null
  wordCount: number | null
  createdAt: string
  updatedAt: string
  tags: PostTag[]
  media: PostMedia[]
}

type Tag = {
  id: string
  name: string
  color: string
}

export default function FeedPage() {
  const isUnlocked = useKeyStore((s) => s.isUnlocked)

  const [posts, setPosts] = useState<Post[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })
      if (activeTagId) params.set("tag", activeTagId)

      const res = await fetch(`/api/posts?${params}`)
      const data = await res.json()

      if (data.posts) {
        setPosts((prev) => append ? [...prev, ...data.posts] : data.posts)
        setHasMore(data.posts.length === PAGE_SIZE)
      }
    } catch {
      toast("Failed to load posts", "error")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [activeTagId])

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags")
      const data = await res.json()
      if (data.tags) setAllTags(data.tags)
    } catch {
      // tags filter won't show
    }
  }, [])

  useEffect(() => {
    if (isUnlocked) {
      fetchPosts()
      fetchTags()
    }
  }, [isUnlocked, fetchPosts, fetchTags])

  function handleLoadMore() {
    fetchPosts(posts.length, true)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setPosts((prev) => prev.filter((p) => p.id !== deleteId))
      toast("Post deleted", "success")
    } catch {
      toast("Failed to delete post", "error")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Header title="Feed" />
      <div className="p-6">
        {!isUnlocked ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-terminal text-null-muted text-sm animate-pulse">
              Waiting for decryption...
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner text="Loading posts" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  href="/app/post/new"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-null-green/10 text-null-green border border-null-green/30 rounded font-terminal text-xs hover:bg-null-green/20 transition-colors"
                >
                  <PenSquare size={14} />
                  New post
                </Link>
                {allTags.length > 0 && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-null-border rounded font-terminal text-xs text-null-muted hover:text-null-text hover:border-null-dim transition-colors cursor-pointer"
                  >
                    <Filter size={12} />
                    Filter
                    {activeTagId && (
                      <span className="w-1.5 h-1.5 rounded-full bg-null-green" />
                    )}
                  </button>
                )}
              </div>
              <span className="font-terminal text-xs text-null-dim">
                {posts.length} post{posts.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Tag filters */}
            {showFilters && allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 border border-null-border rounded bg-null-surface/50">
                <TagBadge
                  name="all"
                  color={!activeTagId ? "#00ff41" : "#555555"}
                  active={!activeTagId}
                  onClick={() => setActiveTagId(null)}
                />
                {allTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    active={activeTagId === tag.id}
                    onClick={() =>
                      setActiveTagId(activeTagId === tag.id ? null : tag.id)
                    }
                  />
                ))}
              </div>
            )}

            {/* Posts */}
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="font-terminal text-null-dim text-6xl">
                  {"{ }"}
                </div>
                <div className="text-center space-y-2">
                  <p className="font-terminal text-null-muted text-sm">
                    {activeTagId ? "No posts with this tag" : "No posts yet"}
                  </p>
                  <p className="text-null-dim text-xs">
                    {activeTagId
                      ? "Try a different filter or write a new post."
                      : "Your encrypted thoughts will appear here."}
                  </p>
                </div>
                <Link
                  href="/app/post/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-null-green/10 text-null-green border border-null-green/30 rounded font-terminal text-sm hover:bg-null-green/20 transition-colors"
                >
                  <PenSquare size={16} />
                  Write your first post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    {...post}
                    onDelete={setDeleteId}
                  />
                ))}

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadMore}
                      loading={loadingMore}
                    >
                      <ChevronDown size={14} />
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete post"
        message="This action cannot be undone. The encrypted data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </>
  )
}
