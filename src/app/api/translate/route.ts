import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedUser } from '@/lib/auth';
import { canAccessWriterDesk } from '@/lib/db/schema';
import { i18n, isSupportedLocale, getTranslationLanguageName } from '@/i18n-config';
import { getDictionaryClient } from '@/dictionaries/client';

const MAX_TITLE_LENGTH = 500;
const MAX_SUBTITLE_LENGTH = 1000;
const MAX_HTML_LENGTH = 150000;

const extractSection = (text: string, sectionMarker: string, nextMarker?: string) => {
  const startIndex = text.indexOf(sectionMarker);
  if (startIndex === -1) return '';
  const start = startIndex + sectionMarker.length;
  const end = nextMarker ? text.indexOf(nextMarker, start) : text.length;
  return text.substring(start, end !== -1 ? end : text.length).trim();
};

export async function POST(req: Request) {
  const authMessages = getDictionaryClient(i18n.defaultLocale).translateApi;
  let messages = authMessages;

  try {
    const { user, role } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: authMessages.unauthorized }, { status: 401 });
    }
    if (!canAccessWriterDesk(role)) {
      return NextResponse.json({ error: authMessages.forbidden }, { status: 403 });
    }

    const { title, subtitle, htmlContent, targetLanguage } = await req.json();
    messages = getDictionaryClient(
      isSupportedLocale(targetLanguage) ? targetLanguage : i18n.defaultLocale
    ).translateApi;

    if (!title && !subtitle && !htmlContent) {
      return NextResponse.json({ error: messages.missingContent }, { status: 400 });
    }

    if (!isSupportedLocale(targetLanguage)) {
      return NextResponse.json({ error: messages.invalidLanguage }, { status: 400 });
    }

    if (
      (title && typeof title === 'string' && title.length > MAX_TITLE_LENGTH) ||
      (subtitle && typeof subtitle === 'string' && subtitle.length > MAX_SUBTITLE_LENGTH) ||
      (htmlContent && typeof htmlContent === 'string' && htmlContent.length > MAX_HTML_LENGTH)
    ) {
      return NextResponse.json({ error: messages.payloadTooLarge }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Translate API] Missing GEMINI_API_KEY environment variable');
      return NextResponse.json({ error: messages.serviceUnavailable }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const langName = getTranslationLanguageName(targetLanguage);
    
    const systemPrompt = `You are an expert translator specialized in literary and journalistic articles. Translate the user's text to ${langName}. The user will provide their content with separators.
CRITICAL: You MUST preserve ALL HTML tags, inline styles (such as style="text-align: justify;"), classes, ids, and attributes EXACTLY as they appear. Do not remove or alter any HTML formatting or style attributes.
You MUST return the translated content using the EXACT SAME separators:
---TITLE---
[translated title here]
---SUBTITLE---
[translated subtitle here]
---HTMLCONTENT---
[translated html content here, keep all HTML tags and style attributes exactly as they are]`;

    const payload = `---TITLE---\n${title || ''}\n---SUBTITLE---\n${subtitle || ''}\n---HTMLCONTENT---\n${htmlContent || ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: payload,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      }
    });

    const translatedText = response.text || '';

    // Parse the separator-based format
    return NextResponse.json({
      title: extractSection(translatedText, '---TITLE---', '---SUBTITLE---'),
      subtitle: extractSection(translatedText, '---SUBTITLE---', '---HTMLCONTENT---'),
      htmlContent: extractSection(translatedText, '---HTMLCONTENT---'),
    });
  } catch (error: unknown) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus = (error && typeof error === 'object' && 'status' in error && typeof (error as { status?: unknown }).status === 'number') 
      ? (error as { status: number }).status 
      : null;
    const isRateLimit = errorStatus === 429 || errorMessage.includes('429') || errorMessage.includes('Quota exceeded');
    const isOverloaded = errorStatus === 503 || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand');
    return NextResponse.json(
      { error: messages.translateFailed },
      { status: isRateLimit ? 429 : (isOverloaded ? 503 : 500) }
    );
  }
}
