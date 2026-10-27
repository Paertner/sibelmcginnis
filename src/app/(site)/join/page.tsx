import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { join } from "@/lib/actions";
import { demoEnabled, getStore } from "@/lib/store";
export const metadata = { title: "Join the community" };
export default async function Join({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const premium = (await searchParams).plan === "premium";
  return (
    <div className="card auth">
      <Link href="/morning-coffee#plans">
        {siteText("join.membership-plans")}
      </Link>
      <h1 className="auth-title">
        {premium
          ? `Join Premium · $${getStore().settings.premiumPrice}/month`
          : siteText("join.join-for-free")}
      </h1>
      {demoEnabled() ? (
        <>
          <p className="muted">
            {siteText(
              "join.create-a-sample-membership-for-local-review-no-payment-is-taken-a",
            )}
          </p>
          <ActionForm
            action={join}
            submitLabel={siteText("join.create-review-account")}
          >
            <input
              type="hidden"
              name="plan"
              value={premium ? "premium" : "free"}
            />
            <label className="field">
              {siteText("join.full-name")}
              <input name="name" autoComplete="name" required maxLength={120} />
            </label>
            <label className="field">
              {siteText("join.email")}
              <input name="email" type="email" autoComplete="email" required />
            </label>
          </ActionForm>
        </>
      ) : (
        <p>
          {siteText(
            "join.membership-registration-will-open-when-account-services-and-check",
          )}{" "}
          <Link href="/contact">{siteText("join.get-in-touch")}</Link>{" "}
          {siteText("join.for-details")}
        </p>
      )}
    </div>
  );
}
