import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ boardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { boardId } = await params;
    const { name } = await req.json();

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // ✅ Check if board exists
    const boardRes = await db.execute(sql`
      SELECT * FROM boards
      WHERE id = ${boardId}
      LIMIT 1
    `);

    const board = boardRes.rows[0];

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    // ✅ Check access: creator or member
    const accessRes = await db.execute(sql`
      SELECT 1
      FROM boards
      LEFT JOIN board_members ON boards.id = board_members.board_id
      WHERE boards.id = ${boardId}
      AND (boards.created_by = ${user.id} OR board_members.member_id = ${user.id})
      LIMIT 1
    `);

    if (accessRes.rows.length === 0) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // ✅ Get the highest list position for the board
    const positionRes = await db.execute(sql`
      SELECT position
      FROM lists
      WHERE board_id = ${boardId}
      ORDER BY position DESC
      LIMIT 1
    `);

    const highestPosition = Number(positionRes.rows[0]?.position) || 0;

    // ✅ Insert new list
    const insertRes = await db.execute(sql`
      INSERT INTO lists (name, board_id, position,created_by )
      VALUES (${name}, ${boardId}, ${highestPosition + 1}, ${user.id})
      RETURNING *
    `);

    return NextResponse.json(insertRes.rows[0]);
  } catch (error) {
    console.error("[LISTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
