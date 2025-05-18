import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { currentUserOrThrow } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const user = await currentUserOrThrow()
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")

    let baseQuery = sql`
      SELECT DISTINCT boards.*
      FROM boards
      LEFT JOIN board_members ON boards.id = board_members.board_id
      WHERE boards.created_by = ${user.id}
        OR board_members.member_id = ${user.id}
    `

    if (workspaceId) {
      const parsedWorkspaceId = Number.parseInt(workspaceId)
      if (!isNaN(parsedWorkspaceId)) {
        baseQuery = sql`
          SELECT DISTINCT boards.*
          FROM boards
          LEFT JOIN board_members ON boards.id = board_members.board_id
          WHERE (boards.created_by = ${user.id}
            OR board_members.member_id = ${user.id})
            AND boards.workspace_id = ${parsedWorkspaceId}
        `
      }
    }

    const result = await db.execute(baseQuery)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[BOARDS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow()
    const { name, workspaceId } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    if (!workspaceId) {
      return new NextResponse("Workspace ID is required", { status: 400 })
    }

    const parsedWorkspaceId = Number.parseInt(workspaceId)
    if (isNaN(parsedWorkspaceId)) {
      return new NextResponse("Invalid workspace ID", { status: 400 })
    }

    const insertResult = await db.execute(sql`
      INSERT INTO boards (name, workspace_id, created_by)
      VALUES (${name}, ${parsedWorkspaceId}, ${user.id})
      RETURNING *
    `)

    
    const boardMemberResult = await db.execute(sql`
      INSERT INTO board_members (board_id, member_id)
      VALUES (${insertResult.rows[0].id}, ${user.id})
      RETURNING *
    `)


    return NextResponse.json(insertResult.rows[0])
  } catch (error) {
    console.error("[BOARDS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
