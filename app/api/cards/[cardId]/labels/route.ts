import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";
import { sql } from "drizzle-orm";

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

    const parsedLabelId = Number(labelId);
    if (isNaN(parsedLabelId)) {
      return new NextResponse("Invalid label ID", { status: 400 });
    }

    const cardRes = await db.execute(sql`
      SELECT c.*, l.board_id
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE c.id = ${cardId}
    `);
    const card = cardRes.rows[0];
    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const boardRes = await db.execute(sql`
      SELECT * FROM boards WHERE id = ${card.board_id}
    `);
    const board = boardRes.rows[0];
    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const memberCheck = await db.execute(sql`
      SELECT 1 FROM board_members
      WHERE board_id = ${card.board_id} AND member_id = ${user.id}
      LIMIT 1
    `);
    const isCreator = board.created_by === user.id;
    const isBoardMember = !!memberCheck.rows[0];

    if (!isCreator && !isBoardMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const labelCheck = await db.execute(sql`
      SELECT * FROM labels WHERE id = ${parsedLabelId}
    `);
    if (!labelCheck.rows[0]) {
      return new NextResponse("Label not found", { status: 404 });
    }

    const existing = await db.execute(sql`
      SELECT * FROM card_labels
      WHERE card_id = ${cardId} AND label_id = ${parsedLabelId}
    `);
    if (existing.rows[0]) {
      return new NextResponse("Label already assigned to card", { status: 400 });
    }

    const insertRes = await db.execute(sql`
      INSERT INTO card_labels (card_id, label_id)
      VALUES (${cardId}, ${parsedLabelId})
      RETURNING *
    `);

    return NextResponse.json(insertRes.rows[0]);
  } catch (error) {
    console.error("[CARD_LABELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;
    const { searchParams } = new URL(req.url);
    const labelId = searchParams.get("labelId");

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    if (!labelId) {
      return new NextResponse("Label ID is required", { status: 400 });
    }

    const parsedLabelId = Number(labelId);
    if (isNaN(parsedLabelId)) {
      return new NextResponse("Invalid label ID", { status: 400 });
    }

    const cardRes = await db.execute(sql`
      SELECT c.*, l.board_id
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE c.id = ${cardId}
    `);
    const card = cardRes.rows[0];
    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const boardRes = await db.execute(sql`
      SELECT * FROM boards WHERE id = ${card.board_id}
    `);
    const board = boardRes.rows[0];
    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const memberCheck = await db.execute(sql`
      SELECT 1 FROM board_members
      WHERE board_id = ${card.board_id} AND member_id = ${user.id}
      LIMIT 1
    `);
    const isCreator = board.created_by === user.id;
    const isBoardMember = !!memberCheck.rows[0];

    if (!isCreator && !isBoardMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await db.execute(sql`
      DELETE FROM card_labels
      WHERE card_id = ${cardId} AND label_id = ${parsedLabelId}
    `);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CARD_LABELS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
