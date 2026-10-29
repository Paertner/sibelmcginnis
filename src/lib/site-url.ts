export function siteOrigin() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  // An address typed without https:// still works; an unusable one is logged and ignored
  // so pages such as admin Settings keep opening.
  const raw = !configured
    ? "http://127.0.0.1:3000"
    : /^https?:\/\//i.test(configured)
      ? configured
      : `https://${configured}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    console.error("[site-url] NEXT_PUBLIC_SITE_URL is not a valid address.");
    return "http://127.0.0.1:3000";
  }
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    console.error("[site-url] NEXT_PUBLIC_SITE_URL should start with https://.");
    url.protocol = "https:";
  }
  return url.origin;
}
export const meetingPath = (kind: "session" | "booking", id: string) =>
  `/meetings/${kind}/${encodeURIComponent(id)}`;
export const meetingUrl = (kind: "session" | "booking", id: string) =>
  `${siteOrigin()}${meetingPath(kind, id)}`;
export const eventUrl = (id: string) =>
  `${siteOrigin()}/event/${encodeURIComponent(id)}`;
export const companyUrl = (token: string) =>
  `${siteOrigin()}/company/${encodeURIComponent(token)}`;
