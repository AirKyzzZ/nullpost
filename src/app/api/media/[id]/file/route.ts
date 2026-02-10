import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { readFile } from "fs/promises"
import path from "path"
import { getDb } from "@/lib/db"
import { media } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads")

export async function GET(
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

    const filePath = path.join(UPLOAD_DIR, basename)
    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": item.mimeType,
        "Content-Length": item.size.toString(),
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const code = error instanceof Error && "code" in error
      ? (error as NodeJS.ErrnoException).code
      : undefined
    if (code === "ENOENT") {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }
    console.error("Serve media error:", error)
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 },
    )
  }
}
