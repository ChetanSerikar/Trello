import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { eq, or, and , sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const user = await currentUserOrThrow()
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

const userBoards = await db.execute(sql`
  SELECT b.*
  FROM boards b
  WHERE b.created_by = ${user.id} 
  ${workspaceId ? sql`AND b.workspace_id = ${workspaceId}` : sql``}
  ORDER BY b.created_at DESC
`);
    return NextResponse.json(userBoards.rows)
  } catch (error) {
    console.error("[BOARDS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow()
    const { name, workspaceId } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    if (!workspaceId) {
      return new NextResponse("Workspace ID is required", { status: 400 })
    }

    const parsedWorkspaceId = Number.parseInt(workspaceId)
    if (isNaN(parsedWorkspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 })
    }

    const board = await db
      .insert(boards)
      .values({
        name,
        workspaceId: parsedWorkspaceId,
        createdBy: user.id,
      })
      .returning()

    return NextResponse.json(board[0])
  } catch (error) {
    console.error("[BOARDS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
