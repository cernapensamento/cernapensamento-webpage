import type { Metadata } from "next";
import { Libre_Caslon_Text, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import ThemeToggle from '@/components/ThemeToggle';
const libreCaslon = Libre_Caslon_Text({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre-caslon",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "The Quadrivium Journal",
  description: "A weekly literary and philosophical journal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${libreCaslon.variable} ${sourceSans.variable} antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-parchment text-charcoal">
        {children}
        <div className="fixed bottom-6 left-6 z-50">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
