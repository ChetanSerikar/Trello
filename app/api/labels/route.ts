import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { labels } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"

export async function GET() {
  try {
    await currentUserOrThrow()

    const allLabels = await db.query.labels.findMany({
      orderBy: (labels, { asc }) => [asc(labels.name)],
    })

    return NextResponse.json(allLabels)
  } catch (error) {
    console.error("[LABELS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await currentUserOrThrow()
    const { name, color } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    if (!color) {
      return new NextResponse("Color is required", { status: 400 })
    }

    // Validate color format (e.g., #f97316)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(color)) {
      return new NextResponse("Invalid color format", { status: 400 })
    }

    const label = await db
      .insert(labels)
      .values({
        name,
        color,
      })
      .returning()

    return NextResponse.json(label[0])
  } catch (error) {
    console.error("[LABELS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
