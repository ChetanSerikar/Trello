// db/workspaces.ts
import { db } from "@/drizzle/db"
import { workspaces } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export const createWorkspace = async ({ name, ownerId }: { name: string, ownerId: string }) => {
  return db.insert(workspaces).values({
    name,
    ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
}

export const getWorkspace = async (id: number) => {
  return db.query.workspaces.findFirst({ where: eq(workspaces.id, id) })
}

export const updateWorkspace = async (id: number, name: string) => {
  return db.update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, id))
}

export const deleteWorkspace = async (id: number) => {
  return db.delete(workspaces).where(eq(workspaces.id, id))
}
