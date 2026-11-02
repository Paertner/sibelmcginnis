/** An "Are you sure?" dialog. Resolves true on confirm, false on cancel, Escape or a click outside. */
export function askConfirm(
  message: string,
  options: {
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Red confirm button for actions that are hard to undo. Default true. */
    danger?: boolean;
  } = {},
): Promise<boolean> {
  const {
    title = "Are you sure?",
    confirmLabel = "Yes, continue",
    cancelLabel = "No, go back",
    danger = true,
  } = options;
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "confirm-dialog";
    dialog.setAttribute("role", "alertdialog");
    const heading = document.createElement("h3");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = message;
    const row = document.createElement("div");
    row.className = "confirm-dialog-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn btn-ghost";
    cancel.textContent = cancelLabel;
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = `btn ${danger ? "btn-danger" : ""}`.trim();
    confirm.textContent = confirmLabel;
    row.append(cancel, confirm);
    dialog.append(heading, text, row);
    const id = `confirm-${Math.random().toString(36).slice(2)}`;
    heading.id = id;
    dialog.setAttribute("aria-labelledby", id);
    let answer = false;
    cancel.onclick = () => dialog.close();
    confirm.onclick = () => {
      answer = true;
      dialog.close();
    };
    dialog.onclick = (event) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.onclose = () => {
      dialog.remove();
      resolve(answer);
    };
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
