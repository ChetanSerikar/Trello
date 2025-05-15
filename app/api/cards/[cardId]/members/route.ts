import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cards, cardMembers, users, boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function POST(req: Request, { params }: {params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
    const { cardId }  = await params
    const { memberId } = await req.json()

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 })
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 })
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

    // Check if member exists
    const member = await db.query.users.findFirst({
      where: eq(users.id, memberId),
    })

    if (!member) {
      return new NextResponse("Member not found", { status: 404 })
    }

    // Check if the member is already assigned to the card
    const existingCardMember = await db.query.cardMembers.findFirst({
      where: and(eq(cardMembers.cardId, cardId), eq(cardMembers.memberId, memberId)),
    })

    if (existingCardMember) {
      return new NextResponse("Member already assigned to card", { status: 400 })
    }

    const cardMember = await db
      .insert(cardMembers)
      .values({
        cardId,
        memberId,
      })
      .returning()

    return NextResponse.json(cardMember[0])
  } catch (error) {
    console.error("[CARD_MEMBERS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: {params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
    const { cardId }  = await params
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get("memberId")

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 })
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 })
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

    await db.delete(cardMembers).where(and(eq(cardMembers.cardId, cardId), eq(cardMembers.memberId, memberId)))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[CARD_MEMBERS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
