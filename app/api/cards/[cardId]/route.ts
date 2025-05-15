import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cards, lists, boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function GET(req: Request, { params }: {params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
    const { cardId }  = await params

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 })
    }

    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: {
        list: {
          with: {
            board: true,
          },
        },
        creator: true,
        labels: {
          with: {
            label: true,
          },
        },
        members: {
          with: {
            member: true,
          },
        },
      },
    })

    if (!card) {
      return new NextResponse("Card not found", { status: 404 })
    }

    // Check if user has access to the board
    const boardAccess = await db.query.boards.findFirst({
      where: and(
        eq(boards.id, card.list.boardId),
        or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id)),
      ),
    })

    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error("[CARD_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: {params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
    const { cardId }  = await params
    const { title, description, listId, position, dueDate } = await req.json()

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 })
    }

    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: {
        list: {
          with: {
            board: true,
          },
        },
      },
    })

    if (!card) {
      return new NextResponse("Card not found", { status: 404 })
    }

    // Check if user has access to the board
    const boardAccess = await db.query.boards.findFirst({
      where: and(
        eq(boards.id, card.list.boardId),
        eq(boards.createdBy, user.id),
        // or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id)),
      ),
    })

    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const updateData: Partial<typeof cards.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) {
      updateData.title = title
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (position !== undefined) {
      updateData.position = position
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    if (listId !== undefined) {
      const parsedListId = Number.parseInt(listId)
      if (isNaN(parsedListId)) {
        return new NextResponse("Invalid list ID", { status: 400 })
      }

      // Verify the list belongs to the same board
      const list = await db.query.lists.findFirst({
        where: eq(lists.id, parsedListId),
      })

      if (!list || list.boardId !== card.list.boardId) {
        return new NextResponse("Invalid list ID", { status: 400 })
      }

      updateData.listId = parsedListId
    }

    const updatedCard = await db.update(cards).set(updateData).where(eq(cards.id, cardId)).returning()

    return NextResponse.json(updatedCard[0])
  } catch (error) {
    console.error("[CARD_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: {params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
   const { cardId }  = await params

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 })
    }

    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: {
        list: {
          with: {
            board: true,
          },
        },
      },
    })

    if (!card) {
      return new NextResponse("Card not found", { status: 404 })
    }

    // Check if user has access to the board
    const boardAccess = await db.query.boards.findFirst({
      where: and(
        eq(boards.id, card.list.boardId),
        or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id)),
      ),
    })

    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    await db.delete(cards).where(eq(cards.id, cardId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[CARD_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
