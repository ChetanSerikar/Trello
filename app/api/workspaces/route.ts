import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { currentUserOrThrow } from "@/lib/auth";

export async function GET() {
  try {
    const user = await currentUserOrThrow();

    // const userWorkspacesResult = await db.execute(sql`
    //   SELECT * FROM workspaces
    //   WHERE "owner_id" = ${user.id}
    //   ORDER BY "created_at" DESC
    // `);
    const userWorkspacesResult = await db.execute(sql`
      SELECT * FROM workspaces
      ORDER BY "created_at" DESC
    `);

    

    return NextResponse.json(userWorkspacesResult.rows);
  } catch (error) {
    console.error("[WORKSPACES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow();
    const { name } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const insertedWorkspaceResult = await db.execute(sql`
      INSERT INTO workspaces (name, ownerId)
      VALUES (${name}, ${user.id})
      RETURNING *
    `);

    return NextResponse.json(insertedWorkspaceResult.rows[0]);
  } catch (error) {
    console.error("[WORKSPACES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
