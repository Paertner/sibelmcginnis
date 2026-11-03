import { Header, Footer } from "@/components/site-chrome";
import { siteText } from "@/lib/site-copy";
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        {siteText("site-chrome.skip-to-content")}
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
