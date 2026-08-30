# Projekt: karel-docbot

> **Strategist roadmap** (2026-08-30) — vychází z `planner/state.md` (Archivist audit: test 57/57 PASS, lint exit 0, build exit 0, git clean).
> Produkt: AI asistent pro tvorbu českých smluv (NDA, nájemní, pracovní, dílo). React 19 + Vite 6 + Vercel serverless + Ollama cloud.
> Režim: roadmapa = výstup pro Buildera (atomické tasky ~5 min, každý samostatně odškrtnutelný).

## Fáze A: Základ (stabilita a bezpečnost)

- [ ] **A1** Unifikovat default model LLM na `deepseek-v4-flash` napříč všemi API soubory (chat.ts, analyze-risks.ts, parse-entity.ts, parse-entity-multi.ts aktuálně používají různé modely včetně `gemma4:31b-cloud`). Hotovo když: `grep -rn "31b-cloud\|defaultModel\|OLLAMA_MODEL" api/ shared/` najde jediný default model definovaný v jednom sdíleném místě. (5 min)
- [ ] **A2** Vyřešit duplicitní lockfily — rozhodnout mezi npm a pnpm, jeden odstranit. Hotovo když: v repo rootu je jen jeden z `package-lock.json`/`pnpm-lock.yaml` a README používá s ním konzistentní příkaz. (5 min)
- [ ] **A3** Přesunout e2e screenshoty (`e2e-*.png`) z repo rootu do `test-results/` a přidat `test-results/` do `.gitignore`. Hotovo když: `ls *.png` v rootu je prázdný a `git status` je čistý (soubory untracked → ignorované). (5 min)
- [ ] **A4** Extrahovat duplicitní `queryOllama*` logiku do sdíleného helperu (např. `shared/ollama.ts`) a použít ho ve 4 API souborech. Hotovo když: `grep -c "fetch\|AbortController" api/chat.ts api/analyze-risks.ts api/parse-entity.ts api/parse-entity-multi.ts` ukazuje jen jedno volání helperu, ne 4 duplicitní bloky, a `npm test` stále 57/57 PASS. (5 min)
- [ ] **A5** Rozhodnout osud rate limiteru — dokumentovat v kódu, že in-memory `shared/rateLimit.ts` je pro single-user nasazení OK, ale pro produkci vyžaduje Vercel KV/Upstash Redis. Hotovo když: TODO komentář v `shared/rateLimit.ts` (již existuje) je doplněn o konkrétní rozhodnutí a odkaz. (5 min)

## Fáze B: Funkce (odemkne prodej pitchi)

- [ ] **B1** Právní disclaimer banner — přidat viditelné upozornění v LandingPage a dokumentu preview ("Nejsme právní poradna, dokument prověřte advokátem"). Hotovo když: grep `disclaimer` v `src/components/` najde banner komponentu zobrazenou u generovaného dokumentu. (5 min)
- [ ] **B2** Export do DOCX — rozšířit `DocumentPreview.tsx` o tlačítko "Stáhnout DOCX" vedle stávajícího TXT. Hotovo když: kliknutí vygeneruje `.docx` soubor (využít library jako `docx` npm balík na formátované generování). (5 min)
- [ ] **B3** Historie smluv — přidat seznam uložených smluv (rozpracovaných i dokončených) v session store. Hotovo když: uživatel vidí seznam dříve vytvořených smluv a může se k nim vrátit (bez vymazání při nové session). (5 min)
- [ ] **B4** Formátovaná editace finálního dokumentu — místo jen TXT/print umožnit editaci vygenerovaného textu přímo v UI před exportem. Hotovo když: uživatel může upravit libovolné pole/větu dokumentu a ta se promítne do exportu. (5 min)

## Fáze C: Marketing (pitch je napsaný — teď ho produkt musí potvrdit)

- [ ] **C1** OG image — přidat `public/og.png` (1200×630, název produktu) + meta tag v `index.html`. Hotovo když: sdílení URL na sociálních sítích ukazuje obrázek. (5 min)
- [ ] **C2** LandingPage copy — vyladit headline a subheadline na "Smlouvy za 3 minuty místo 40" s důrazem na hodnotu (čas/peníze/nervy) ne technické detaily. Hotovo když: landing obsahuje jasnou value proposition a CTA "Začít". (5 min)
- [ ] **C3** Rozšířit README — doplnit konkrétní nastavení: Ollama cloud klíč (.env), model, rate limity, spuštění e2e testu (`node --import tsx test-full-flow.mjs`), právní vrstvu. Hotovo když: README pokrývá tyto sekce (dle state.md je teď README krátké 1.4 KB). (5 min)

## Fáze D: Dokumentace (maintainability a důvěra)

- [ ] **D1** Přidat testy pro API handler fallback logiku bez reálného Ollama klíče (mock `queryOllama`/fetch, otestovat `smartLocalChatFallback` a fallback scanner v analyze-risks). Hotovo když: nové testy pokrývají fallback cesty a `npm test` → celkově >57 PASS. (5 min)
- [ ] **D2** Zajistit konzistenci ROADMAP vs kód — po dokončení Fáze B ověřit, že každý odškrtnutý task odpovídá realitě (dle pravidla "neinventovat"). Hotovo když: ROADMAP status odpovídá skutečnému kódu. (5 min)

## Poznámky (strategie)

- **Byznys priorita:** Fáze B1 (právní disclaimer) je PRÁVNÍ blocker pro nasazení ven — bez něj nelze nikomu smlouvu poslat. To je zároveň věc, kterou pitch SVOBODA & WILLIAMS slibuje.
- **Marketingově chytře:** pitch cílí na realitní kancelář (nájemní smlouvy). Produkt to musí potvrdit — C1 (OG image) a C2 (landing copy) posilují vnímání při případném demu.
- **Závislosti:** A1/A4 (model + duplikace) jsou předpoklad pro stabilní chování; B1 právní disclaimer je předpoklad pro jakýkoli externí prodej; C závisí na B (neprodávat nehotový produkt).
- **Neinventovat:** ROADMAP neslibuje nic, co by v state.md nebylo doloženo jako chybějící/rozbité.
