import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow();
    const { title, listId, description } = await req.json();

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    if (!listId) {
      return new NextResponse("List ID is required", { status: 400 });
    }

    const parsedListId = Number.parseInt(listId);
    if (isNaN(parsedListId)) {
      return new NextResponse("Invalid list ID", { status: 400 });
    }

    // ✅ Get list and associated boardId via raw SQL
    const listRes = await db.execute(sql`
      SELECT board_id
      FROM lists
      WHERE id = ${parsedListId}
      LIMIT 1
    `);

    const boardId = listRes.rows[0]?.board_id;

    if (!boardId) {
      return new NextResponse("List not found", { status: 404 });
    }

    // ✅ Raw SQL: check if user has board access (creator or member)
    const result = await db.execute(sql`
      SELECT 1
      FROM boards
      LEFT JOIN board_members ON boards.id = board_members.board_id
      WHERE boards.id = ${boardId}
        AND (
          boards.created_by = ${user.id}
          OR board_members.member_id = ${user.id}
        )
      LIMIT 1
    `);

    const boardAccess = result.rows[0];
    if (!boardAccess) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // ✅ Raw SQL: Get highest card position in list
    const positionRes = await db.execute(sql`
      SELECT position
      FROM cards
      WHERE list_id = ${parsedListId}
      ORDER BY position DESC
      LIMIT 1
    `);

    const highestPosition = Number(positionRes.rows[0]?.position) || 0;

    // ✅ Insert new card using Drizzle ORM (or you can use raw SQL if preferred)
    const insertRes = await db.execute(sql`
      INSERT INTO cards (title, description, list_id, position, created_by)
      VALUES (
        ${title},
        ${description || null},
        ${parsedListId},
        ${highestPosition + 1},
        ${user.id}
      )
      RETURNING *
    `);

    // await db.execute(sql`
    //   INSERT INTO card_members (card_id, member_id)
    //   VALUES (${insertRes.rows[0].id}, ${user.id})
    // `);

    const card = insertRes.rows[0];
    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARDS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
