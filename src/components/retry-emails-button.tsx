"use client";
import { useActionState } from "react";
import { adminMutation } from "@/lib/actions";
import { Notify } from "./toast";
import type { ActionResult } from "./action-form";

/** Sends the emails of one announcement that failed the first time. */
export function RetryEmailsButton({
  announcementId,
  failed,
}: {
  announcementId: string;
  failed: number;
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    (previous, form) => adminMutation(previous, form),
    { message: "" },
  );
  return (
    <form action={action}>
      <input type="hidden" name="entity" value="announcements" />
      <input type="hidden" name="op" value="retry" />
      <input type="hidden" name="id" value={announcementId} />
      {failed ? (
        <button className="btn btn-sm btn-ghost" disabled={pending}>
          {pending ? "Sending…" : `Retry ${failed} failed`}
        </button>
      ) : null}
      <Notify result={state} />
    </form>
  );
}
