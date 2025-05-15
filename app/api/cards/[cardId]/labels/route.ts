import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cards, cardLabels, labels, boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function POST(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;
    const { labelId } = await req.json();

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    if (!labelId) {
      return new NextResponse("Label ID is required", { status: 400 });
    }

    const parsedLabelId = Number.parseInt(labelId);
    if (isNaN(parsedLabelId)) {
      return new NextResponse("Invalid label ID", { status: 400 });
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
    });

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const boardId = card.list.boardId;

    // Check if user is the board owner
    const isBoardOwner = await db.query.boards.findFirst({
      where: and(
        eq(boards.id, boardId),
        eq(boards.createdBy, user.id)
      ),
    });

    let hasAccess = false;

    if (isBoardOwner) {
      hasAccess = true;
    } else {
      // Check if user is a board member
      const isBoardMember = await db.query.boardMembers.findFirst({
        where: and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.memberId, user.id)
        ),
      });

      if (isBoardMember) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if label exists
    const label = await db.query.labels.findFirst({
      where: eq(labels.id, parsedLabelId),
    });

    if (!label) {
      return new NextResponse("Label not found", { status: 404 });
    }

    // Check if the label is already assigned to the card
    const existingCardLabel = await db.query.cardLabels.findFirst({
      where: and(
        eq(cardLabels.cardId, cardId),
        eq(cardLabels.labelId, parsedLabelId)
      ),
    });

    if (existingCardLabel) {
      return new NextResponse("Label already assigned to card", { status: 400 });
    }

    const cardLabel = await db
      .insert(cardLabels)
      .values({
        cardId,
        labelId: parsedLabelId,
      })
      .returning();

    return NextResponse.json(cardLabel[0]);
  } catch (error) {
    console.error("[CARD_LABELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: {params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
     const { cardId }  = await params
    const { searchParams } = new URL(req.url)
    const labelId = searchParams.get("labelId")

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 })
    }

    if (!labelId) {
      return new NextResponse("Label ID is required", { status: 400 })
    }

    const parsedLabelId = Number.parseInt(labelId)
    if (isNaN(parsedLabelId)) {
      return new NextResponse("Invalid label ID", { status: 400 })
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

    await db.delete(cardLabels).where(and(eq(cardLabels.cardId, cardId), eq(cardLabels.labelId, parsedLabelId)))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[CARD_LABELS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
