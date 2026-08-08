import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildParserSystemPrompt, buildParserUserPrompt } from '../src/lib/aiParser';
import { checkRateLimit, getClientIP } from '../shared/rateLimit';

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
    options: { temperature: 0.1 },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as any;
    return data?.message?.content || '';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
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
    return text.slice(0, 6000);
  } catch (err) {
    console.warn('[parse-entity] URL fetch failed:', err);
    return '';
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rate limit: 15 requests per minute per IP
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(`parse-entity:${ip}`, 15, 60_000);
  
  res.setHeader('X-RateLimit-Limit', '15');
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));
  
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      success: false,
      error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.',
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

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

    const systemPrompt = buildParserSystemPrompt('counterparty');
    const userPrompt = buildParserUserPrompt(inputText, contractType, 'counterparty');

    try {
      const responseText = await queryOllamaVision(
        DEFAULT_MODEL,
        systemPrompt,
        userPrompt,
        imageBase64,
        imageMimeType
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
          throw new Error('Odpověď z AI nebyla validní JSON');
        }
      }

      const normalizeEntity = (raw: any) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
        const mapped: any = { ...raw };
        if (!mapped.fullName && mapped.name) mapped.fullName = mapped.name;
        if (!mapped.businessName && mapped.company) mapped.businessName = mapped.company;
        if (!mapped.businessName && mapped.organization) mapped.businessName = mapped.organization;
        if (!mapped.email && mapped.e_mail) mapped.email = mapped.e_mail;
        if (!mapped.phone && mapped.telephone) mapped.phone = mapped.telephone;
        if (!mapped.phone && mapped.tel) mapped.phone = mapped.tel;
        if (!mapped.bankAccount && mapped.account) mapped.bankAccount = mapped.account;
        if (!mapped.ico && mapped.ic) mapped.ico = mapped.ic;
        if (!mapped.dic && mapped.vat) mapped.dic = mapped.vat;

        if (mapped.address && typeof mapped.address === 'object' && !Array.isArray(mapped.address)) {
          if (!mapped.street && mapped.address.street) mapped.street = mapped.address.street;
          if (!mapped.city && mapped.address.city) mapped.city = mapped.address.city;
          if (!mapped.zip && mapped.address.zip) mapped.zip = mapped.address.zip;
          if (!mapped.zip && mapped.address.postalCode) mapped.zip = mapped.address.postalCode;
        }

        mapped.missingFields = Array.isArray(raw.missingFields) ? raw.missingFields : [];
        mapped.confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.7;
        return mapped;
      };

      return res.json({
        success: true,
        data: {
          myProfile: normalizeEntity(parsed.myProfile),
          counterparty: normalizeEntity(parsed.counterparty),
          workTemplate: parsed.workTemplate && typeof parsed.workTemplate === 'object' ? parsed.workTemplate : undefined,
          contractData: parsed.contractData && typeof parsed.contractData === 'object' ? parsed.contractData : undefined,
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
