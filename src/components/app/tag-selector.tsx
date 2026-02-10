"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { TagBadge } from "@/components/ui/tag-badge"
import { toast } from "@/components/ui/toast"

type Tag = {
  id: string
  name: string
  color: string
}

type TagSelectorProps = {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
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

export function TagSelector({ selectedTagIds, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags")
      const data = await res.json()
      if (data.tags) setAllTags(data.tags)
    } catch {
      // tags will be empty
    }
  }

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTagIds, tagId])
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    setCreating(true)

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error || "Failed to create tag", "error")
        return
      }

      const tag = await res.json()
      setAllTags((prev) => [...prev, tag])
      onTagsChange([...selectedTagIds, tag.id])
      setNewTagName("")
      setShowCreate(false)
    } catch {
      toast("Failed to create tag", "error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-terminal text-null-muted uppercase tracking-wider">
        Tags
      </label>

      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            active={selectedTagIds.includes(tag.id)}
            onClick={() => toggleTag(tag.id)}
          />
        ))}

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-terminal text-xs text-null-dim border border-dashed border-null-dim hover:border-null-muted hover:text-null-muted transition-colors cursor-pointer"
        >
          <Plus size={10} />
          new
        </button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 mt-2">
          <input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="tag name"
            className="flex-1 bg-null-black border border-null-border rounded px-2 py-1 font-terminal text-xs text-null-text placeholder:text-null-dim focus:outline-none focus:border-null-green/50"
            onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
            autoFocus
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewTagColor(color)}
                className="w-4 h-4 rounded-full cursor-pointer transition-transform"
                style={{
                  backgroundColor: color,
                  transform: newTagColor === color ? "scale(1.3)" : "scale(1)",
                  boxShadow: newTagColor === color ? `0 0 6px ${color}` : "none",
                }}
              />
            ))}
          </div>
          <button
            onClick={handleCreateTag}
            disabled={creating || !newTagName.trim()}
            className="font-terminal text-xs text-null-green hover:text-null-green/80 disabled:opacity-40 cursor-pointer"
          >
            {creating ? "..." : "add"}
          </button>
        </div>
      )}
    </div>
  )
}
