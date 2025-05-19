import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { currentUserOrThrow } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ workspaceId: number }> }
) {
  try {
    // const user = await currentUserOrThrow();
    const { workspaceId } = await params;

    if (isNaN(workspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 });
    }

    // const workspaceResult = await db.execute(sql`
    //   SELECT * FROM workspaces
    //   WHERE id = ${workspaceId} AND ownerId = ${user.id}
    //   LIMIT 1
    // `);
    const workspaceResult = await db.execute(sql`
      SELECT * FROM workspaces
      WHERE id = ${workspaceId} 
      LIMIT 1
    `);

    const workspace = workspaceResult.rows[0];

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("[WORKSPACE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workspaceId: number }> }
) {
  try {
    const user = await currentUserOrThrow();
    const { workspaceId } = await params;
    const { name } = await req.json();

    if (isNaN(workspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Verify workspace ownership
    const workspaceResult = await db.execute(sql`
      SELECT * FROM workspaces
      WHERE id = ${workspaceId} AND ownerId = ${user.id}
      LIMIT 1
    `);

    const workspace = workspaceResult.rows[0];

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 });
    }

    // Update workspace
    const updatedWorkspaceResult = await db.execute(sql`
      UPDATE workspaces
      SET name = ${name}, updatedAt = NOW()
      WHERE id = ${workspaceId}
      RETURNING *
    `);

    return NextResponse.json(updatedWorkspaceResult.rows[0]);
  } catch (error) {
    console.error("[WORKSPACE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ workspaceId: number }> }
) {
  try {
    const user = await currentUserOrThrow();
    const { workspaceId } = await params;

    if (isNaN(workspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 });
    }

    // Verify workspace ownership
    const workspaceResult = await db.execute(sql`
      SELECT * FROM workspaces
      WHERE id = ${workspaceId} AND ownerId = ${user.id}
      LIMIT 1
    `);

    const workspace = workspaceResult.rows[0];

    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 });
    }

    // Delete workspace
    await db.execute(sql`
      DELETE FROM workspaces
      WHERE id = ${workspaceId}
    `);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[WORKSPACE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
