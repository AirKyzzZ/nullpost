import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db"
import { tags } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

export async function GET() {
  try {
    await requireAuth()
    const db = getDb()
    const result = await db.select().from(tags).orderBy(tags.name)
    return NextResponse.json({ tags: result })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("List tags error:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { name, color = "#00ff41" } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 })
    }

    const db = getDb()
    const id = nanoid()

    await db.insert(tags).values({
      id,
      name: name.trim().toLowerCase(),
      color,
    })

    return NextResponse.json({ id, name: name.trim().toLowerCase(), color }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 })
    }
    console.error("Create tag error:", error)
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
  }
}
