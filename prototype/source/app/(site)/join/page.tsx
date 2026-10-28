import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PasswordFields } from "@/components/password-fields";
import { join } from "@/lib/actions";
import { siteBackground } from "@/lib/site-images";
import { demoEnabled, getStore } from "@/lib/store";
export const metadata = { title: "Join the community" };
export default async function Join({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const premium = (await searchParams).plan === "premium";
  const price = getStore().settings.premiumPrice;
  const perks = premium
    ? [
        siteText("join.perk-saturday"),
        siteText("join.perk-consultation"),
        siteText("join.perk-podcast"),
        siteText("join.perk-library"),
      ]
    : [
        siteText("join.perk-library"),
        siteText("join.perk-events"),
        siteText("join.perk-upgrade"),
      ];
  return (
    <div className="wrap join-page">
      <div className="join-shell">
        <aside className="join-visual" {...siteBackground("home.join")}>
          <div className="join-visual-inner">
            <span className="pill">{siteText("join.visual-label")}</span>
            <p className="join-quote">{siteText("join.visual-quote")}</p>
            <ul className="join-perks">
              {perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </div>
        </aside>
        <section className="join-form" aria-labelledby="join-title">
          <h1 id="join-title">{siteText("join.create-account")}</h1>
          <p className="muted">{siteText("join.create-account-sub")}</p>
          <div className="plan-switch" role="group" aria-label="Membership">
            <Link
              href="/join?plan=free"
              aria-current={!premium ? "page" : undefined}
            >
              <b>{siteText("join.free-plan")}</b>
              <small>$0</small>
            </Link>
            <Link
              href="/join?plan=premium"
              aria-current={premium ? "page" : undefined}
            >
              <b>{siteText("join.premium-plan")}</b>
              <small>${price} / month</small>
            </Link>
          </div>
          {demoEnabled() ? (
            <ActionForm
              action={join}
              submitLabel={
                premium
                  ? siteText("join.create-premium-account")
                  : siteText("join.create-free-account")
              }
            >
              <input
                type="hidden"
                name="plan"
                value={premium ? "premium" : "free"}
              />
              <label className="field">
                {siteText("join.full-name")}
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </label>
              <label className="field">
                {siteText("join.email")}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <PasswordFields
                label={siteText("join.password")}
                repeatLabel={siteText("join.repeat-password")}
                hint={siteText("join.password-hint")}
              />
              <p className="join-note">
                {siteText(
                  "join.create-a-sample-membership-for-local-review-no-payment-is-taken-a",
                )}
              </p>
            </ActionForm>
          ) : (
            <p>
              {siteText(
                "join.membership-registration-will-open-when-account-services-and-check",
              )}{" "}
              <Link href="/contact">{siteText("join.get-in-touch")}</Link>{" "}
              {siteText("join.for-details")}
            </p>
          )}
          <p className="join-signin">
            {siteText("join.have-account")}{" "}
            <Link href="/login">{siteText("join.sign-in")}</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
