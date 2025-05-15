// db/lists.ts
import { db } from "@/drizzle/db"
import { lists } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export const createList = async ({ name, boardId, position }: { name: string, boardId: number, position: number }) => {
  return db.insert(lists).values({
    name,
    boardId,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
}

export const getList = async (id: number) => {
  return db.query.lists.findFirst({ where: eq(lists.id, id) })
}

export const updateList = async (id: number, name: string, position?: number) => {
  return db.update(lists)
    .set({ name, position, updatedAt: new Date() })
    .where(eq(lists.id, id))
}

export const deleteList = async (id: number) => {
  return db.delete(lists).where(eq(lists.id, id))
}
