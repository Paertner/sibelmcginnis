import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteCopyProvider } from "@/components/site-copy";
import { ToastProvider } from "@/components/toast";
import { defaultDescription } from "@/lib/editor-pages";
import { getStore } from "@/lib/store";

const openSans = localFont({
  src: "./fonts/open-sans-latin-wght-normal.woff2",
  variable: "--font-text",
  display: "swap",
  weight: "300 800",
});
// Gelasio is drawn to match Georgia's shapes and widths, and is free to ship with the site.
const gelasio = localFont({
  src: "./fonts/gelasio-latin-400-italic.woff2",
  style: "italic",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});
export const dynamic = "force-dynamic";

// The tab title and icon follow Settings, so the admin can rename the site without a developer.
export function generateMetadata(): Metadata {
  const settings = getStore().siteSettings;
  const title = settings?.siteTitle
    ? `${settings.siteTitle} | Morning Coffee Community`
    : "Morning Coffee Community | Sibel McGinnis";
  return {
    title: {
      default: title,
      template: `%s | ${settings?.siteTitle || "Morning Coffee Community"}`,
    },
    description: defaultDescription,
    robots: { index: false, follow: false },
    ...(settings?.faviconPath ? { icons: { icon: settings.faviconPath } } : {}),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${openSans.variable} ${gelasio.variable}`}
    >
      <body>
        <ToastProvider>
          <SiteCopyProvider
            values={getStore().siteCopy ?? {}}
            weekday={getStore().settings.meetingWeekday}
          >
            {children}
          </SiteCopyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
