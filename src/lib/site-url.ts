export function siteOrigin() {
  const url = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000",
  );
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Configure an HTTPS site URL.");
  return url.origin;
}
export const meetingPath = (kind: "session" | "booking", id: string) =>
  `/meetings/${kind}/${encodeURIComponent(id)}`;
export const meetingUrl = (kind: "session" | "booking", id: string) =>
  `${siteOrigin()}${meetingPath(kind, id)}`;
