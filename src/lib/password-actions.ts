"use server";
import { redirect } from "next/navigation";
import { adminClient, sessionClient } from "./supabase";
import { demoEnabled } from "./store";
import {
  askedRecently,
  createResetLink,
  sendResetEmail,
} from "./password-reset";
import type { ActionResult } from "@/components/action-form";

const NEUTRAL =
  "If an account exists for that address, we have sent a link to set a new password.";

/** Asks for a reset link by email. Always gives the same answer, so it never reveals who has an account. */
export async function forgotPassword(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const address = String(form.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    return { message: "Enter a valid email address." };
  if (demoEnabled() || askedRecently(address))
    return { ok: true, message: NEUTRAL };
  try {
    const { data } = await adminClient()
      .from("profiles")
      .select("status")
      .eq("email", address)
      .maybeSingle();
    if (data?.status === "active") {
      const link = await createResetLink(address);
      if (link) await sendResetEmail(address, link);
    }
  } catch (error) {
    console.error(
      "[reset] forgot password failed:",
      error instanceof Error ? error.message : "unknown",
    );
  }
  return { ok: true, message: NEUTRAL };
}

/** Uses the one-time token and sets the new password. */
export async function resetPassword(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const token = String(form.get("token") ?? ""),
    password = String(form.get("password") ?? "");
  if (password.length < 8)
    return { message: "Use a password with at least 8 characters." };
  if (password !== String(form.get("repeatPassword") ?? ""))
    return { message: "The two passwords don’t match." };
  if (demoEnabled())
    return { message: "Passwords are managed by the real sign-in only." };
  const supabase = await sessionClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "recovery",
  });
  if (error) {
    console.error("[reset] token refused:", error.code);
    return {
      message:
        "This link has expired or was already used. Please ask for a new one.",
    };
  }
  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("[reset] password not saved:", updateError.code);
    return {
      message:
        updateError.code === "same_password"
          ? "Choose a password different from the old one."
          : "Could not save the new password. Please ask for a new link.",
    };
  }
  redirect("/account");
}
