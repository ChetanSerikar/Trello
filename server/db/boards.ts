// db/boards.ts
import { db } from "@/drizzle/db"
import { boards } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export const createBoard = async ({ name, workspaceId, createdBy }: { name: string, workspaceId: number, createdBy: string }) => {
  return db.insert(boards).values({
    name,
    workspaceId,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
}

export const getBoard = async (id: number) => {
  return db.query.boards.findFirst({ where: eq(boards.id, id) })
}

export const updateBoard = async (id: number, name: string) => {
  return db.update(boards)
    .set({ name, updatedAt: new Date() })
    .where(eq(boards.id, id))
}

export const deleteBoard = async (id: number) => {
  return db.delete(boards).where(eq(boards.id, id))
}
