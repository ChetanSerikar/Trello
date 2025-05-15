import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { boards, boardMembers } from "@/lib/schema"
import { currentUserOrThrow } from "@/lib/auth"
import { and, eq, or } from "drizzle-orm"

export async function GET(req: Request, { params }: {params: Promise<{ boardId: number }> }) {
  try {
    let { boardId  } = await params
    
    const user = await currentUserOrThrow()
    // const boardId = Number.parseInt(params.boardId)

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 })
    }

const board = await db.query.boards.findFirst({
  where: and(
    eq(boards.id, boardId),
    eq(boards.createdBy, user.id)
  ),
  with: {
    workspace: true,
    creator: true,
    lists: {
      orderBy: (lists, { asc }) => [asc(lists.position)],
      with: {
        cards: {
          orderBy: (cards, { asc }) => [asc(cards.position)],
          with: {
            creator: true,
            labels: {
              with: {
                label: true,
              },
            },
            members: {
              with: {
                member: true,
              },
            },
          },
        },
      },
    },
    members: {
      with: {
        member: true,
      },
    },
  },
})


    if (!board) {
      return new NextResponse("Board not found", { status: 404 })
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error("[BOARD_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request,  { params }: {params: Promise<{ boardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
     let { boardId  } = await params
    const { name } = await req.json()

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const board = await db.query.boards.findFirst({
      where: and(eq(boards.id, boardId), or(eq(boards.createdBy, user.id), eq(boardMembers.memberId, user.id))),
    })

    if (!board) {
      return new NextResponse("Board not found", { status: 404 })
    }

    const updatedBoard = await db
      .update(boards)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(boards.id, boardId))
      .returning()

    return NextResponse.json(updatedBoard[0])
  } catch (error) {
    console.error("[BOARD_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request,  { params }: {params: Promise<{ boardId: number }> }) {
  try {
    const user = await currentUserOrThrow()
    let { boardId  } = await params

    if (isNaN(boardId)) {
      return new NextResponse("Invalid board ID", { status: 400 })
    }

    const board = await db.query.boards.findFirst({
      where: and(
        eq(boards.id, boardId),
        eq(boards.createdBy, user.id), // Only creator can delete
      ),
    })

    if (!board) {
      return new NextResponse("Board not found or not authorized", { status: 404 })
    }

    await db.delete(boards).where(eq(boards.id, boardId))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[BOARD_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
