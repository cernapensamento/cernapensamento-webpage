import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Img,
  Button,
  Tailwind,
} from '@react-email/components';
import { getDictionaryClient } from '@/dictionaries/client';
import type { Locale } from '@/i18n-config';

export interface NewsletterEmailProps {
  title: string;
  subtitle?: string | null;
  authorName?: string | null;
  coverImageUrl?: string | null;
  articleUrl: string;
  profileUrl: string;
  unsubscribeUrl: string;
  lang: Locale | string;
  publicationType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict?: any;
}

export function NewsletterEmail({
  title,
  subtitle,
  authorName,
  coverImageUrl,
  articleUrl,
  profileUrl,
  unsubscribeUrl,
  lang,
  publicationType,
  dict,
}: NewsletterEmailProps) {
  const dictionary = dict || getDictionaryClient(lang);
  const emailDict = dictionary.newsletter.email;

  const cleanTitle = title?.trim() || emailDict.defaultTitle;
  const cleanSubtitle = subtitle?.trim() || null;
  const cleanAuthor = authorName?.trim() || null;

  const typeKey = publicationType?.toLowerCase();
  const localizedType = typeKey && emailDict.types?.[typeKey] ? emailDict.types[typeKey] : null;
  const badgeText = localizedType || (publicationType ? publicationType.toUpperCase() : emailDict.defaultBadge);

  const brandLabel = emailDict.brand;
  const readButtonLabel = emailDict.readButton;
  const bylineLabel = emailDict.byline;
  const footerNote = emailDict.footerNote;
  const manageLabel = emailDict.managePreferences;
  const unsubscribeLabel = emailDict.unsubscribe;

  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{cleanSubtitle || cleanTitle}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                parchment: '#fbf9f8',
                charcoal: '#1c1c1c',
                gold: '#c5a059',
              },
            },
          },
        }}
      >
        <Body className="bg-[#fbf9f8] my-0 mx-auto font-sans text-[#1c1c1c]">
          <Container className="max-w-[600px] mx-auto my-[32px] p-[16px]">
            {/* Brand Header */}
            <Section className="text-center mb-[24px]">
              <Link href={articleUrl} className="no-underline">
                <Text className="font-serif text-[15px] tracking-[4px] uppercase text-[#c5a059] font-semibold m-0">
                  {brandLabel}
                </Text>
              </Link>
            </Section>

            {/* Main Content Card */}
            <Section className="bg-[#ffffff] border border-solid border-[#e7e2db] rounded-[2px] p-[40px_36px]">
              {/* Category / Badge */}
              <Text className="text-[11px] tracking-[1.5px] uppercase text-[#8c827a] font-semibold m-0 mb-[14px]">
                {badgeText}
              </Text>

              {/* Title */}
              <Heading
                as="h1"
                className="m-0 mb-[12px] font-serif text-[28px] leading-[36px] font-normal text-[#1c1c1c]"
              >
                <Link href={articleUrl} className="text-[#1c1c1c] no-underline">
                  {cleanTitle}
                </Link>
              </Heading>

              {/* Byline */}
              {cleanAuthor && (
                <Text className="m-0 mb-[20px] text-[14px] text-[#766e65] italic font-serif">
                  {bylineLabel}{' '}
                  <strong className="not-italic font-semibold text-[#2d2926]">
                    {cleanAuthor}
                  </strong>
                </Text>
              )}

              {/* Cover Image */}
              {coverImageUrl && (
                <Section className="mb-[24px]">
                  <Link href={articleUrl} className="block no-underline">
                    <Img
                      src={coverImageUrl}
                      alt={cleanTitle}
                      width={528}
                      className="w-full max-w-[528px] h-auto rounded-[2px] border border-solid border-[#f0ece6] block"
                    />
                  </Link>
                </Section>
              )}

              {/* Subtitle */}
              {cleanSubtitle && (
                <Text className="m-0 mb-[28px] text-[16px] leading-[26px] text-[#4a453e]">
                  {cleanSubtitle}
                </Text>
              )}

              {/* Read Article CTA Button */}
              <Section className="pt-[8px] pb-[12px]">
                <Button
                  href={articleUrl}
                  className="bg-[#1c1c1c] text-[#fbf9f8] px-[28px] py-[14px] rounded-[2px] text-[13px] font-semibold tracking-[1.2px] uppercase no-underline inline-block"
                >
                  {readButtonLabel} &rarr;
                </Button>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="pt-[32px] pb-[12px] text-center">
              <Text className="m-0 mb-[12px] text-[12px] leading-[18px] text-[#9c948a]">
                {footerNote}
              </Text>
              <Text className="m-0 text-[12px] leading-[18px] text-[#9c948a]">
                <Link href={profileUrl} className="text-[#766e65] underline">
                  {manageLabel}
                </Link>
                {'  \u2022  '}
                <Link href={unsubscribeUrl} className="text-[#766e65] underline">
                  {unsubscribeLabel}
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
