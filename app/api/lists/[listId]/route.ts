import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ listId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { listId } = await params;
    const { name, position } = await req.json();

    if (isNaN(listId)) {
      return new NextResponse("Invalid list ID", { status: 400 });
    }

    // Fetch list with board info
    const listResult = await db.execute(sql`
      SELECT lists.*, boards.created_by FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = ${listId}
    `);

    if (listResult.rows.length === 0) {
      return new NextResponse("List not found", { status: 404 });
    }

    const list = listResult.rows[0];

    // Check if user is board member
    const boardMemberResult = await db.execute(sql`
      SELECT 1 FROM board_members
      WHERE board_id = ${list.board_id} AND member_id = ${user.id}
      LIMIT 1
    `);

    const isBoardMember = boardMemberResult.rows.length > 0;
    const isCreator = list.created_by === user.id;

    if (!isCreator && !isBoardMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Build update fields dynamically
    const updates = [];
    if (name !== undefined) {
      updates.push(sql`name = ${name}`);
    }
    if (position !== undefined) {
      updates.push(sql`position = ${position}`);
    }
    // Always update updatedAt
    updates.push(sql`updated_at = ${new Date()}`);

    if (updates.length === 0) {
      // Nothing to update, return existing
      return NextResponse.json(list);
    }

    // Compose SET clause
    const setClause = sql.join(updates, sql`, `);

    // Execute update query
    const updatedListResult = await db.execute(sql`
      UPDATE lists SET ${setClause}
      WHERE id = ${listId}
      RETURNING *
    `);

    return NextResponse.json(updatedListResult.rows[0]);
  } catch (error) {
    console.error("[LIST_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ listId: number }> }) {
  try {
    const user = await currentUserOrThrow();
    const { listId } = await params;

    if (isNaN(listId)) {
      return new NextResponse("Invalid list ID", { status: 400 });
    }

    // Fetch list with board info
    const listResult = await db.execute(sql`
      SELECT lists.*, boards.created_at FROM lists
      JOIN boards ON boards.id = lists.board_id
      WHERE lists.id = ${listId}
    `);

    if (listResult.rows.length === 0) {
      return new NextResponse("List not found", { status: 404 });
    }

    const list = listResult.rows[0];

    // Check if user is board member
    const boardMemberResult = await db.execute(sql`
      SELECT 1 FROM board_members
      WHERE board_id = ${list.board_id} AND member_id = ${user.id}
      LIMIT 1
    `);

    // const isBoardMember = boardMemberResult.rows.length > 0;
    // const isCreator = list.createdBy === user.id;

    // if (!isCreator && !isBoardMember) {
    //   return new NextResponse("Unauthorized", { status: 403 });
    // }
    const isBoardMember = boardMemberResult.rows.length > 0;


    if ( !isBoardMember) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Delete list
    await db.execute(sql`
      DELETE FROM lists WHERE id = ${listId}
    `);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[LIST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
