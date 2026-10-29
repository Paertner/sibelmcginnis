import "server-only";
import Stripe from "stripe";

/** Stripe is used with the account's own secret key (set in the server environment). */
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;
export const stripeMode = () =>
  (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_") ||
  (process.env.STRIPE_SECRET_KEY ?? "").startsWith("rk_live_")
    ? ("live" as const)
    : ("test" as const);

const globals = globalThis as typeof globalThis & { mccStripe?: Stripe };
export function stripe() {
  if (!stripeConfigured()) throw new Error("Stripe is not connected yet.");
  return (globals.mccStripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
}
