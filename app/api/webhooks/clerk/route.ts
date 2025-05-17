import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { env } from "@/data/env/server"
// import {
//   createUserSubscription,
//   getUserSubscription,
// } from "@/server/db/subscription"
import { createUser, deleteUser } from "@/server/db/users"
// import { env } from "process"
// import { Stripe } from "stripe"

// const stripe = new Stripe(env.STRIPE_SECRET_KEY)

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId =  headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400,
    })
  }

  console.log("Webhook event:")

  const { type } = event
  console.log("Received webhook event:", type)

 switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name } = event.data
      const email = email_addresses[0]?.email_address ?? ""

      await createUser({
        id,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        email,
      })
      break
    }

    case "user.deleted": {
      const userId = event.data.id

      // Optional: Cancel stripe subscription if you have it linked
      // await stripe.subscriptions.cancel(subscriptionId)

      await deleteUser(userId as string)
      break
    }

    default:
      break
  }

  return new Response("", { status: 200 })
}