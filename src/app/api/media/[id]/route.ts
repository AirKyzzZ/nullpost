import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { unlink } from "fs/promises"
import path from "path"
import { getDb } from "@/lib/db"
import { media } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads")

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const db = getDb()

    const result = await db
      .select()
      .from(media)
      .where(and(eq(media.id, id), eq(media.userId, user.id)))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    const item = result[0]
    const basename = path.basename(item.storagePath)
    if (basename !== item.storagePath) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    try {
      await unlink(path.join(UPLOAD_DIR, basename))
    } catch (err: unknown) {
      const code = err instanceof Error && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : undefined
      if (code !== "ENOENT") {
        console.error(`[media] Failed to delete file: ${basename}`, err)
      }
    }

    await db.delete(media).where(and(eq(media.id, id), eq(media.userId, user.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete media error:", error)
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 },
    )
  }
}
