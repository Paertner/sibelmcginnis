import { siteImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { Navigation } from "./navigation";
import { navigation } from "@/lib/navigation";
export function Brand() {
  return (
    <Link className="brand" href="/">
      <Image
        {...siteImageProps("shared.logo")}
        alt={siteImageProps("shared.logo").alt}
        width={30}
        height={30}
      />
      {siteText("site-chrome.sibel-mcginnis")}
    </Link>
  );
}
export async function Header() {
  const user = await getUser();
  return (
    <header className="site-header">
      <div className="wrap">
        <Brand />
        <Navigation />
        <div className="nav-cta">
          {user ? (
            <Link
              className="btn btn-sm btn-ghost"
              href={user.role === "admin" ? "/admin" : "/account"}
            >
              {user.role === "admin"
                ? siteText("site-chrome.admin-panel")
                : siteText("site-chrome.my-account")}
            </Link>
          ) : (
            <>
              <Link className="btn btn-sm btn-ghost" href="/login">
                {siteText("site-chrome.sign-in")}
              </Link>
              <Link className="btn btn-sm" href="/join">
                {siteText("site-chrome.join")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <h2>{siteText("site-chrome.get-in-touch")}</h2>
        <p className="footer-actions">
          <Link className="btn" href="/contact">
            {siteText("site-chrome.send-a-message")}
          </Link>{" "}
          <Link className="btn btn-ghost on-dark" href="/join">
            {siteText("site-chrome.join-morning-coffee")}
          </Link>
        </p>
        <div className="grid g3">
          <div>
            <Brand />
            <p>
              {siteText(
                "site-chrome.step-into-your-next-chapter-with-confidence-clarity-and-care",
              )}
            </p>
          </div>
          <div>
            <h4>{siteText("site-chrome.explore")}</h4>
            <ul>
              {navigation.map(([href, text]) => (
                <li key={href}>
                  <Link href={href}>
                    {siteText(`navigation.${href}`) || text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{siteText("site-chrome.follow")}</h4>
            <ul>
              <li>
                <a href="https://www.instagram.com/morningcoffeecommunity">
                  {siteText("site-chrome.instagram")}
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/profile.php?id=61571819350798">
                  {siteText("site-chrome.facebook")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="copy">
          © {new Date().getFullYear()}{" "}
          {siteText("site-chrome.sibel-mcginnis-morning-coffee-community")}
        </div>
      </div>
    </footer>
  );
}
