import { useActionState } from "react";
import { useAdminDialog } from "./admin-dialog";
export type ActionResult = { message: string; ok?: boolean };
export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Save changes",
  submitDisabled = false,
}: {
  action: (state: ActionResult, data: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
}) {
  const closeDialog = useAdminDialog();
  const [state, formAction, pending] = useActionState(
    async (previous: ActionResult, data: FormData) => {
      const result = await action(previous, data);
      if (result.ok) closeDialog?.();
      return result;
    },
    { message: "" },
  );
  return (
    <form action={formAction} className={className}>
      {children}
      <button className="btn" disabled={pending || submitDisabled}>
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
