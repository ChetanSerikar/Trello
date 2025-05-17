import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;
    const { memberId } = await req.json();

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 });
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

    const isBoardMemberRes = await db.execute(sql`
      SELECT 1 FROM board_members
      WHERE board_id = ${card.board_id} AND member_id = ${user.id}
      LIMIT 1
    `);
    const isCreator = board.created_by === user.id;
    const isBoardMember = !!isBoardMemberRes.rows[0];

    if (!isCreator && !isBoardMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const memberRes = await db.execute(sql`
      SELECT * FROM users WHERE id = ${memberId}
    `);
    if (!memberRes.rows[0]) {
      return new NextResponse("Member not found", { status: 404 });
    }

    const existingMember = await db.execute(sql`
      SELECT * FROM card_members
      WHERE card_id = ${cardId} AND member_id = ${memberId}
    `);
    if (existingMember.rows[0]) {
      return new NextResponse("Member already assigned to card", { status: 400 });
    }

    const insertRes = await db.execute(sql`
      INSERT INTO card_members (card_id, member_id)
      VALUES (${cardId}, ${memberId})
      RETURNING *
    `);

    return NextResponse.json(insertRes.rows[0]);
  } catch (error) {
    console.error("[CARD_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 });
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

    const isBoardMemberRes = await db.execute(sql`
      SELECT 1 FROM board_members
      WHERE board_id = ${card.board_id} AND member_id = ${user.id}
      LIMIT 1
    `);
    const isCreator = board.created_by === user.id;
    const isBoardMember = !!isBoardMemberRes.rows[0];

    if (!isCreator && !isBoardMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await db.execute(sql`
      DELETE FROM card_members
      WHERE card_id = ${cardId} AND member_id = ${memberId}
    `);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CARD_MEMBERS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
