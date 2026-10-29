import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PasswordFields } from "@/components/password-fields";
import { resetPassword } from "@/lib/password-actions";
export const metadata = { title: "Set a new password" };
export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const token = (await searchParams).token_hash ?? "";
  return (
    <div className="card auth">
      <h1 className="auth-title">Set a new password</h1>
      {token ? (
        <ActionForm action={resetPassword} submitLabel="Save password">
          <input type="hidden" name="token" value={token} />
          <PasswordFields
            label="New password"
            repeatLabel="Repeat new password"
            hint="Use at least 8 characters."
          />
        </ActionForm>
      ) : (
        <p className="muted">
          This link is not complete. Please ask for a new one.
        </p>
      )}
      <p className="center">
        <Link href="/forgot-password">Ask for a new link</Link>
      </p>
    </div>
  );
}
