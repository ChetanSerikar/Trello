import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUserOrThrow } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await currentUserOrThrow();

    const result = await db.execute(sql`
      SELECT * FROM labels
      ORDER BY name ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("[LABELS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await currentUserOrThrow();
    const { name, color } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!color) {
      return new NextResponse("Color is required", { status: 400 });
    }

    // Validate color format (e.g., #f97316)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(color)) {
      return new NextResponse("Invalid color format", { status: 400 });
    }

    const insertResult = await db.execute(sql`
      INSERT INTO labels (name, color)
      VALUES (${name}, ${color})
      RETURNING *
    `);

    return NextResponse.json(insertResult.rows[0]);
  } catch (error) {
    console.error("[LABELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
