// db/cards.ts
import { db } from "@/drizzle/db"
import { cards } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export const createCard = async ({ title, description, listId, position, createdBy, dueDate }: {
  title: string,
  description?: string,
  listId: number,
  position: number,
  createdBy: string,
  dueDate?: Date
}) => {
  return db.insert(cards).values({
    title,
    description,
    listId,
    position,
    createdBy,
    dueDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
}

export const getCard = async (id: number) => {
  return db.query.cards.findFirst({ where: eq(cards.id, id) })
}

export const updateCard = async (id: number, updates: Partial<Omit<Parameters<typeof createCard>[0], "listId" | "createdBy">>) => {
  return db.update(cards)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(cards.id, id))
}

export const deleteCard = async (id: number) => {
  return db.delete(cards).where(eq(cards.id, id))
}
