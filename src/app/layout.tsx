import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteCopyProvider } from "@/components/site-copy";
import { getStore } from "@/lib/store";

const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-poppins",
  display: "swap",
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
    description:
      "A warm, supportive space for women to connect, reflect and grow. Weekly Saturday circles and personal coaching with Sibel McGinnis.",
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
      className={`${inter.variable} ${poppins.variable}`}
    >
      <body>
        <SiteCopyProvider values={getStore().siteCopy ?? {}}>
          {children}
        </SiteCopyProvider>
      </body>
    </html>
  );
}
