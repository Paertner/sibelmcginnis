import type Stripe from "stripe";
import { applySubscription } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { getSecret } from "@/lib/secrets";

// Stripe calls this address when a subscription starts, renews, fails or ends.
export async function POST(request: Request) {
  const secret = getSecret("stripeWebhookSecret");
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature)
    return new Response("Webhook is not set up", { status: 400 });
  let event: Stripe.Event;
  try {
    // The signature proves the message really came from Stripe.
    event = stripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object);
        break;
      case "checkout.session.completed": {
        const session = event.data.object;
        if (typeof session.subscription === "string")
          await applySubscription(
            await stripe().subscriptions.retrieve(session.subscription),
          );
        break;
      }
    }
  } catch (error) {
    console.error("[stripe] webhook failed", event.type, error);
    // A 500 makes Stripe try again later.
    return new Response("Could not process the event", { status: 500 });
  }
  return new Response("ok");
}
