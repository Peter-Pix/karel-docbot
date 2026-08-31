# Karel Docbot

AI asistent pro tvorbu českých smluv. Konverzační generování dokumentů s právní korektností.

## Co to dělá

- **Generování smluv** — konverzační flow pro typy: NDA, nájemní, pracovní, dílo
- **AI parsing** — extrakce polí z konverzace (aiParser)
- **Šablony** — templateGenerator pro jednotlivé typy smluv
- **Flow engine** — řízený konverzační flow (flowEngine)
- **Obnova rozpracované smlouvy** — sessionStore umožňuje pokračovat v nedokončené smlouvě
- **Multi-input composer** — skládání vstupů z více zdrojů
- **Sanitizace** — bezpečné zpracování uživatelského vstupu (sanitize)
- **Error reporting** — sledování chyb

## Tech stack

- React + TypeScript (Vite)
- AI parser přes LLM (Ollama cloud)
- localStorage/session persistence (sessionStore, storage)
- Vercel serverless API (`api/`, 5 endpointů)

## Nastavení

### 1. Ollama cloud klíč (.env)

Zkopíruj `.env.example` do `.env` a vyplň klíč:

```bash
cp .env.example .env
```

```env
# ── Required ──────────────────────────────────────────────────────
# Ollama API Key pro AI funkce (Chat a Risk Analysis)
# Získej klíč na https://ollama.com
OLLAMA_API_KEY=your_ollama_api_key_here

# ── Optional ──────────────────────────────────────────────────────
# Override Ollama endpointu (default: https://ollama.com/api/chat)
# Pro lokální vývoj s lokální Ollama instancí.
# OLLAMA_API_ENDPOINT=http://localhost:11434/api/chat

# Override default modelu (default: deepseek-v4-flash)
# DEFAULT_MODEL=kimi-k2.7-code
```

> `.env*` je v `.gitignore` — klíč se nikdy nedostane do repa. `.env.example` je výjimka (whitelist).

### 2. Model

- **Výchozí model:** `deepseek-v4-flash` (rychlý a levný) — definovaný v jednom sdíleném místě (`shared/`), používají ho všechny API soubory.
- **Override:** přes `DEFAULT_MODEL` v `.env` nebo výběr v UI (SettingsModal).
- **Dostupné modely v UI:** `deepseek-v4-flash` (výchozí), `kimi-k2.7-code` (silnější pro komplexní analýzu).
- Všechny modely běží na **Ollama cloudu** — žádná lokální inference.

### 3. Rate limity

In-memory rate limiter (`shared/rateLimit.ts`), klíčovaný podle IP. Limity per endpoint (za minutu / IP):

| Endpoint | Limit | Poznámka |
|----------|-------|----------|
| `api/chat.ts` | **20/min** | nejdražší endpoint |
| `api/analyze-risks.ts` | **10/min** | timeout 25 s |
| `api/parse-entity.ts` | **15/min** | |
| `api/parse-entity-multi.ts` | **10/min** | multi-source je drahý |

> **Produkce:** in-memory limiter je OK pro single-user nasazení, ale pro multi-user produkci vyžaduje **Vercel KV / Upstash Redis** (viz TODO v `shared/rateLimit.ts`). Odpověď vrací `X-RateLimit-Remaining` a `X-RateLimit-Reset` hlavičky.

### 4. Spuštění e2e testu

E2E test prochází celý flow (landing → wizard → parsing → preview → AI kontrola rizik) přes Playwright:

```bash
# 1. Spusť dev server (Vite + API proxy)
pnpm dev

# 2. V jiném terminálu spusť e2e test
node --import tsx test-full-flow.mjs
```

Test otevírá `http://localhost:5173`, prochází flow a ukládá screenshoty do `test-results/`. Úspěch = v textu stránky se objeví „Skóre bezpečnosti".

## Právní vrstva

- **`legal-research.md`** — ČR právní compliance research (zákoník práce č. 262/2006 Sb., OZ).
- **Fallback rizikové scannery** v `api/analyze-risks.ts` pro konkrétní doložky: § 2051, § 2258, § 2612, § 2620–23 OZ, § 35/§ 78 zákoníku práce.
- **Disclaimer banner** — „Nejsme právní poradna, dokument prověřte advokátem" (zobrazený u generovaného dokumentu).
- **RiskAnalysisPanel** — safetyScore 0–100 + risks[] s citacemi a návrhy.

> ⚠️ Karel Docbot je nástroj pro návrh smluv, **ne právní poradna**. Vygenerované dokumenty vždy prověř advokátem.

## Spuštění

```bash
pnpm install
pnpm dev        # Vite + API
pnpm dev:api    # jen API
pnpm dev:full   # vše
pnpm test       # unit testy (vitest)
```

## Architektura

```
src/
  App.tsx               # hlavní komponenta
  components/           # UI
  lib/
    aiParser.ts         # AI parsing polí
    contracts.ts        # typy smluv
    templateGenerator.ts# šablony
    flowEngine.ts       # konverzační flow
    sessionStore.ts     # obnova session
    sanitize.ts         # sanitizace vstupu
    storage.ts          # persistence
api/                    # Vercel serverless endpointy (5)
shared/                 # SSOT: contracts.ts, rateLimit.ts, ollama.ts
```
