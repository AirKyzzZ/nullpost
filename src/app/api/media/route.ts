import { NextRequest, NextResponse } from "next/server"
import { eq, desc } from "drizzle-orm"
import { nanoid } from "nanoid"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { getDb } from "@/lib/db"
import { media } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads")

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/ogg",
]

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "audio/mpeg": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "audio/webm": ".weba",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const formData = await request.formData()

    const file = formData.get("file") as File | null
    const encryptedFilename = formData.get("encryptedFilename") as string | null
    const filenameIv = formData.get("filenameIv") as string | null

    if (!file || !encryptedFilename || !filenameIv) {
      return NextResponse.json(
        { error: "File, encrypted filename, and IV are required" },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      )
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const ext = EXT_MAP[file.type] || ""
    const storageFilename = `${nanoid()}${ext}`
    const storagePath = path.join(UPLOAD_DIR, storageFilename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(storagePath, buffer)

    const db = getDb()
    const id = nanoid()

    try {
      await db.insert(media).values({
        id,
        postId: null,
        userId: user.id,
        encryptedFilename,
        filenameIv,
        storagePath: storageFilename,
        mimeType: file.type,
        size: file.size,
        iv: filenameIv,
      })
    } catch (dbError) {
      try { await unlink(storagePath) } catch { /* best effort cleanup */ }
      throw dbError
    }

    return NextResponse.json(
      { id, mimeType: file.type, size: file.size },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload media error:", error)
    return NextResponse.json(
      { error: "Failed to upload" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const { user } = await requireAuth()
    const db = getDb()

    const result = await db
      .select()
      .from(media)
      .where(eq(media.userId, user.id))
      .orderBy(desc(media.createdAt))

    return NextResponse.json({ media: result })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("List media error:", error)
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 },
    )
  }
}
