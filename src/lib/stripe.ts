import "server-only";
import Stripe from "stripe";
import { getSecret } from "./secrets";

/** Stripe is used with the account's own secret key (set in the server environment). */
export const stripeKey = () => getSecret("stripeSecretKey");
export const stripeConfigured = () => !!stripeKey();
export const modeOf = (key: string) =>
  /^(sk|rk)_live_/.test(key) ? ("live" as const) : ("test" as const);
export const stripeMode = () => modeOf(stripeKey());

const globals = globalThis as typeof globalThis & {
  mccStripe?: { key: string; client: Stripe };
};
/** A Stripe client for the saved key (or for a key being tested). */
export function stripe(key = stripeKey()) {
  if (!key) throw new Error("Stripe is not connected yet.");
  if (globals.mccStripe?.key !== key)
    globals.mccStripe = { key, client: new Stripe(key) };
  return globals.mccStripe.client;
}
