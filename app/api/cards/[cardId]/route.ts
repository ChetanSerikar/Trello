import { currentUserOrThrow } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"


export async function GET(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    const result = await db.execute(sql`
      SELECT c.*, l.board_id, u.name as creator_name
      FROM cards c, users u
      JOIN lists l ON c.list_id = l.id
      LEFT JOIN card_members cm ON cm.member_id = u.id
      WHERE c.id = ${cardId}
    `);

    const card = result.rows?.[0];

    console.log("cards",card);

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    // ✅ Board access check
    const accessCheck = await db.execute(sql`
      SELECT 1
      FROM boards
      LEFT JOIN board_members ON boards.id = board_members.board_id
      WHERE boards.id = ${card.board_id}
        AND (
          boards.created_by = ${user.id}
          OR board_members.member_id = ${user.id}
        )
      LIMIT 1
    `);

    if (!accessCheck.rows?.[0]) {
      return new NextResponse("Unauthorized", { status: 403 });
    }


    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function PATCH(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;
    const { title, description, listId, position, dueDate } = await req.json();

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    const cardRes = await db.execute(sql`
      SELECT c.*, l.board_id
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE c.id = ${cardId}
    `);

    const card = cardRes.rows?.[0];
    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const accessCheck = await db.execute(sql`
      SELECT 1
      FROM boards
      LEFT JOIN board_members ON boards.id = board_members.board_id
      WHERE boards.id = ${card.board_id}
        AND (
          boards.created_by = ${user.id}
          OR board_members.member_id = ${user.id}
        )
      LIMIT 1
    `);

    if (!accessCheck.rows?.[0]) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (listId !== undefined) {
      const parsedListId = Number.parseInt(listId);
      if (isNaN(parsedListId)) {
        return new NextResponse("Invalid list ID", { status: 400 });
      }

      const listCheck = await db.execute(sql`
        SELECT * FROM lists
        WHERE id = ${parsedListId} AND board_id = ${card.board_id}
      `);

      if (!listCheck.rows?.[0]) {
        return new NextResponse("Invalid list ID", { status: 400 });
      }
    }

    const updateParts = [];
    if (title !== undefined) updateParts.push(sql`title = ${title}`);
    if (description !== undefined) updateParts.push(sql`description = ${description}`);
    if (listId !== undefined) updateParts.push(sql`list_id = ${Number(listId)}`);
    if (position !== undefined) updateParts.push(sql`position = ${position}`);
    if (dueDate !== undefined) updateParts.push(sql`due_date = ${dueDate ? new Date(dueDate) : null}`);
    updateParts.push(sql`updated_at = ${new Date()}`);

    const result = await db.execute(sql`
      UPDATE cards
      SET ${sql.join(updateParts, sql`, `)}
      WHERE id = ${cardId}
      RETURNING *
    `);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("[CARD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(req: Request, { params }: { params: Promise<{ cardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { cardId } = await params;

    if (isNaN(cardId)) {
      return new NextResponse("Invalid card ID", { status: 400 });
    }

    const cardRes = await db.execute(sql`
      SELECT c.*, l.board_id
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE c.id = ${cardId}
    `);

    const card = cardRes.rows?.[0];
    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const accessCheck = await db.execute(sql`
      SELECT 1
      FROM boards
      LEFT JOIN board_members ON boards.id = board_members.board_id
      WHERE boards.id = ${card.board_id}
        AND (
          boards.created_by = ${user.id}
          OR board_members.member_id = ${user.id}
        )
      LIMIT 1
    `);

    if (!accessCheck.rows?.[0]) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await db.execute(sql`DELETE FROM cards WHERE id = ${cardId}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CARD_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

