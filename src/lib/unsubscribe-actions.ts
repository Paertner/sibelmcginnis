"use server";
import { applyUnsubscribe } from "./unsubscribe";
import type { ActionResult } from "@/components/action-form";

export async function unsubscribe(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const done = applyUnsubscribe(
    String(form.get("token") ?? ""),
    form.get("scope") === "all" ? "all" : "category",
  );
  return done
    ? {
        ok: true,
        message:
          "You are unsubscribed. You can change this any time in your account under Email preferences.",
      }
    : { message: "This link is not valid any more." };
}
