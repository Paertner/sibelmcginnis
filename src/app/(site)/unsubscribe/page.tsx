import Link from "next/link";
import { inspectUnsubscribe } from "@/lib/unsubscribe";
import { unsubscribe } from "@/lib/unsubscribe-actions";
import { ActionForm } from "@/components/action-form";
export const metadata = { title: "Unsubscribe", robots: { index: false } };
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const found = inspectUnsubscribe(token);
  return (
    <div className="card auth">
      <h1 className="auth-title">Email preferences</h1>
      {found ? (
        <>
          <p className="muted">
            {found.category === "all"
              ? `Stop all emails to ${found.member.email}?`
              : `Stop “${found.label}” emails to ${found.member.email}?`}
          </p>
          <ActionForm action={unsubscribe} submitLabel="Unsubscribe">
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="scope"
              value={found.category === "all" ? "all" : "category"}
            />
          </ActionForm>
          {found.category !== "all" ? (
            <ActionForm
              action={unsubscribe}
              submitLabel="Unsubscribe from all emails"
            >
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="scope" value="all" />
            </ActionForm>
          ) : null}
        </>
      ) : (
        <p className="muted">
          This link is not valid. You can change your email choices any time in
          your account.
        </p>
      )}
      <p className="center">
        <Link href="/account?tab=emails">Open email preferences</Link>
      </p>
    </div>
  );
}
