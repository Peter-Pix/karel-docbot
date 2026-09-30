# Stav projektu: karel-docbot

> Datum auditu: 2026-08-30 (The Archivist, planner režim)
> Poslední commit: `4c1287a` (2026-08-26, "docs: add ROADMAP.md")
> Branch: `main` (synced s `origin/main`), working tree CLEAN ✅
> Verifikace při auditu: **test 87/87 PASS, lint (tsc --noEmit) exit 0, build (vite) exit 0**
> Stack: React 19 + Vite 6 + TS 5.8 + Tailwind 4 + Vercel serverless API (@vercel/node) + Ollama cloud LLM

## Co je hotové ✅

**API vrstva (5 endpointů, Vercel serverless, `api/`)**
- `api/chat.ts` — konverzační sběr polí pro typ smlouvy (NDA, rent, employment, work), volá Ollama cloud, má lokální fallback `smartLocalChatFallback` (beze AI), rate limit 20/min/IP.
- `api/analyze-risks.ts` — analýza rizik smlouvy (HTML vstup), safetyScore 0–100 + risks[] s citacemi/návrhy, lokální fallback scanner pro konkrétní doložky, rate limit 10/min/IP, timeout 25 s.
- `api/parse-entity.ts` — parser entity z textu/obrázku/URL (myProfile/counterparty), rate limit 15/min/IP.
- `api/parse-entity-multi.ts` — multi-source merge (až 5 zdrojů, merge + per-source výsledky), rate limit 10/min/IP.
- `api/health.ts` — health check.

**Frontend (React, `src/`)**
- **AdaptiveFlowWizard / flowEngine** — adaptivní konverzační flow (10 kroků: intro → identify_me → identify_counterparty → work_subject → ... → preview), kroky se přeskočují když jsou data k dispozici.
- **MultiInputComposer** — skládání vstupů z více zdrojů (text/obrázek/URL), viz `src/lib/multiInputComposer.ts`.
- **SmartEntryPanel / FieldsEditorPanel** — sběr + ruční editace polí smlouvy.
- **DocumentPreview** — náhled smlouvy + export: TXT download (`.txt`), **DOCX download (`.docx`)** + tisk do PDF (window.print).
- **RiskAnalysisPanel** — zobrazení rizik, safetyScore, summary.
- **Auth/session** — session persistence do localStorage (`docbot_session_v1`, expirace 24 h), `sessionStore.ts`.
- **ErrorBoundary / errorReporting / Toast** — chybové stavy a reporting.
- **Landing / DocumentSelection / SettingsModal / AppHeader** — úvod, výběr typu, nastavení (výběr modelu), hlavička.

**Sdílená vrstva (SSOT)**
- `shared/contracts.ts` (404 řádků) — **single source of truth** pro všechny definice polí, labely, prompty, advice dictionary, tituly pro 4 typy smluv. Importují ji client (`src/lib/contracts.ts` re-export) i server (`api/chat.ts`). Žádná duplikace polí.
- `shared/rateLimit.ts` — in-memory rate limiter (client IP).

**Testy** — 5 test files / **87 testů PASS** (validace 19, contracts 22, sanitize 10, sessionStore 6, fallback 21 + 9). Coverage dříve 84.55 % (BENCHMARK_REPORT.json z 9. 8.).

**Právní vrstva** — `legal-research.md` (ČR právní compliance), fallback rizikové scannery v `api/analyze-risks.ts` pro § 2051, § 2258, § 2612, § 2620–23 OZ, § 35/§ 78 zákoníku práce.

**Bezpečnost** — `vercel.json` CSP + X-Content-Type-Options + X-Frame-Options DENY + Referrer-Policy; sanitizace vstupu (`sanitize.ts`, 10 testů); `.env.local`/klíče v `.gitignore`.

## Co chybí / je rozbité ⚠️

- **Rate limiting je in-memory** — `shared/rateLimit.ts` výslovně varuje: u Vercel serverless se stav resetuje při cold startu, doporučuje Vercel KV/Upstash Redis pro produkci. Pro single-user nasazení OK, pro veřejnost nedostatečné (rozhodnutí zdokumentováno v TODO, viz ROADMAP A5).

## Technický dluh 🧹

- **Bez TODO/FIXME/HACK** v kódu (grep 0 výskytů) — čisté.
- **Zdvojené API volání Ollama** — vyřešeno: extrahováno do `shared/ollama.ts` (DEFAULT_MODEL + queryOllama), všechny 4 API soubory importují helper (ROADMAP A4).
- **Dva lockfily** — vyřešeno: `package-lock.json` odstraněn, zůstal jen `pnpm-lock.yaml`; README používá pnpm (ROADMAP A2).
- **Screenshoty chyb v repo** — vyřešeno: přesunuty do `test-results/` (ignorováno), root čistý (ROADMAP A3).
- **`.env.example` OK** — dokumentovaný `OLLAMA_API_KEY`; `.env.local` ignorován.
- **dist/ a coverage/ tracked?** — NE, v `.gitignore` (`dist/`, `coverage/`). Dobré.

## Pozorování / rizika 🔍

- **Ollama klíč v .env.local** — není v gitu (ignorován), OK.
- **Security headers závisí na vercel.json** — lokální dev server (`server/dev-server.ts`) je bez CORS restrikcí (`Access-Control-Allow-Origin: *`); pro produkci jen přes VPS/Vercel.
- **Default model** — sjednocen na `deepseek-v4.1-flash` v `shared/ollama.ts` (DEFAULT_MODEL), všechny API soubory ho importují (ROADMAP A1).
- **Fallback `smartLocalChatFallback`** je heuristický regex — chrání před pádem beze AI, ale kvalita odpovědí beze AI je omezená.
- **Právní korektnost = blocker** (ROADMAP): fallback scanner je hardcoded na konkrétní doložky/částky; generované free-text smlouvy nejsou plně právně ověřeny. Bez ověření Fáze 1 neposílat ven (dle ROADMAP).
- **README** — rozšířen o detailní nastavení: Ollama cloud klíč (.env), model, rate limity, e2e testy, právní vrstvu (ROADMAP C3).
- **Testy API handlerů** — přidány fallback testy (`fallback.test.ts`, mock queryOllama/fetch) pokrývající `smartLocalChatFallback` a fallback scanner v analyze-risks (ROADMAP D1).
- **e2e test** — `test-full-flow.mjs` (playwright, 8. 8.) existuje, ale není v package.json scripts; spouští se manuálně.

## Otevřené body pro strategistu (VSTUP pro plánování)
- Fáze 1 (Kvalita): ověření právní korektnosti, standardní šablony, validace povinných polí — **otevřeno**.
- Fáze 2 (Dokumenty): DOCX export, formátovaná editace, historie smluv — **hotovo** (B2 DOCX, B4 editace, B3 historie).
- Fáze 3: právní disclaimer — **hotovo** (B1 DisclaimerBanner v LandingPage + DocumentPreview).
