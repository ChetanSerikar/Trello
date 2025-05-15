import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cards, lists, boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow()
    const { title, listId, description } = await req.json()

    if (!title) {
      return new NextResponse("Title is required", { status: 400 })
    }

    if (!listId) {
      return new NextResponse("List ID is required", { status: 400 })
    }

    const parsedListId = Number.parseInt(listId)
    if (isNaN(parsedListId)) {
      return new NextResponse("Invalid list ID", { status: 400 })
    }

    const list = await db.query.lists.findFirst({
      where: eq(lists.id, parsedListId),
      with: {
        board: true,
      },
    })

    if (!list) {
      return new NextResponse("List not found", { status: 404 })
    }

    // Check if user has access to the board
    const boardAccess = await db.query.boards.findFirst({
      where: and(eq(boards.id, list.boardId),eq(boards.createdBy, user.id)),
      // where: and(eq(boards.id, list.boardId), or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id))),
    })

    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Get the highest position to add the new card at the end
    const existingCards = await db.query.cards.findMany({
      where: eq(cards.listId, parsedListId),
      orderBy: (cards, { desc }) => [desc(cards.position)],
    })

    const highestPosition = existingCards.length > 0 ? existingCards[0].position : 0

    const card = await db
      .insert(cards)
      .values({
        title,
        description: description || null,
        listId: parsedListId,
        position: highestPosition + 1,
        createdBy: user.id,
      })
      .returning()

    return NextResponse.json(card[0])
  } catch (error) {
    console.error("[CARDS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
