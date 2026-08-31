// shared/ollama.ts
// Single source of truth (SSOT) for the default LLM model used across all API routes.
//
// All API files (chat.ts, analyze-risks.ts, parse-entity.ts, parse-entity-multi.ts)
// must import DEFAULT_MODEL from here instead of hardcoding their own default.
//
// Override via env var OLLAMA_MODEL (e.g. for a specific deployment).
// The default is deepseek-v4-flash (fast, cheap, good enough for contract drafting).

export const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'deepseek-v4-flash';

// ─── Shared Ollama chat helper ─────────────────────────────────────────
// Centralizes the fetch + AbortController + error handling that used to be
// duplicated in every API route (chat.ts, analyze-risks.ts, parse-entity.ts,
// parse-entity-multi.ts). Each route now only builds its own `messages` array
// and calls this single helper.

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface QueryOllamaOptions {
  /** Sampling temperature. Defaults to 0.3. */
  temperature?: number;
  /** Force JSON output. Defaults to false. */
  format?: 'json';
  /** Abort timeout in ms. Defaults to 25000. */
  timeoutMs?: number;
}

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_ENDPOINT = process.env.OLLAMA_API_ENDPOINT || 'https://ollama.com/api/chat';

/**
 * Send a chat completion request to the Ollama cloud API and return the
 * assistant's text content. Throws on missing key, HTTP error, or timeout.
 */
export async function queryOllama(
  model: string,
  messages: OllamaMessage[],
  options: QueryOllamaOptions = {}
): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error('OLLAMA_API_KEY not configured');
  }

  const body: any = {
    model,
    messages,
    stream: false,
    options: { temperature: options.temperature ?? 0.3 },
  };

  if (options.format) {
    body.format = options.format;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 25000);

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
