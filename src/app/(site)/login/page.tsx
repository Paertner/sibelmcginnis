import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { demoEnabled } from "@/lib/store";
import { demoLogin } from "@/lib/actions";
export const metadata = { title: "Sign in" };
export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const user = await getUser();
  const next = (await searchParams)?.next ?? "";
  const back = next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (user) redirect(back || (user.role === "admin" ? "/admin" : "/account"));
  return (
    <div className="card auth">
      <h1 className="auth-title">{siteText("login.welcome-back")}</h1>
      {demoEnabled() ? (
        <>
          <p className="muted">
            {siteText(
              "login.local-review-accounts-these-sample-accounts-are-disabled-in-produ",
            )}
          </p>
          <form action={demoLogin}>
            <input type="hidden" name="next" value={back} />
            {[
              [
                siteText("login.m0"),
                siteText("login.ah"),
                siteText("login.amelia-hart"),
                siteText("login.free-member"),
              ],
              [
                siteText("login.m1"),
                siteText("login.ld"),
                siteText("login.layla-demir"),
                siteText("login.premium-member-20-month"),
              ],
              [
                "admin",
                siteText("login.sm"),
                siteText("login.sibel-mcginnis"),
                siteText("login.admin"),
              ],
            ].map(([id, initials, name, tier]) => (
              <button className="persona" key={id} name="account" value={id}>
                <span className="avatar">{initials}</span>
                <span>
                  <b>{name}</b>
                  <br />
                  <small className="muted">{tier}</small>
                </span>
              </button>
            ))}
          </form>
        </>
      ) : (
        <p className="muted">
          {siteText(
            "login.member-sign-in-will-be-available-when-our-membership-service-is-c",
          )}
        </p>
      )}
      <p className="center">
        {siteText("login.new-here")}{" "}
        <Link
          href={back ? `/join?plan=free&next=${back}` : "/morning-coffee#plans"}
        >
          {siteText("login.see-membership-plans")}
        </Link>
      </p>
    </div>
  );
}
