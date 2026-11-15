import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Link,
  Tailwind,
} from '@react-email/components';
import { getDictionaryClient } from '@/dictionaries/client';
import type { Locale } from '@/i18n-config';

export interface UnsubscribePageProps {
  email: string;
  lang: Locale | string;
  siteUrl: string;
  success: boolean;
  errorMessage?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict?: any;
}

export function UnsubscribePage({
  email,
  lang,
  siteUrl,
  success,
  errorMessage,
  dict,
}: UnsubscribePageProps) {
  const dictionary = dict || getDictionaryClient(lang);
  const pageDict = dictionary.newsletter.unsubscribePage;

  const heading = success ? pageDict.successHeading : pageDict.errorHeading;
  const homeLabel = pageDict.returnHome;
  const profileLabel = pageDict.manageProfile;
  const brandLabel = pageDict.brand;

  let messageNode: React.ReactNode;
  if (success) {
    const rawTemplate = pageDict.successMessage;
    if (rawTemplate.includes('{email}')) {
      const [before, after] = rawTemplate.split('{email}');
      messageNode = (
        <>
          {before}
          <strong className="font-semibold text-charcoal">{email}</strong>
          {after}
        </>
      );
    } else {
      messageNode = rawTemplate;
    }
  } else {
    messageNode = errorMessage || pageDict.errorMessage;
  }

  return (
    <Html lang={lang} dir="ltr">
      <Head />
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
          <Container className="max-w-[520px] mx-auto my-[48px] p-[24px]">
            <Section className="bg-[#ffffff] border border-solid border-[#e5e0d8] rounded-[2px] p-[40px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              {/* Brand Label */}
              <Text className="font-serif text-[14px] tracking-[3px] uppercase text-[#c5a059] font-semibold m-0 mb-[24px]">
                {brandLabel}
              </Text>

              {/* Status Heading */}
              <Heading
                as="h1"
                className="font-serif text-[26px] font-normal m-0 mb-[16px] text-[#1c1c1c]"
              >
                {heading}
              </Heading>

              {/* Status Message */}
              <Text className="text-[15px] leading-[24px] text-[#555555] m-0 mb-[32px]">
                {messageNode}
              </Text>

              {/* Action Buttons */}
              <Section className="mb-[18px]">
                <Button
                  href={`${siteUrl}/${lang}`}
                  className="bg-[#1c1c1c] text-[#fbf9f8] px-[24px] py-[12px] text-[13px] tracking-[1px] uppercase font-medium rounded-[2px] no-underline inline-block"
                >
                  {homeLabel}
                </Button>
              </Section>

              <Section>
                <Link
                  href={`${siteUrl}/${lang}/escritorio/perfil`}
                  className="text-[13px] text-[#888888] underline inline-block"
                >
                  {profileLabel}
                </Link>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
