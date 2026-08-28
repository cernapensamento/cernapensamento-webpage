import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractSection = (text: string, sectionMarker: string, nextMarker?: string) => {
  const startIndex = text.indexOf(sectionMarker);
  if (startIndex === -1) return '';
  const start = startIndex + sectionMarker.length;
  const end = nextMarker ? text.indexOf(nextMarker, start) : text.length;
  return text.substring(start, end !== -1 ? end : text.length).trim();
};

export async function POST(req: Request) {
  try {
    const { title, subtitle, htmlContent, targetLanguage } = await req.json();

    if (!title && !subtitle && !htmlContent) {
      return NextResponse.json({ error: 'Missing content to translate' }, { status: 400 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ error: 'Missing GEMINI_API_KEY environment variable' }, { status: 500 });
    }

    const langName = targetLanguage === 'es' ? 'Spanish' : 'Galician';
    
    const systemPrompt = `You are an expert bilingual translator specialized in literary and journalistic articles (Galician and Spanish). Translate the user's text to ${langName}. The user will provide their content with separators. You MUST return the translated content using the EXACT SAME separators:
---TITLE---
[translated title here]
---SUBTITLE---
[translated subtitle here]
---HTMLCONTENT---
[translated html content here, keep all HTML tags exactly as they are]`;

    const payload = `---TITLE---\n${title || ''}\n---SUBTITLE---\n${subtitle || ''}\n---HTMLCONTENT---\n${htmlContent || ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
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
    const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded');
    return NextResponse.json(
      { error: 'Failed to translate', details: error.message },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
