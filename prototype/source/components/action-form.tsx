import { startTransition, useActionState, useRef } from "react";
import { useAdminDialog } from "./admin-dialog";
export type ActionResult = { message: string; ok?: boolean; id?: string };
export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Save changes",
  submitDisabled = false,
  confirmMessage,
}: {
  action: (state: ActionResult, data: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  /** Ask before submitting, for actions that are hard to undo. */
  confirmMessage?: string;
}) {
  const closeDialog = useAdminDialog();
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (previous: ActionResult, data: FormData) => {
      const result = await action(previous, data);
      if (result.ok) {
        form.current?.reset();
        closeDialog?.();
      }
      return result;
    },
    { message: "" },
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
      <button
        className="btn"
        disabled={pending || submitDisabled}
        onClick={(event) => {
          if (confirmMessage && !window.confirm(confirmMessage))
            event.preventDefault();
        }}
      >
        {pending ? "Saving…" : submitLabel}
      </button>
      {state.message ? (
        <p
          className={`form-feedback ${state.ok ? "success" : "error"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
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
        if (
          !window.confirm(
            "Delete this item? This cannot be undone during this review session.",
          )
        )
          e.preventDefault();
      }}
    >
      Delete
    </button>
  );
}
