import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";

// GET: Get all members of a board
export async function GET(req: Request, { params }: { params:  Promise<{ boardId: string }> }) {
  try {
    const user = await currentUserOrThrow();
    let { boardId : strBoardId  } = await params
    let boardId = parseInt(strBoardId);

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    // Check if board exists
    const boardRes = await db.execute(sql`SELECT * FROM boards WHERE id = ${boardId}`);
    const board = boardRes.rows[0];

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    // Check if user is creator or a member
    const memberRes = await db.execute(sql`
      SELECT * FROM board_members
      WHERE board_id = ${boardId} AND member_id = ${user.id}
    `);

    const isCreator = board.created_by === user.id;
    const isMember = memberRes.rows.length > 0;

    if (!isCreator && !isMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Fetch members with user details
    const membersRes = await db.execute(sql`
      SELECT users.*
      FROM board_members
      JOIN users ON users.id = board_members.member_id
      WHERE board_members.board_id = ${boardId}
    `);


    return NextResponse.json(membersRes.rows);
  } catch (error) {
    console.error("[BOARD_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Add a member to a board
export async function POST(req: Request, { params }: { params:  Promise<{ boardId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    let { boardId } = await params

    const { memberId } = await req.json();

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 });
    }

    // Get board and verify creator
    const boardRes = await db.execute(sql`SELECT * FROM boards WHERE id = ${boardId}`);
    const board = boardRes.rows[0];

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    if (board.created_by !== user.id) {
      return new NextResponse("Only the board creator can add members", { status: 403 });
    }

    // Check if user exists
    const userRes = await db.execute(sql`SELECT * FROM users WHERE id = ${memberId}`);
    if (userRes.rows.length === 0) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if already a member
    const memberRes = await db.execute(sql`
      SELECT * FROM board_members WHERE board_id = ${boardId} AND member_id = ${memberId}
    `);
    if (memberRes.rows.length > 0) {
      return new NextResponse("User is already a member of this board", { status: 400 });
    }

    // Insert new member
    await db.execute(sql`
      INSERT INTO board_members (board_id, member_id)
      VALUES (${boardId}, ${memberId})
    `);

    // Return member details
    const newMemberRes = await db.execute(sql`
      SELECT users.*
      FROM board_members
      JOIN users ON users.id = board_members.member_id
      WHERE board_members.board_id = ${boardId} AND board_members.member_id = ${memberId}
    `);

    return NextResponse.json(newMemberRes.rows[0]);
  } catch (error) {
    console.error("[BOARD_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE: Remove a member from a board
export async function DELETE(req: Request, { params }: { params:Promise<{ boardId: string }> }) {
  try {
    const user = await currentUserOrThrow();
    let { boardId : strBoardId  } = await params
    let boardId = parseInt(strBoardId);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID is required", { status: 400 });
    }

    // Get board and verify creator
    const boardRes = await db.execute(sql`SELECT * FROM boards WHERE id = ${boardId}`);
    const board = boardRes.rows[0];

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    if (board.created_by !== user.id) {
      return new NextResponse("Only the board creator can remove members", { status: 403 });
    }

    // Prevent removing the creator
    if (memberId === board.created_by.toString()) {
      return new NextResponse("Cannot remove the board creator", { status: 400 });
    }

    // Check if member exists
    const memberRes = await db.execute(sql`
      SELECT * FROM board_members
      WHERE board_id = ${boardId} AND member_id = ${memberId}
    `);

    if (memberRes.rows.length === 0) {
      return new NextResponse("User is not a member of this board", { status: 404 });
    }

    // Delete member
    await db.execute(sql`
      DELETE FROM board_members
      WHERE board_id = ${boardId} AND member_id = ${memberId}
    `);

    await db.execute(sql`
      DELETE FROM card_members WHERE member_id = ${memberId} AND card_id IN (
        SELECT cards.id FROM cards
        JOIN lists ON cards.list_id = lists.id
        JOIN boards ON lists.board_id = boards.id
        WHERE boards.id = ${boardId}
      )
    `);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BOARD_MEMBERS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
