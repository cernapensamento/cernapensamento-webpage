import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SiteFooter from '@/components/layout/SiteFooter';

import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "A weekly literary and philosophical journal.",
  icons: [{ rel: "icon", url: "/images/logo/screen.webp" }],
};

import HeaderVisibilityWrapper from '@/components/layout/HeaderVisibilityWrapper';
import PublicNavBar from '@/components/layout/PublicNavBar';

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
      className={`${fontVariables} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-parchment text-charcoal">
        <ThemeProvider>
          <HeaderVisibilityWrapper>
            <PublicNavBar />
          </HeaderVisibilityWrapper>
          <main className="flex-grow flex flex-col relative">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
