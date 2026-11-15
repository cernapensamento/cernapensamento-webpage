import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAuthenticatedUser } from '@/lib/auth';
import { canAccessWriterDesk } from '@/lib/db/schema';
import { i18n } from '@/i18n-config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
  try {
    const { user, role } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    }
    if (!canAccessWriterDesk(role)) {
      return NextResponse.json({ error: 'Permisos insuficientes para traducir' }, { status: 403 });
    }

    const { title, subtitle, htmlContent, targetLanguage } = await req.json();

    if (!title && !subtitle && !htmlContent) {
      return NextResponse.json({ error: 'Missing content to translate' }, { status: 400 });
    }

    if (
      (title && typeof title === 'string' && title.length > MAX_TITLE_LENGTH) ||
      (subtitle && typeof subtitle === 'string' && subtitle.length > MAX_SUBTITLE_LENGTH) ||
      (htmlContent && typeof htmlContent === 'string' && htmlContent.length > MAX_HTML_LENGTH)
    ) {
      return NextResponse.json({ error: 'Payload exceeds allowed size limits' }, { status: 413 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ error: 'Missing GEMINI_API_KEY environment variable' }, { status: 500 });
    }

    const langNames: Record<string, string> = {
      es: 'Spanish',
      gl: 'Galician',
      pt: 'Portuguese',
      en: 'English',
      fr: 'French',
      de: 'German',
      it: 'Italian',
    };
    const langName =
      langNames[targetLanguage] ||
      (i18n.localeLabels as Record<string, string>)[targetLanguage] ||
      targetLanguage;
    
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
    
    try {
      // Parse the separator-based format
      return NextResponse.json({ 
        title: extractSection(translatedText, '---TITLE---', '---SUBTITLE---'), 
        subtitle: extractSection(translatedText, '---SUBTITLE---', '---HTMLCONTENT---'), 
        htmlContent: extractSection(translatedText, '---HTMLCONTENT---') 
      });
    } catch {
      console.error("Failed to parse response from Gemini", translatedText);
      return NextResponse.json({ error: 'Invalid response from model' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus = (error && typeof error === 'object' && 'status' in error && typeof (error as { status?: unknown }).status === 'number') 
      ? (error as { status: number }).status 
      : null;
    const isRateLimit = errorStatus === 429 || errorMessage.includes('429') || errorMessage.includes('Quota exceeded');
    const isOverloaded = errorStatus === 503 || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('high demand');
    return NextResponse.json(
      { error: 'Failed to translate' },
      { status: isRateLimit ? 429 : (isOverloaded ? 503 : 500) }
    );
  }
}
