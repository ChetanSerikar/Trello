import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ boardId: string }> }) {
  try {
    const user = await currentUserOrThrow();
    const { boardId: strBoardId } = await params;
    const boardId = parseInt(strBoardId);

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    // Get the board
    const boardRes = await db.execute(sql`
      SELECT * FROM boards WHERE id = ${boardId}
    `);
    const board = boardRes.rows[0];

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    if (board.created_by !== user.id) {
      return new NextResponse("Only the board creator can view available members", { status: 403 });
    }

    // Get current member IDs of the board
    const currentMembersRes = await db.execute(sql`
      SELECT member_id FROM board_members WHERE board_id = ${boardId}
    `);

    const currentMemberIds = currentMembersRes.rows.map((row) => `'${row.member_id}'`);

    let availableUsersRes;

    if (currentMemberIds.length > 0) {
      // Safely quote and join UUIDs or strings
      const idsSql = sql.raw(currentMemberIds.join(", "));
      availableUsersRes = await db.execute(sql`
        SELECT * FROM users
        WHERE id NOT IN (${idsSql})
      `);
    } else {
      // No members yet, get all users except the creator
      availableUsersRes = await db.execute(sql`
        SELECT * FROM users
        WHERE id != ${board.created_by}
      `);
    }

    return NextResponse.json(availableUsersRes.rows);
  } catch (error) {
    console.error("[AVAILABLE_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
