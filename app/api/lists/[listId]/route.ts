import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lists, boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function PATCH(req: Request, { params }: { params:  Promise<{ listId: number }>} ) {
  try {
    const user = await currentUserOrThrow()
    const { listId } = await params
    const { name, position } = await req.json()

    if (isNaN(listId)) {
      return new NextResponse("Invalid list ID", { status: 400 })
    }

    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
      with: {
        board: true,
      },
    })

    if (!list) {
      return new NextResponse("List not found", { status: 404 })
    }

    // Check if user has access to the board
    const boardAccess = await db.query.boards.findFirst({
      where: and(eq(boards.id, list.boardId), or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id))),
    })

    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const updateData: Partial<typeof lists.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) {
      updateData.name = name
    }

    if (position !== undefined) {
      updateData.position = position
    }

    const updatedList = await db.update(lists).set(updateData).where(eq(lists.id, listId)).returning()

    return NextResponse.json(updatedList[0])
  } catch (error) {
    console.error("[LIST_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: {params:  Promise<{ listId: number }> }) {
  try {
    const user = await currentUserOrThrow()
    const { listId } = await params

    if (isNaN(listId)) {
      return new NextResponse("Invalid list ID", { status: 400 })
    }

    const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
      with: {
        board: true,
      },
    })

    if (!list) {
      return new NextResponse("List not found", { status: 404 })
    }

    // Check if user has access to the board
    const boardAccess = await db.query.boards.findFirst({
      where: and(eq(boards.id, list.boardId), or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id))),
    })

    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    await db.delete(lists).where(eq(lists.id, listId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[LIST_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
