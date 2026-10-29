import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { getStore } from "./store";

/**
 * Keys the owner types into Settings (Stripe, Zoom, Resend) are kept in the database,
 * encrypted with SETTINGS_SECRET. Without that server setting nothing can be saved.
 * A value saved here wins over a server environment variable of the same purpose.
 */
export const secretNames = {
  stripeSecretKey: "STRIPE_SECRET_KEY",
  stripeWebhookSecret: "STRIPE_WEBHOOK_SECRET",
  zoomClientSecret: "ZOOM_CLIENT_SECRET",
  resendApiKey: "RESEND_API_KEY",
} as const;
export type SecretName = keyof typeof secretNames;

function key() {
  const secret = process.env.SETTINGS_SECRET;
  if (!secret || secret.length < 16)
    throw new Error(
      "SETTINGS_SECRET is not set on the server, so keys cannot be saved yet.",
    );
  return scryptSync(secret, "morning-coffee-settings", 32);
}

function seal(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}
function open(sealed: string) {
  const raw = Buffer.from(sealed, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([
    decipher.update(raw.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}

/** The saved key, or the server environment variable, or an empty string. */
export function getSecret(name: SecretName): string {
  const sealed = getStore().secretsVault?.[name];
  if (sealed) {
    try {
      return open(sealed);
    } catch {
      console.error(
        `[secrets] could not read ${name}; was SETTINGS_SECRET changed?`,
      );
    }
  }
  return process.env[secretNames[name]] ?? "";
}

/** Saves a key (encrypted); an empty value removes it. */
export function saveSecret(name: SecretName, value: string) {
  const data = getStore();
  const vault = { ...data.secretsVault };
  if (value) vault[name] = seal(value);
  else delete vault[name];
  data.secretsVault = vault;
}
