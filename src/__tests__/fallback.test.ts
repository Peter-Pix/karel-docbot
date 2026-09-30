import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Ollama helper BEFORE importing the handlers so the fallback
// paths are exercised without a real OLLAMA_API_KEY / network call.
const queryOllamaMock = vi.fn();
vi.mock('../../shared/ollama', () => ({
  DEFAULT_MODEL: 'deepseek-v4.1-flash',
  queryOllama: (...args: any[]) => queryOllamaMock(...args),
}));

import chatHandler from '../../api/chat';
import risksHandler from '../../api/analyze-risks';

// ─── Helpers ─────────────────────────────────────────────────────────

function makeRes() {
  const res: any = {
    _status: 200,
    _body: null,
    headers: {} as Record<string, string>,
    status(code: number) {
      this._status = code;
      return this;
    },
    setHeader(k: string, v: string) {
      this.headers[k] = v;
      return this;
    },
    json(body: any) {
      this._body = body;
      return this;
    },
  };
  return res;
}

let ipCounter = 0;
function makeReq(overrides: any = {}) {
  ipCounter += 1;
  return {
    method: 'POST',
    headers: { 'x-forwarded-for': `127.0.0.${ipCounter}` },
    body: {},
    ...overrides,
  } as any;
}

beforeEach(() => {
  queryOllamaMock.mockReset();
  // Default: simulate missing API key / AI failure → triggers fallback.
  queryOllamaMock.mockRejectedValue(new Error('OLLAMA_API_KEY not configured'));
});

// ─── chat.ts: smartLocalChatFallback ─────────────────────────────────

describe('chat.ts fallback (smartLocalChatFallback)', () => {
  it('collects the first empty field when AI fails and user provides a value', async () => {
    const res = makeRes();
    await chatHandler(
      makeReq({
        body: {
          contractType: 'nda',
          messages: [{ sender: 'user', text: 'Jan Novák' }],
          currentFields: {},
        },
      }),
      res
    );
    expect(res._status).toBe(200);
    expect(res._body._fallback).toBe(true);
    expect(res._body.extractedFields.poskytovatel).toBe('Jan Novák');
    expect(res._body.isFinished).toBe(false);
  });

  it('strips common prefixes when extracting a field value', async () => {
    const res = makeRes();
    await chatHandler(
      makeReq({
        body: {
          contractType: 'nda',
          messages: [{ sender: 'user', text: 'Jmenuji se Acme s.r.o.' }],
          currentFields: {},
        },
      }),
      res
    );
    expect(res._body.extractedFields.poskytovatel).toBe('Acme s.r.o.');
  });

  it('returns advice when the user asks a question about an empty field', async () => {
    const res = makeRes();
    await chatHandler(
      makeReq({
        body: {
          contractType: 'nda',
          messages: [{ sender: 'user', text: 'Co je smluvní pokuta?' }],
          currentFields: { poskytovatel: 'Acme', prijemce: 'Jan' },
        },
      }),
      res
    );
    expect(res._body._fallback).toBe(true);
    expect(res._body.reply).toContain('Zadejte prosím');
    expect(res._body.extractedFields).toEqual({});
  });

  it('marks the flow finished when all fields are collected', async () => {
    const res = makeRes();
    await chatHandler(
      makeReq({
        body: {
          contractType: 'nda',
          messages: [{ sender: 'user', text: 'Jan Novák' }],
          currentFields: {
            poskytovatel: 'Acme',
            prijemce: 'Jan',
            predmet_tajemstvi: 'zdrojové kódy',
            smluvni_pokuta: '50 000 Kč',
            doba_platnosti: '3 roky',
            rozhodne_pravo: 'Česká republika',
          },
        },
      }),
      res
    );
    expect(res._body._fallback).toBe(true);
    expect(res._body.isFinished).toBe(true);
  });

  it('updates an existing field via update intent when no fields are empty', async () => {
    const res = makeRes();
    await chatHandler(
      makeReq({
        body: {
          contractType: 'nda',
          messages: [{ sender: 'user', text: 'Změň smluvní pokutu na 80 000 Kč' }],
          currentFields: {
            poskytovatel: 'Acme',
            prijemce: 'Jan',
            predmet_tajemstvi: 'zdrojové kódy',
            smluvni_pokuta: '50 000 Kč',
            doba_platnosti: '3 roky',
            rozhodne_pravo: 'Česká republika',
          },
        },
      }),
      res
    );
    expect(res._body._fallback).toBe(true);
    expect(res._body.lastUpdatedField).toBe('smluvni_pokuta');
    expect(res._body.extractedFields.smluvni_pokuta).toContain('80 000 Kč');
  });

  it('returns a generic completion reply when nothing matches', async () => {
    const res = makeRes();
    await chatHandler(
      makeReq({
        body: {
          contractType: 'nda',
          messages: [{ sender: 'user', text: 'ahoj' }],
          currentFields: {
            poskytovatel: 'Acme',
            prijemce: 'Jan',
            predmet_tajemstvi: 'zdrojové kódy',
            smluvni_pokuta: '50 000 Kč',
            doba_platnosti: '3 roky',
            rozhodne_pravo: 'Česká republika',
          },
        },
      }),
      res
    );
    expect(res._body._fallback).toBe(true);
    expect(res._body.isFinished).toBe(true);
    expect(res._body.reply).toContain('kompletně sestavena');
  });

  it('returns 400 when contractType is missing', async () => {
    const res = makeRes();
    await chatHandler(makeReq({ body: { messages: [], currentFields: {} } }), res);
    expect(res._status).toBe(400);
  });

  it('returns 405 for non-POST methods', async () => {
    const res = makeRes();
    await chatHandler(makeReq({ method: 'GET' }), res);
    expect(res._status).toBe(405);
  });
});

// ─── analyze-risks.ts: fallback risk scanner ─────────────────────────

describe('analyze-risks.ts fallback scanner', () => {
  it('returns 400 when contractHTML is missing', async () => {
    const res = makeRes();
    await risksHandler(makeReq({ body: { contractType: 'nda' } }), res);
    expect(res._status).toBe(400);
  });

  it('returns clean result (no risks) for a safe NDA', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'nda',
          contractHTML: '<p>Dohoda o mlčenlivosti mezi Acme a Janem.</p>',
        },
      }),
      res
    );
    expect(res._status).toBe(200);
    expect(res._body._fallback).toBe(true);
    expect(res._body.risks).toEqual([]);
    expect(res._body.safetyScore).toBe(100);
  });

  it('flags an excessive NDA penalty', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'nda',
          contractHTML: 'Smluvní pokuta 2 500 000 Kč za porušení.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'nda-penalty')).toBe(true);
    expect(res._body.safetyScore).toBeLessThan(100);
    expect(res._body.summary).toContain('Analýza odhalila');
  });

  it('flags eternal NDA duration', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'nda',
          contractHTML: 'Závazek platí na věčné časy a bez omezení.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'nda-duration')).toBe(true);
  });

  it('flags foreign jurisdiction in NDA', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'nda',
          contractHTML: 'Rozhodné právo Čínská lidová republika (rozhodčí soud v Pekingu).',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'nda-jurisdiction')).toBe(true);
  });

  it('flags excessive rent deposit', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'rent',
          contractHTML: 'Kauce ve výši 150 000 Kč.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'rent-deposit')).toBe(true);
  });

  it('flags illegal rent notice period', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'rent',
          contractHTML: 'Výpovědní lhůta 1 měsíc pro nájemce.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'rent-notice')).toBe(true);
  });

  it('flags missing work price', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'work',
          contractHTML: 'Cena díla: 0 Kč.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'work-price')).toBe(true);
  });

  it('flags missing work IP clause', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'work',
          contractHTML: 'Smlouva o dílo mezi zhotovitelem a objednatelem.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'work-ip')).toBe(true);
  });

  it('flags illegal employment probation period', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'employment',
          contractHTML: 'Zkušební doba 6 měsíců zkušební doba.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'emp-probation')).toBe(true);
  });

  it('flags excessive employment working hours', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'employment',
          contractHTML: 'Pracovní doba 55 hodin týdně.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'emp-hours')).toBe(true);
  });

  it('flags too broad employment place of work', async () => {
    const res = makeRes();
    await risksHandler(
      makeReq({
        body: {
          contractType: 'employment',
          contractHTML: 'Místo výkonu: celé území České republiky.',
        },
      }),
      res
    );
    expect(res._body.risks.some((r: any) => r.id === 'emp-place')).toBe(true);
  });

  it('returns 405 for non-POST methods', async () => {
    const res = makeRes();
    await risksHandler(makeReq({ method: 'GET' }), res);
    expect(res._status).toBe(405);
  });
});
