"use client";
import { askConfirm } from "./confirm-dialog";

/** Emails the member a link to set their password, after the admin confirms. */
export function EmailLinkButton({ email }: { email: string }) {
  return (
    <button
      className="btn btn-sm btn-ghost"
      name="op"
      value="emailLink"
      formNoValidate
      onClick={async (event) => {
        const button = event.currentTarget,
          form = button.form;
        event.preventDefault();
        if (
          await askConfirm("The member gets an email with a one-use link.", {
            title: `Send a password link to ${email}?`,
            confirmLabel: "Yes, send it",
            danger: false,
          })
        )
          form?.requestSubmit(button);
      }}
    >
      Send password link by email
    </button>
  );
}
