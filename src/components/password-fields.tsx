"use client";
import { useId, useState } from "react";

/** Password and repeat-password fields with show/hide and a live match check. */
export function PasswordFields({
  label,
  repeatLabel,
  hint,
}: {
  label: string;
  repeatLabel: string;
  hint: string;
}) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [visible, setVisible] = useState(false);
  const longEnough = password.length >= 8;
  const matches = repeat.length > 0 && repeat === password;
  return (
    <>
      <div className="field">
        <label htmlFor={`${id}-password`}>{label}</label>
        <div className="password-input">
          <input
            id={`${id}-password`}
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            aria-describedby={`${id}-hint`}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        <small
          id={`${id}-hint`}
          className={`password-hint${password ? (longEnough ? " ok" : " warn") : ""}`}
        >
          {hint}
        </small>
      </div>
      <div className="field">
        <label htmlFor={`${id}-repeat`}>{repeatLabel}</label>
        <input
          id={`${id}-repeat`}
          name="repeatPassword"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          maxLength={128}
          value={repeat}
          aria-describedby={`${id}-match`}
          aria-invalid={repeat.length > 0 && !matches}
          onChange={(event) => setRepeat(event.target.value)}
        />
        <small
          id={`${id}-match`}
          className={`password-hint${repeat ? (matches ? " ok" : " warn") : ""}`}
          aria-live="polite"
        >
          {repeat
            ? matches
              ? "Passwords match."
              : "Passwords don’t match yet."
            : "Type the same password again."}
        </small>
      </div>
    </>
  );
}
