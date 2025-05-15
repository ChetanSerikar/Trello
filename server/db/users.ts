// createUser.ts

import { db } from "@/drizzle/db"
import { users } from "@/drizzle/schema"
import { eq } from "drizzle-orm"


export const createUser = async ({ id, name, email }: typeof users.$inferInsert) => {
  await db.insert(users).values({
    id,
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

export const deleteUser = async (userId: string) => {
  await db.delete(users).where(eq(users.id, userId))
}

export const getUser = async (id: string) => {
  return db.query.users.findFirst({ where: eq(users.id, id) })
}
