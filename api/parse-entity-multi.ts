// api/parse-entity-multi.ts
// AI parser pro VÍCE ZDROJŮ najednou — sjednotí je do jedné entity.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildMultiParserSystemPrompt, buildMultiParserUserPrompt } from '../src/lib/aiParser';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_ENDPOINT = process.env.OLLAMA_API_ENDPOINT || 'https://ollama.com/api/chat';
const DEFAULT_MODEL = process.env.OLLAMA_PARSER_MODEL || 'gemma4:31b-cloud';

interface SourceInput {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  url?: string;
  label?: string;
}

interface MultiParseRequest {
  sources: SourceInput[];
  contractType: 'nda' | 'rent' | 'employment' | 'work';
  mode: 'me' | 'counterparty';
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DocBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return '';
    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 4000); // 4 KB per URL — menší než single, jich je víc
  } catch (err) {
    console.warn('[parse-entity-multi] URL fetch failed:', err);
    return '';
  }
}

/**
 * Připraví všechny zdroje do jednoho textového payloadu.
 * Obrázky se posílají zvlášť jako multimodal pole.
 */
async function prepareSources(sources: SourceInput[]): Promise<{
  textPayload: string;
  images: string[];
  sourceLabels: string[];
}> {
  const textParts: string[] = [];
  const images: string[] = [];
  const labels: string[] = [];

  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    const label = s.label || `Zdroj ${i + 1}`;
    labels.push(label);

    if (s.text) {
      textParts.push(`[${label} - TEXT]\n${s.text}`);
    } else if (s.url) {
      const urlText = await fetchUrlContent(s.url);
      if (urlText) {
        textParts.push(`[${label} - WEB ${s.url}]\n${urlText}`);
      } else {
        textParts.push(`[${label} - WEB ${s.url}]\n[URL se nepodařilo načíst]`);
      }
    } else if (s.imageBase64) {
      // Pro obrázek: pošleme placeholder text + přidáme image do multimodal
      textParts.push(`[${label} - OBRÁZEK (data v images[${images.length}])]`);
      images.push(s.imageBase64);
    }
  }

  return {
    textPayload: textParts.join('\n\n'),
    images,
    sourceLabels: labels,
  };
}

async function queryOllamaMulti(
  model: string,
  systemInstruction: string,
  userText: string,
  images: string[]
): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error('OLLAMA_API_KEY not configured');
  }

  const userMessage: any = { role: 'user', content: userText };
  if (images.length > 0) {
    userMessage.images = images;
  }

  const body = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      userMessage,
    ],
    stream: false,
    format: 'json',
    options: { temperature: 0.1 },
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as MultiParseRequest;
    const { sources, contractType, mode } = body;

    if (!sources || sources.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Musíš poskytnout alespoň jeden zdroj.',
      });
    }

    if (sources.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximálně 5 zdrojů najednou.',
      });
    }

    // Připrav zdroje
    const prepared = await prepareSources(sources);

    // Sestav prompty
    const systemPrompt = buildMultiParserSystemPrompt(mode);
    const userPrompt = buildMultiParserUserPrompt(
      prepared.sourceLabels.map((label, i) => ({
        label,
        content: i < prepared.images.length ? `[OBRÁZEK]` : prepared.textPayload.split('--- KONEC')[i],
      }))
    );

    try {
      const responseText = await queryOllamaMulti(
        DEFAULT_MODEL,
        systemPrompt,
        userPrompt,
        prepared.images
      );

      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI vrátila nevalidní JSON');
        }
      }

      const mergedData = parsed.merged || parsed;
      const sourceResults = parsed.sources || [];

      return res.json({
        success: true,
        merged: {
          myProfile: mergedData.myProfile || undefined,
          counterparty: mergedData.counterparty || undefined,
          workTemplate: mergedData.workTemplate || undefined,
          contractData: mergedData.contractData || undefined,
          confidence: typeof mergedData.confidence === 'number' ? mergedData.confidence : 0.7,
          missingFields: Array.isArray(mergedData.missingFields) ? mergedData.missingFields : [],
        },
        sources: sourceResults.map((s: any) => ({
          myProfile: s.myProfile || undefined,
          counterparty: s.counterparty || undefined,
          workTemplate: s.workTemplate || undefined,
          contractData: s.contractData || undefined,
          confidence: typeof s.confidence === 'number' ? s.confidence : 0.5,
          missingFields: Array.isArray(s.missingFields) ? s.missingFields : [],
        })),
      });
    } catch (aiErr: any) {
      console.error('[parse-entity-multi] AI call failed:', aiErr.message);
      return res.status(500).json({
        success: false,
        error: `AI parser selhal: ${aiErr.message}`,
      });
    }
  } catch (error: any) {
    console.error('[parse-entity-multi] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Neznámá chyba',
    });
  }
}