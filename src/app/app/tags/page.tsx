"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { Header } from "@/components/app/header"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/toast"

type Tag = {
  id: string
  name: string
  color: string
}

const TAG_COLORS = [
  "#00ff41",
  "#00d4ff",
  "#8b5cf6",
  "#ff0040",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#6366f1",
]

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(TAG_COLORS[0])
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags")
      const data = await res.json()
      if (data.tags) setTags(data.tags)
    } catch {
      toast("Failed to load tags", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      const tag = await res.json()
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName("")
      setShowCreate(false)
      toast("Tag created", "success")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to create tag", "error")
    } finally {
      setCreating(false)
    }
  }

  function startEdit(tag: Tag) {
    setEditId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  async function handleEdit() {
    if (!editId || !editName.trim()) return
    try {
      const res = await fetch(`/api/tags/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      })
      if (!res.ok) throw new Error("Failed to update")
      setTags((prev) =>
        prev
          .map((t) =>
            t.id === editId
              ? { ...t, name: editName.trim().toLowerCase(), color: editColor }
              : t,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setEditId(null)
      toast("Tag updated", "success")
    } catch {
      toast("Failed to update tag", "error")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tags/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setTags((prev) => prev.filter((t) => t.id !== deleteId))
      toast("Tag deleted", "success")
    } catch {
      toast("Failed to delete tag", "error")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Header title="Tags" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="font-terminal text-xs text-null-dim">
            {tags.length} tag{tags.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus size={14} />
            New tag
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="p-4 border border-null-green/20 rounded bg-null-surface/50 space-y-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tag name"
              className="w-full bg-null-black border border-null-border rounded px-3 py-2 font-terminal text-sm text-null-text placeholder:text-null-dim focus:outline-none focus:border-null-green/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-terminal text-null-muted">Color:</span>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className="w-5 h-5 rounded-full cursor-pointer transition-transform"
                  style={{
                    backgroundColor: color,
                    transform: newColor === color ? "scale(1.3)" : "scale(1)",
                    boxShadow: newColor === color ? `0 0 8px ${color}` : "none",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} loading={creating}>
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner text="Loading tags" />
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="font-terminal text-null-dim text-4xl">{"#_"}</div>
            <p className="font-terminal text-null-muted text-sm">No tags yet</p>
            <p className="text-null-dim text-xs">
              Create tags to organize your posts.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded border border-null-border hover:border-null-dim transition-colors group"
              >
                {editId === tag.id ? (
                  <>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className="w-4 h-4 rounded-full cursor-pointer transition-transform"
                            style={{
                              backgroundColor: color,
                              transform:
                                editColor === color ? "scale(1.3)" : "scale(1)",
                              boxShadow:
                                editColor === color ? `0 0 6px ${color}` : "none",
                            }}
                          />
                        ))}
                      </div>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-null-black border border-null-border rounded px-2 py-1 font-terminal text-xs text-null-text focus:outline-none focus:border-null-green/50"
                        onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleEdit}
                      className="text-null-green hover:text-null-green/80 cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-null-muted hover:text-null-text cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span
                      className="font-terminal text-sm flex-1"
                      style={{ color: tag.color }}
                    >
                      {tag.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(tag)}
                        className="p-1 rounded text-null-muted hover:text-null-cyan hover:bg-null-cyan/10 transition-colors cursor-pointer"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteId(tag.id)}
                        className="p-1 rounded text-null-muted hover:text-null-red hover:bg-null-red/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete tag"
        message="This will remove the tag from all posts. The posts themselves will not be deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </>
  )
}
