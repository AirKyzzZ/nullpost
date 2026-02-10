"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Image as ImageIcon,
  Music,
  Film,
  Trash2,
  Link as LinkIcon,
} from "lucide-react"
import { Header } from "@/components/app/header"
import { MediaUpload } from "@/components/app/media-upload"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useKeyStore } from "@/lib/crypto/key-store"
import { decrypt } from "@/lib/crypto"
import { toast } from "@/components/ui/toast"
import { formatRelativeDate, formatFileSize } from "@/lib/format"

type MediaItem = {
  id: string
  postId: string | null
  encryptedFilename: string
  filenameIv: string
  mimeType: string
  size: number
  createdAt: string
}

type DecryptedMediaItem = MediaItem & {
  filename: string
}

export default function MediaPage() {
  const cryptoKey = useKeyStore((s) => s.cryptoKey)
  const isUnlocked = useKeyStore((s) => s.isUnlocked)

  const [items, setItems] = useState<DecryptedMediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/media")
      const data = await res.json()
      if (!data.media || !cryptoKey) return

      const decrypted = await Promise.all(
        data.media.map(async (item: MediaItem) => {
          try {
            const filename = await decrypt(
              cryptoKey,
              item.encryptedFilename,
              item.filenameIv,
            )
            return { ...item, filename }
          } catch {
            return { ...item, filename: "encrypted_file" }
          }
        }),
      )

      setItems(decrypted)
    } catch {
      toast("Failed to load media", "error")
    } finally {
      setLoading(false)
    }
  }, [cryptoKey])

  useEffect(() => {
    if (isUnlocked) fetchMedia()
  }, [isUnlocked, fetchMedia])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/media/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setItems((prev) => prev.filter((m) => m.id !== deleteId))
      toast("File deleted", "success")
    } catch {
      toast("Failed to delete file", "error")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  function handleUpload(_uploaded: { id: string; mimeType: string; size: number }) {
    fetchMedia()
  }

  function MediaIcon({ mimeType }: { mimeType: string }) {
    if (mimeType.startsWith("image/")) return <ImageIcon size={32} className="text-null-cyan" />
    if (mimeType.startsWith("audio/")) return <Music size={32} className="text-null-purple" />
    return <Film size={32} className="text-null-green" />
  }

  return (
    <>
      <Header title="Media" />
      <div className="p-6">
        {!isUnlocked ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-terminal text-null-muted text-sm animate-pulse">
              Waiting for decryption...
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner text="Loading media" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <MediaUpload onUpload={handleUpload} />
              <span className="font-terminal text-xs text-null-dim">
                {items.length} file{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Grid */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="font-terminal text-null-dim text-6xl">
                  <ImageIcon size={64} strokeWidth={1} />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-terminal text-null-muted text-sm">
                    No media yet
                  </p>
                  <p className="text-null-dim text-xs">
                    Upload images, audio, or video files.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group border border-null-border rounded-lg bg-null-surface/50 overflow-hidden hover:border-null-dim transition-colors"
                  >
                    {/* Preview */}
                    <div className="aspect-square bg-null-black flex items-center justify-center overflow-hidden">
                      {item.mimeType.startsWith("image/") ? (
                        <img
                          src={`/api/media/${item.id}/file`}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <MediaIcon mimeType={item.mimeType} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-1.5">
                      <p className="font-terminal text-xs text-null-text truncate">
                        {item.filename}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-terminal text-null-dim">
                        <span>{formatFileSize(item.size)}</span>
                        <span>{"·"}</span>
                        <span>{formatRelativeDate(item.createdAt)}</span>
                        {item.postId && (
                          <>
                            <span>{"·"}</span>
                            <span className="inline-flex items-center gap-1 text-null-cyan">
                              <LinkIcon size={10} />
                              linked
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-terminal text-null-muted hover:text-null-red hover:bg-null-red/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete file"
        message="This will permanently delete the file from storage."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </>
  )
}
