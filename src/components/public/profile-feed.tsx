"use client"

import { useState, useEffect, useCallback } from "react"
import { ProfileHeader } from "@/components/public/profile-header"
import { PublicPostCard } from "@/components/public/public-post-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"

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

const PAGE_SIZE = 20

export function ProfileFeed({ username }: { username: string }) {
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async (offset: number) => {
    try {
      const res = await fetch(`/api/public/${username}/posts?limit=${PAGE_SIZE}&offset=${offset}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error("User not found")
        throw new Error("Failed to load posts")
      }
      const data = await res.json()
      return data.posts as PublicPost[]
    } catch (err) {
      throw err
    }
  }, [username])

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPosts(0)
        setPosts(data)
        setHasMore(data.length >= PAGE_SIZE)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fetchPosts])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await fetchPosts(posts.length)
      setPosts((prev) => [...prev, ...data])
      setHasMore(data.length >= PAGE_SIZE)
    } catch {
      // Silently fail for load-more
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Loading profile" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="font-terminal text-null-red text-sm">
          {">"} {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProfileHeader username={username} postCount={posts.length} />

      {posts.length === 0 ? (
        <p className="text-center font-terminal text-null-muted text-sm py-12">
          No public posts yet.
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PublicPostCard
              key={post.id}
              id={post.id}
              username={username}
              contentType={post.contentType}
              plainContent={post.plainContent}
              plainTitle={post.plainTitle}
              wordCount={post.wordCount}
              createdAt={post.createdAt}
              tags={post.tags}
              media={post.media}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                loading={loadingMore}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
