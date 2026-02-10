"use client"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useKeyStore } from "@/lib/crypto/key-store"
import { encrypt } from "@/lib/crypto"
import { toast } from "@/components/ui/toast"

type UploadedMedia = {
  id: string
  mimeType: string
  size: number
}

type MediaUploadProps = {
  onUpload: (media: UploadedMedia) => void
  compact?: boolean
}

export function MediaUpload({ onUpload, compact = false }: MediaUploadProps) {
  const cryptoKey = useKeyStore((s) => s.cryptoKey)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cryptoKey) return

    setUploading(true)

    try {
      const { ciphertext, iv } = await encrypt(cryptoKey, file.name)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("encryptedFilename", ciphertext)
      formData.append("filenameIv", iv)

      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Upload failed")

      onUpload({ id: data.id, mimeType: data.mimeType, size: data.size })
      toast("File uploaded", "success")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload failed", "error")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant={compact ? "ghost" : "primary"}
        size={compact ? "sm" : "md"}
        onClick={() => fileInputRef.current?.click()}
        loading={uploading}
        disabled={!cryptoKey}
      >
        <Upload size={compact ? 12 : 14} />
        {compact ? "Attach" : "Upload file"}
      </Button>
    </>
  )
}
