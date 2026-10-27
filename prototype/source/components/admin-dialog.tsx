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
}: {
  title: string;
  trigger?: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        type="button"
        className={`btn btn-sm${primary ? "" : " btn-ghost"}`}
        aria-label={title}
        onClick={() => dialog.current?.showModal()}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        className="admin-dialog"
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
