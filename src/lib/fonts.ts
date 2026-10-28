import { Libre_Caslon_Text, Source_Sans_3, Plus_Jakarta_Sans } from 'next/font/google';

/**
 * Editorial Serif Font: Libre Caslon Text
 * Used for headlines, pull quotes, lead text, and brand titles.
 */
export const libreCaslon = Libre_Caslon_Text({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-libre-caslon',
  display: 'swap',
});

/**
 * Editorial Body Font: Source Sans 3
 * Used for article body copy, long-form paragraphs, and reading prose.
 */
export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
});

/**
 * Modern UI & Heading Font: Plus Jakarta Sans
 * Used for navigation, badges, metadata, buttons, and card labels.
 */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

/**
 * Combined CSS variable class names for root layout injection.
 */
export const fontVariables = `${libreCaslon.variable} ${sourceSans.variable} ${plusJakarta.variable}`;
