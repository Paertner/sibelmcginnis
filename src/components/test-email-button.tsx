"use client";
import { useActionState } from "react";
import { adminMutation } from "@/lib/actions";
import { Notify } from "./toast";
import type { ActionResult } from "./action-form";

/** Sends one test email to the signed-in admin and shows Resend's exact answer in a toast. */
export function TestEmailButton() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    (previous, form) => adminMutation(previous, form),
    { message: "" },
  );
  return (
    <form action={action} className="settings-test-email">
      <input type="hidden" name="entity" value="integrations" />
      <input type="hidden" name="op" value="resend-test" />
      <p className="setting-hint">
        Save the key and sender first. The test goes to your own email and
        counts as one email today. If Resend refuses it (for example because the
        domain is not verified), the exact reason appears here.
      </p>
      <button className="btn btn-ghost" disabled={pending}>
        {pending ? "Sending…" : "Send test email"}
      </button>
      <Notify result={state} />
    </form>
  );
}
