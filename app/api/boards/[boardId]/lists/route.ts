import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { boards, boardMembers, lists } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function POST(req: Request,  { params }: {params: Promise<{ boardId: number }> }) {
  try {

    const user = await currentUserOrThrow()
     let { boardId  } = await params
    const { name } = await req.json()

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const board = await db.query.boards.findFirst({
      // where: and(eq(boards.id, boardId), or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id))),
      where: and(eq(boards.id, boardId), eq(boards.createdBy, user.id)),
    })

    if (!board) {
      return new NextResponse("Board not found", { status: 404 })
    }

    // Get the highest position to add the new list at the end
    const existingLists = await db.query.lists.findMany({
      where: eq(lists.boardId, boardId),
      orderBy: (lists, { desc }) => [desc(lists.position)],
    })

    const highestPosition = existingLists.length > 0 ? existingLists[0].position : 0

    const list = await db
      .insert(lists)
      .values({
        name,
        boardId,
        position: highestPosition + 1,
      })
      .returning()

    return NextResponse.json(list[0])
  } catch (error) {
    console.error("[LISTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
