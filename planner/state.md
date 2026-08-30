# Stav projektu: karel-docbot

> Datum auditu: 2026-08-30 (The Archivist, planner režim)
> Poslední commit: `4c1287a` (2026-08-26, "docs: add ROADMAP.md")
> Branch: `main` (synced s `origin/main`), working tree CLEAN ✅
> Verifikace při auditu: **test 57/57 PASS, lint (tsc --noEmit) exit 0, build (vite) exit 0**
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
- **DocumentPreview** — náhled smlouvy + export: TXT download (`.txt`) + tisk do PDF (window.print). **DOCX export NEexistuje.**
- **RiskAnalysisPanel** — zobrazení rizik, safetyScore, summary.
- **Auth/session** — session persistence do localStorage (`docbot_session_v1`, expirace 24 h), `sessionStore.ts`.
- **ErrorBoundary / errorReporting / Toast** — chybové stavy a reporting.
- **Landing / DocumentSelection / SettingsModal / AppHeader** — úvod, výběr typu, nastavení (výběr modelu), hlavička.

**Sdílená vrstva (SSOT)**
- `shared/contracts.ts` (404 řádků) — **single source of truth** pro všechny definice polí, labely, prompty, advice dictionary, tituly pro 4 typy smluv. Importují ji client (`src/lib/contracts.ts` re-export) i server (`api/chat.ts`). Žádná duplikace polí.
- `shared/rateLimit.ts` — in-memory rate limiter (client IP).

**Testy** — 4 test files / **57 testů PASS** (validace 19, contracts 22, sanitize 10, sessionStore 6). Coverage dříve 84.55 % (BENCHMARK_REPORT.json z 9. 8.).

**Právní vrstva** — `legal-research.md` (ČR právní compliance), fallback rizikové scannery v `api/analyze-risks.ts` pro § 2051, § 2258, § 2612, § 2620–23 OZ, § 35/§ 78 zákoníku práce.

**Bezpečnost** — `vercel.json` CSP + X-Content-Type-Options + X-Frame-Options DENY + Referrer-Policy; sanitizace vstupu (`sanitize.ts`, 10 testů); `.env.local`/klíče v `.gitignore`.

## Co chybí / je rozbité ⚠️

- **Export DOCX** — ROADMAP Fáze 2 "Export do PDF / DOCX (formátovaný)": je jen `.txt` download + tisk do PDF. Formátovaný DOCX NE.
- **Historie smluv** — ROADMAP Fáze 2 "Historie smluv (uložit rozpracované)": session persistence existuje (rozpracovaná smlouva), ale chybí seznam/archiv více uložených smluv.
- **Editace před finální verzí** — ROADMAP Fáze 2: `FieldsEditorPanel` umožňuje ruční editaci polí, ale formátovaná editace finálního dokumentu chybí (jen TXT/print).
- **Právní disclaimer** — ROADMAP Fáze 3 "Právní disclaimer / upozornění (nejsme právní poradna)": NEověřeno v UI kódu (grep nezachytil warning banner v LandingPage/preview).
- **Rate limiting je in-memory** — `shared/rateLimit.ts` výslovně varuje: u Vercel serverless se stav resetuje při cold startu, doporučuje Vercel KV/Upstash Redis pro produkci. Pro single-user nasazení OK, pro veřejnost nedostatečné.

## Technický dluh 🧹

- **Bez TODO/FIXME/HACK** v kódu (grep 0 výskytů) — čisté.
- **Zdvojené API volání Ollama**: `api/chat.ts`, `api/analyze-risks.ts`, `api/parse-entity.ts`, `api/parse-entity-multi.ts` každý má vlastní `queryOllama*` (fetch + AbortController + JSON cleanup) — 4× duplikovaná logika, dá se extrahovat do sdíleného helperu.
- **Dva lockfily** — `package-lock.json` (npm) i `pnpm-lock.yaml` (pnpm) jsou tracked; README volá `npm install` ale dev skripty používají `concurrently`/`tsx` volané přes pnpm i npm. Drobné riziko driftu.
- **Screenshoty chyb v repo** — `e2e-01..04-landing.png`, `e2e-ERROR.png` tracked v rootu; patří do `test-results/` (ignorováno).
- **`.env.example` OK** — dokumentovaný `OLLAMA_API_KEY`; `.env.local` ignorován.
- **dist/ a coverage/ tracked?** — NE, v `.gitignore` (`dist/`, `coverage/`). Dobré.

## Pozorování / rizika 🔍

- **Ollama klíč v .env.local** — není v gitu (ignorován), OK.
- **Security headers závisí na vercel.json** — lokální dev server (`server/dev-server.ts`) je bez CORS restrikcí (`Access-Control-Allow-Origin: *`); pro produkci jen přes VPS/Vercel.
- **Default model v parse-entity = `gemma4:31b-cloud`** — odlišný od `deepseek-v4-flash` v chat/analyze. Konzistence modelů není zaručena.
- **Fallback `smartLocalChatFallback`** je heuristický regex — chrání před pádem beze AI, ale kvalita odpovědí beze AI je omezená.
- **Právní korektnost = blocker** (ROADMAP): fallback scanner je hardcoded na konkrétní doložky/částky; generované free-text smlouvy nejsou plně právně ověřeny. Bez ověření Fáze 1 neposílat ven (dle ROADMAP).
- **README (1.4 KB) je krátký** — popisuje funkce a strukturu správně, ale ne detailní nastavení (Ollama cloud, model, rate limity, e2e testy, právní vrstva).
- **Testy nemají pokrytí API handlerů** — testuje se jen čistá logika (validace, contracts, sanitize, sessionStore), ne api/chat/analyze/parse (ty vyžadují Ollama/OAI klíč).
- **e2e test** — `test-full-flow.mjs` (playwright, 8. 8.) existuje, ale není v package.json scripts; spouští se manuálně.

## Otevřené body pro strategistu (VSTUP pro plánování)
- Fáze 1 (Kvalita): ověření právní korektnosti, standardní šablony, validace povinných polí — **otevřeno**.
- Fáze 2 (Dokumenty): DOCX export, formátovaná editace, historie smluv — **částečně (TXT/print ano, DOCX/historie ne)**.
- Fáze 3: právní disclaimer — **otevřeno (dle ROADMAP označeno hotové, ale v kódu neověřeno)**.
