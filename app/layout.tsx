import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Open_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

// Brand typography (ADR-011). Variable fonts → weight omitted (full range).
const display = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-big-shoulders",
  display: "swap",
});

const sans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sattvik Beats — Live Concerts by Art of Living",
    template: "%s · Sattvik Beats",
  },
  description:
    "Sattvik Beats — live concerts across India, presented by Art of Living. Book tickets for events in your city.",
  metadataBase: new URL("https://www.sattvikbeats.com"),
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1d0541",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} h-full scroll-pt-20 antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
