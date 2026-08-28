import type { Metadata } from "next";
import { Libre_Caslon_Text, Source_Sans_3 } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SiteFooter from '@/components/layout/SiteFooter';

const libreCaslon = Libre_Caslon_Text({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre-caslon",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "A weekly literary and philosophical journal.",
  icons: [{ rel: "icon", url: "/images/logo/screen.webp" }],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  return (
    <html
      lang={lang || "es"}
      className={`${libreCaslon.variable} ${sourceSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-parchment text-charcoal">
        <ThemeProvider>
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
