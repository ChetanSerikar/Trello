import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { workspaces } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq } from "drizzle-orm"

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await currentUserOrThrow()
    const workspaceId = Number.parseInt(params.workspaceId)

    if (isNaN(workspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 })
    }

    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, user.id)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error("[WORKSPACE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await currentUserOrThrow()
    const workspaceId = Number.parseInt(params.workspaceId)
    const { name } = await req.json()

    if (isNaN(workspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, user.id)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 })
    }

    const updatedWorkspace = await db
      .update(workspaces)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning()

    return NextResponse.json(updatedWorkspace[0])
  } catch (error) {
    console.error("[WORKSPACE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const user = await currentUserOrThrow()
    const workspaceId = Number.parseInt(params.workspaceId)

    if (isNaN(workspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 })
    }

    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, user.id)),
    })

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 })
    }

    await db.delete(workspaces).where(eq(workspaces.id, workspaceId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[WORKSPACE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
