import { createHmac, timingSafeEqual } from "node:crypto";
import { isEmailCategory } from "./email-preferences";

/** A link that proves who may unsubscribe, without signing in. It does not expire. */
export function signUnsubscribe(
  secret: string,
  memberId: string,
  category: string,
) {
  const body = Buffer.from(JSON.stringify([memberId, category])).toString(
    "base64url",
  );
  const sign = createHmac("sha256", secret)
    .update(`unsubscribe:${body}`)
    .digest("base64url");
  return `${body}.${sign}`;
}
export function readUnsubscribe(secret: string, token: string) {
  const [body = "", sign = ""] = token.split(".");
  const expected = createHmac("sha256", secret)
    .update(`unsubscribe:${body}`)
    .digest("base64url");
  if (
    !body ||
    sign.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sign), Buffer.from(expected))
  )
    return null;
  try {
    const [memberId, category] = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    );
    if (
      typeof memberId !== "string" ||
      !(category === "all" || isEmailCategory(String(category)))
    )
      return null;
    return { memberId, category: category as string };
  } catch {
    return null;
  }
}
