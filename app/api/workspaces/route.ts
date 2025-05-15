import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { workspaces } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const user = await currentUserOrThrow()

    const userWorkspaces = await db.query.workspaces.findMany({
      where: eq(workspaces.ownerId, user.id),
      orderBy: (workspaces, { desc }) => [desc(workspaces.createdAt)],
    })

    return NextResponse.json(userWorkspaces)
  } catch (error) {
    console.error("[WORKSPACES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow()
    const { name } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const workspace = await db
      .insert(workspaces)
      .values({
        name,
        ownerId: user.id,
      })
      .returning()

    return NextResponse.json(workspace[0])
  } catch (error) {
    console.error("[WORKSPACES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
