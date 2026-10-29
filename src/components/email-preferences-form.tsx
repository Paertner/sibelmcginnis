"use client";
import { useState } from "react";
import { saveEmailPreferences } from "@/lib/actions";
import {
  emailCategories,
  resolvedPreferences,
  type EmailPreferences,
} from "@/lib/email-preferences";
import { ActionForm } from "./action-form";

/** Toggles for each kind of email, plus "Unsubscribe from all". */
export function EmailPreferencesForm({
  preferences,
  preselectUnsubscribe = false,
}: {
  preferences?: EmailPreferences;
  /** Set when the member arrives from an unsubscribe link in an email. */
  preselectUnsubscribe?: boolean;
}) {
  const saved = resolvedPreferences(preferences);
  const [unsubscribed, setUnsubscribed] = useState(
    saved.unsubscribedAll || preselectUnsubscribe,
  );
  // Controlled, so the form's reset after saving keeps what the member chose.
  const [choices, setChoices] = useState(saved);
  return (
    <ActionForm
      action={saveEmailPreferences}
      className="email-prefs"
      submitLabel={unsubscribed ? "Unsubscribe me" : "Save preferences"}
    >
      {preselectUnsubscribe && !saved.unsubscribedAll ? (
        <p className="email-prefs-banner" role="status">
          You opened an unsubscribe link. Press “Unsubscribe me” to stop all
          emails, or switch the option off to keep them.
        </p>
      ) : null}
      <ul className="pref-list" aria-label="Email choices">
        {emailCategories.map((category) => (
          <li key={category.key}>
            <label className={`pref-row${unsubscribed ? " off" : ""}`}>
              <span className="pref-text">
                <b>{category.label}</b>
                <small>{category.hint}</small>
              </span>
              <input
                className="pref-switch"
                type="checkbox"
                role="switch"
                name={category.field}
                checked={choices[category.field]}
                onChange={(event) =>
                  setChoices({
                    ...choices,
                    [category.field]: event.target.checked,
                  })
                }
                tabIndex={unsubscribed ? -1 : undefined}
              />
            </label>
          </li>
        ))}
      </ul>
      <label className="pref-row pref-unsubscribe">
        <span className="pref-text">
          <b>Unsubscribe from all</b>
          <small>
            Stop every email from Morning Coffee Community. Your messages still
            appear in your account.
          </small>
        </span>
        <input
          className="pref-switch"
          type="checkbox"
          role="switch"
          name="unsubscribeAll"
          checked={unsubscribed}
          onChange={(event) => setUnsubscribed(event.target.checked)}
        />
      </label>
    </ActionForm>
  );
}
