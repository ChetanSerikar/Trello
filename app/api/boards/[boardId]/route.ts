import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";
import { sql } from "drizzle-orm"; // for sql`` tagged template
import { Card } from "@/lib/types";

export async function GET(req: Request, { params }: {params: Promise<{ boardId: number }> }) {
  try {
    let { boardId  } = await params
    
    const user = await currentUserOrThrow()

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    // Get board with workspace, creator, lists, cards, labels, members using SQL joins
    // Note: you might want to adapt below JOINs based on your schema naming and relations.

    const boardResult = await db.execute(sql`
      SELECT
        b.*,
        w.id AS workspace_id, w.name AS workspace_name,
        u.id AS creator_id, u.name AS creator_name
      FROM boards b
      JOIN workspaces w ON b.workspace_id = w.id
      JOIN users u ON b.created_by = u.id
      WHERE b.id = ${boardId}
    `);

    if (boardResult.rows.length === 0) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const board = boardResult.rows[0];

    // Check user access: is user creator or board member?
    const accessResult = await db.execute(sql`
      SELECT 1 FROM boards b
      LEFT JOIN board_members bm ON b.id = bm.board_id
      WHERE b.id = ${boardId} AND (b.created_by = ${user.id} OR bm.member_id = ${user.id})
      LIMIT 1
    `);

    if (accessResult.rows.length === 0) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get lists of board ordered by position
    const listsResult = await db.execute(sql`
      SELECT * FROM lists WHERE board_id = ${boardId} ORDER BY position ASC
    `);

    const lists = listsResult.rows;

    // For each list get cards ordered by position
    for (const list of lists) {
      const cardsResult = await db.execute(sql`
        SELECT * FROM cards WHERE list_id = ${list.id} ORDER BY position ASC
      `);

      list.cards = cardsResult.rows;

      // For each card get labels
      for (const card of list.cards ) {
        const labelsResult = await db.execute(sql`
          SELECT l.* FROM labels l
          JOIN card_labels cl ON cl.label_id = l.id
          WHERE cl.card_id = ${card.id}
        `);
        card.labels = labelsResult.rows;


        // For each card get members
        const membersResult = await db.execute(sql`
          SELECT u.* FROM users u
          JOIN card_members cm ON cm.member_id = u.id
          WHERE cm.card_id = ${card.id}
        `);
        card.members = membersResult.rows;
      }
    }

    // Get board members with user info
    const membersResult = await db.execute(sql`
      SELECT u.* FROM users u
      JOIN board_members bm ON bm.member_id = u.id
      WHERE bm.board_id = ${boardId}
    `);


    board.workspace = { id: board.workspace_id, name: board.workspace_name };
    board.creator = { id: board.creator_id, name: board.creator_name };
    board.lists = lists;
    board.members = membersResult.rows;



    return NextResponse.json(board);
  } catch (error) {
    console.error("[BOARD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request,  { params }: {params: Promise<{ boardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
     let { boardId  } = await params
    const { name } = await req.json()

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Check board exists
    const boardResult = await db.execute(sql`
      SELECT * FROM boards WHERE id = ${boardId}
    `);

    if (boardResult.rows.length === 0) {
      return new NextResponse("Board not found", { status: 404 });
    }
    const board = boardResult.rows[0];

    // Check user access (creator or member)
    const accessResult = await db.execute(sql`
      SELECT 1 FROM boards b
      LEFT JOIN board_members bm ON b.id = bm.board_id
      WHERE b.id = ${boardId} AND (b.created_by = ${user.id} OR bm.member_id = ${user.id})
      LIMIT 1
    `);

    if (accessResult.rows.length === 0) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Update board name and updatedAt timestamp
    const updatedResult = await db.execute(sql`
      UPDATE boards SET name = ${name}, updated_at = NOW()
      WHERE id = ${boardId}
      RETURNING *
    `);

    return NextResponse.json(updatedResult.rows[0]);
  } catch (error) {
    console.error("[BOARD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { boardId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const boardId = Number.parseInt(params.boardId);

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 });
    }

    // Check board exists
    const boardResult = await db.execute(sql`
      SELECT * FROM boards WHERE id = ${boardId}
    `);

    if (boardResult.rows.length === 0) {
      return new NextResponse("Board not found", { status: 404 });
    }
    const board = boardResult.rows[0];

    // Only creator can delete
    if (board.created_by !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await db.execute(sql`
      DELETE FROM boards WHERE id = ${boardId}
    `);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BOARD_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
