import "server-only";
import type Stripe from "stripe";
import { getStore, type Member } from "./store";
import { stripe } from "./stripe";
import { siteOrigin } from "./site-url";
import { adminClient } from "./supabase";
import { reloadMembers } from "./db";
import { revokeFromUpcoming } from "./meetings";
import { memberRole } from "./membership";

/** Stripe sends dates as seconds; newer API versions keep the period on the subscription item. */
function periodEnd(subscription: Stripe.Subscription) {
  const seconds =
    subscription.items.data[0]?.current_period_end ??
    (subscription as unknown as { current_period_end?: number })
      .current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : "";
}

async function customerFor(member: Member) {
  if (member.stripeCustomerId) return member.stripeCustomerId;
  const customer = await stripe().customers.create({
    email: member.email,
    name: member.name,
    metadata: { member_id: member.id },
  });
  member.stripeCustomerId = customer.id;
  return customer.id;
}

/** A Stripe Checkout page for the Premium subscription; returns its address. */
export async function checkoutUrl(memberId: string) {
  const data = getStore();
  const member = data.members.find((m) => m.id === memberId);
  if (!member) throw new Error("Member not found.");
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: await customerFor(member),
    client_reference_id: member.id,
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(data.settings.premiumPrice * 100),
          recurring: { interval: "month" },
          product_data: { name: "Morning Coffee Community Premium" },
        },
      },
    ],
    subscription_data: { metadata: { member_id: member.id } },
    metadata: { member_id: member.id },
    success_url: `${siteOrigin()}/account?tab=membership&checkout=success`,
    cancel_url: `${siteOrigin()}/account?tab=membership&checkout=cancelled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout page.");
  return session.url;
}

/** Stripe's own page where a member updates their card or cancels. */
export async function portalUrl(memberId: string) {
  const member = getStore().members.find((m) => m.id === memberId);
  if (!member?.stripeCustomerId)
    throw new Error("There is no billing account yet.");
  const session = await stripe().billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${siteOrigin()}/account?tab=membership`,
  });
  return session.url;
}

function findMember(
  memberId: string | undefined,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
) {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  return getStore().members.find(
    (m) =>
      (memberId && m.id === memberId) ||
      (customerId && m.stripeCustomerId === customerId),
  );
}

/** Makes the member's access match the subscription. Safe to run again for the same event. */
export async function applySubscription(subscription: Stripe.Subscription) {
  let member = findMember(
    subscription.metadata?.member_id,
    subscription.customer,
  );
  if (!member) {
    // Someone who joined from elsewhere may not be in memory yet.
    await reloadMembers(getStore());
    member = findMember(
      subscription.metadata?.member_id,
      subscription.customer,
    );
  }
  if (!member) {
    console.error("[stripe] no member for subscription", subscription.id);
    return;
  }
  member.stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const end = periodEnd(subscription);
  // Access runs to the end of the paid period; a retry period after a failed payment is kept.
  const paying = ["active", "trialing", "past_due"].includes(
    subscription.status,
  );
  if (paying && end) {
    member.tier = "premium";
    member.premiumUntil = end;
  } else if (!paying) {
    member.tier = "free";
    member.premiumUntil = "";
  }
  await adminClient()
    .from("subscriptions")
    .upsert({
      id: subscription.id,
      member_id: member.id,
      status: subscription.status,
      current_period_end: end || null,
    });
  if (memberRole(member) !== "premium") await revokeFromUpcoming(member.email);
}
