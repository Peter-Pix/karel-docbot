// api/parse-entity.ts
// AI parser endpoint — extrakce entit z textu/fotky/URL.
// Jeden univerzální endpoint pro Smart Paste a Vision Input.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildParserSystemPrompt, buildParserUserPrompt } from '../src/lib/aiParser';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_ENDPOINT = process.env.OLLAMA_API_ENDPOINT || 'https://ollama.com/api/chat';
const DEFAULT_MODEL = process.env.OLLAMA_PARSER_MODEL || 'gemma4:31b-cloud';

interface ParseRequest {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  url?: string;
  contractType: 'nda' | 'rent' | 'employment' | 'work';
  hint?: string;
}

async function queryOllamaVision(
  model: string,
  systemInstruction: string,
  userText: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error('OLLAMA_API_KEY not configured');
  }

  const userMessage: any = { role: 'user', content: userText };

  // Pokud je obrázek, přidej ho jako multimodal content
  if (imageBase64) {
    userMessage.images = [imageBase64];
    userMessage.content = userText || 'Extrahuj z tohoto obrázku (vizitky/faktury) všechny údaje o osobách a firmách.';
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      userMessage,
    ],
    stream: false,
    format: 'json',
    options: { temperature: 0.1 }, // Nízká teplota = konzistentní extrakce
  };

  const response = await fetch(OLLAMA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OLLAMA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as any;
  return data?.message?.content || '';
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DocBot/1.0)' },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });
    if (!response.ok) return '';
    const html = await response.text();
    // Velmi jednoduchý extraktor textu z HTML — odstraníme tagy
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 6000); // Ořez na 6 KB textu
  } catch (err) {
    console.warn('[parse-entity] URL fetch failed:', err);
    return '';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as ParseRequest;
    const { text, imageBase64, imageMimeType, url, contractType, hint } = body;

    if (!text && !imageBase64 && !url) {
      return res.status(400).json({
        success: false,
        error: 'Musíš poskytnout alespoň text, obrázek nebo URL.',
      });
    }

    // Pokud je URL, stáhni obsah
    let inputText = text || '';
    if (url && !text) {
      inputText = await fetchUrlContent(url);
      if (!inputText) {
        return res.status(400).json({
          success: false,
          error: 'Nepodařilo se načíst obsah z URL.',
        });
      }
    }

    if (hint) {
      inputText = `[Hint: ${hint}]\n\n${inputText}`;
    }

    // Sestav prompt
    const systemPrompt = buildParserSystemPrompt();
    const userPrompt = buildParserUserPrompt(inputText, contractType);

    try {
      const responseText = await queryOllamaVision(
        DEFAULT_MODEL,
        systemPrompt,
        userPrompt,
        imageBase64,
        imageMimeType
      );

      // Vyčistíme případné markdown bloky
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: zkus najít JSON uvnitř stringu
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Odpověď z AI nebyla validní JSON');
        }
      }

      return res.json({
        success: true,
        data: {
          myProfile: parsed.myProfile || undefined,
          counterparty: parsed.counterparty || undefined,
          workTemplate: parsed.workTemplate || undefined,
          contractData: parsed.contractData || undefined,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
          missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
        },
      });
    } catch (aiErr: any) {
      console.error('[parse-entity] AI call failed:', aiErr.message);
      return res.status(500).json({
        success: false,
        error: `AI parser selhal: ${aiErr.message}`,
        rawResponse: aiErr.message,
      });
    }
  } catch (error: any) {
    console.error('[parse-entity] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Neznámá chyba',
    });
  }
}