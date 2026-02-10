"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search } from "lucide-react"
import { Header } from "@/components/app/header"
import { PostCard } from "@/components/app/post-card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useKeyStore } from "@/lib/crypto/key-store"
import { decrypt } from "@/lib/crypto"
import { toast } from "@/components/ui/toast"

type PostTag = {
  id: string
  name: string
  color: string
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
}

export default function SearchPage() {
  const cryptoKey = useKeyStore((s) => s.cryptoKey)
  const isUnlocked = useKeyStore((s) => s.isUnlocked)

  const [query, setQuery] = useState("")
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [decryptedMap, setDecryptedMap] = useState<
    Map<string, { content: string; title: string | null }>
  >(new Map())
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchAndDecryptAll = useCallback(async () => {
    if (!cryptoKey) return
    setLoading(true)

    try {
      const res = await fetch("/api/posts?limit=100")
      const data = await res.json()
      if (!data.posts) return

      setAllPosts(data.posts)

      const map = new Map<string, { content: string; title: string | null }>()
      for (const post of data.posts) {
        try {
          const content = await decrypt(cryptoKey, post.encryptedContent, post.iv)
          let title: string | null = null
          if (post.encryptedTitle && post.titleIv) {
            title = await decrypt(cryptoKey, post.encryptedTitle, post.titleIv)
          }
          map.set(post.id, { content, title })
        } catch {
          // skip posts that fail to decrypt
        }
      }

      setDecryptedMap(map)
    } catch {
      toast("Failed to load posts", "error")
    } finally {
      setLoading(false)
    }
  }, [cryptoKey])

  useEffect(() => {
    if (isUnlocked) {
      fetchAndDecryptAll()
    }
  }, [isUnlocked, fetchAndDecryptAll])

  useEffect(() => {
    if (!query.trim()) {
      setFilteredPosts([])
      setSearching(false)
      return
    }

    setSearching(true)
    const q = query.toLowerCase()
    const results = allPosts.filter((post) => {
      const decrypted = decryptedMap.get(post.id)
      if (!decrypted) return false

      const contentMatch = decrypted.content.toLowerCase().includes(q)
      const titleMatch = decrypted.title?.toLowerCase().includes(q)
      const tagMatch = post.tags.some((t) => t.name.toLowerCase().includes(q))

      return contentMatch || titleMatch || tagMatch
    })

    setFilteredPosts(results)
    setSearching(false)
  }, [query, allPosts, decryptedMap])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setAllPosts((prev) => prev.filter((p) => p.id !== deleteId))
      setFilteredPosts((prev) => prev.filter((p) => p.id !== deleteId))
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
      <Header title="Search" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Search input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-null-dim"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decrypted posts..."
            className="w-full bg-null-black border border-null-border rounded pl-10 pr-4 py-2.5 font-terminal text-sm text-null-text placeholder:text-null-dim focus:outline-none focus:border-null-green/50 focus:ring-1 focus:ring-null-green/20 transition-colors"
            autoFocus
          />
        </div>

        <p className="text-xs font-terminal text-null-dim">
          <span className="text-null-green">{">"}</span> Search happens locally
          on decrypted data. Nothing leaves your browser.
        </p>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Decrypting posts for search" />
          </div>
        ) : !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Search size={32} className="text-null-dim" />
            <p className="font-terminal text-null-muted text-sm">
              Type to search across all your posts
            </p>
            <p className="text-null-dim text-xs">
              {allPosts.length} posts indexed
            </p>
          </div>
        ) : searching ? (
          <LoadingSpinner text="Searching" />
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <p className="font-terminal text-null-muted text-sm">
              No results for &quot;{query}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-terminal text-null-dim">
              {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""}
            </p>
            {filteredPosts.map((post) => (
              <PostCard key={post.id} {...post} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete post"
        message="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </>
  )
}
