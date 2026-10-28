import { createContext, useContext, useId, useRef } from "react";

const DialogContext = createContext<(() => void) | null>(null);
export const useAdminDialog = () => useContext(DialogContext);
export function AdminCancel() {
  const close = useAdminDialog();
  return (
    <button type="button" className="btn btn-ghost" onClick={() => close?.()}>
      Cancel
    </button>
  );
}

export function AdminDialog({
  title,
  trigger = "Edit",
  children,
  primary = false,
  wide = false,
  triggerClassName,
  triggerLabel,
}: {
  title: string;
  trigger?: string;
  children: React.ReactNode;
  primary?: boolean;
  /** Large editors such as posts and sessions. */
  wide?: boolean;
  /** Replaces the default small button look, e.g. a member's name as a link. */
  triggerClassName?: string;
  /** Accessible name of the trigger; defaults to the dialog title. */
  triggerLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        type="button"
        className={
          triggerClassName ?? `btn btn-sm${primary ? "" : " btn-ghost"}`
        }
        aria-label={triggerLabel ?? title}
        onClick={() => dialog.current?.showModal()}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        className={`admin-dialog${wide ? " wide" : ""}`}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="admin-dialog-body">
          <button
            type="button"
            className="admin-dialog-close"
            aria-label="Close editor"
            onClick={close}
          >
            ×
          </button>
          <h3 id={titleId}>{title}</h3>
          <DialogContext.Provider value={close}>
            {children}
          </DialogContext.Provider>
        </div>
      </dialog>
    </>
  );
}
