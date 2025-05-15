import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const currentUser = async () => {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  return user
}

export const currentUserOrThrow = async () => {
  const user = await currentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

// export const syncUser = async () => {
//   const { userId, user } = await auth()

//   if (!userId || !user) {
//     return null
//   }

//   const dbUser = await db.query.users.findFirst({
//     where: eq(users.id, userId),
//   })

//   if (!dbUser) {
//     // Create new user
//     const email = user.emailAddresses[0]?.emailAddress

//     if (!email) {
//       throw new Error("Email is required")
//     }

//     const newUser = {
//       id: userId,
//       name: `${user.firstName} ${user.lastName}`,
//       email,
//     }

//     await db.insert(users).values(newUser)
//     return newUser
//   }

//   return dbUser
// }
