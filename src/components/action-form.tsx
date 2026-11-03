"use client";
import { startTransition, useActionState, useRef } from "react";
import { useAdminDialog } from "./admin-dialog";
import { useToast } from "./toast";
import { askConfirm } from "./confirm-dialog";
import { Notify } from "./toast";
export type ActionResult = {
  message: string;
  ok?: boolean;
  id?: string;
  keepOpen?: boolean;
  /** Also show the message as a toast, for results that would vanish with a closing dialog. */
  toast?: boolean;
};
export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Save changes",
  submitDisabled = false,
  confirmMessage,
  actions,
}: {
  action: (state: ActionResult, data: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  /** Ask before submitting, for actions that are hard to undo. */
  confirmMessage?: string;
  /** Buttons shown in one row with the submit button, e.g. Delete and Cancel. */
  actions?: React.ReactNode;
}) {
  const closeDialog = useAdminDialog();
  const toast = useToast();
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previous: ActionResult, data: FormData) => {
      const result = await action(previous, data);
      if (result.toast) toast(result.message, !!result.ok);
      if (result.ok && !result.keepOpen) {
        form.current?.reset();
        closeDialog?.();
      }
      return result;
    },
    { message: "" },
  );
  const submit = (
    <button
      className="btn"
      disabled={pending || submitDisabled}
      onClick={(event) => {
        if (!confirmMessage) return;
        event.preventDefault();
        const button = event.currentTarget;
        void askConfirm(confirmMessage, {
          confirmLabel: `Yes, ${submitLabel.toLowerCase()}`,
        }).then((ok) => {
          if (ok) form.current?.requestSubmit(button);
        });
      }}
    >
      {pending ? "Saving…" : submitLabel}
    </button>
  );
  // Submitting manually keeps what people typed when the server returns an error;
  // React's form action would clear the fields either way.
  return (
    <form
      ref={form}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const data = new FormData(event.currentTarget, submitter);
        startTransition(() => formAction(data));
      }}
    >
      {children}
      {actions ? (
        <div className="form-actions">
          {actions}
          {submit}
        </div>
      ) : (
        submit
      )}
      <Notify result={state} />
    </form>
  );
}
export function ConfirmDelete({
  name = "op",
  value = "delete",
}: {
  name?: string;
  value?: string;
}) {
  return (
    <button
      className="btn btn-sm btn-danger"
      name={name}
      value={value}
      onClick={(e) => {
        e.preventDefault();
        const button = e.currentTarget;
        void askConfirm("This cannot be undone.", {
          title: "Delete this item?",
          confirmLabel: "Yes, delete",
        }).then((ok) => {
          if (ok) button.form?.requestSubmit(button);
        });
      }}
    >
      Delete
    </button>
  );
}
