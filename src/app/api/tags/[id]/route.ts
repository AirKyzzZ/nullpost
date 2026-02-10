import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { tags } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()
    const db = getDb()

    const existing = await db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    const updates: Record<string, string> = {}
    if (body.name) updates.name = body.name.trim().toLowerCase()
    if (body.color) updates.color = body.color

    await db.update(tags).set(updates).where(eq(tags.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update tag error:", error)
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth()
    const { id } = await params
    const db = getDb()

    await db.delete(tags).where(eq(tags.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete tag error:", error)
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}
