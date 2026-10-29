import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { forgotPassword } from "@/lib/password-actions";
export const metadata = { title: "Forgot password" };
export default function ForgotPassword() {
  return (
    <div className="card auth">
      <h1 className="auth-title">Forgot your password?</h1>
      <p className="muted">
        Enter the email you signed up with and we will send you a link to set a
        new one.
      </p>
      <ActionForm action={forgotPassword} submitLabel="Send the link">
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </ActionForm>
      <p className="center">
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
