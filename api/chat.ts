import type { VercelRequest, VercelResponse } from '@vercel/node';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_ENDPOINT = process.env.OLLAMA_API_ENDPOINT || 'https://ollama.com/api/chat';

const ndaFields = [
  { key: "poskytovatel", label: "Poskytovatel", prompt: "Jaké je celé jméno nebo název firmy Poskytovatele důvěrných informací?" },
  { key: "prijemce", label: "Příjemce", prompt: "A kdo je Příjemcem důvěrných informací? Uveďte prosím jméno nebo název firmy." },
  { key: "predmet_tajemstvi", label: "Předmět tajemství", prompt: "Co bude předmětem ochrany tajemství? (např. 'zdrojové kódy mobilní aplikace' nebo 'obchodní plány k projektu X')" },
  { key: "smluvni_pokuta", label: "Smluvní pokuta", prompt: "Jaká má být výše smluvní pokuty za případné porušení mlčenlivosti? (např. '100 000 Kč' - doporučuje se přiměřená částka)" },
  { key: "doba_platnosti", label: "Doba platnosti", prompt: "Jak dlouho má mlčenlivost po předání informací platit? (např. '3 roky od podpisu')" },
  { key: "rozhodne_pravo", label: "Rozhodné právo", prompt: "A nakonec, pod jaké rozhodné právo má dohoda spadat? (např. 'Česká republika (české právo)')" }
];

const rentFields = [
  { key: "pronajimatel", label: "Pronajímatel", prompt: "Kdo je Pronajímatelem bytu? Uveďte prosím celé jméno nebo název firmy." },
  { key: "najemce", label: "Nájemce", prompt: "Kdo bude Nájemcem bytu? Uveďte prosím celé jméno." },
  { key: "predmet_najmu", label: "Předmět nájmu", prompt: "Uveďte prosím přesnou adresu pronajímaného bytu (např. 'Spálená 23, Praha 1, byt č. 4')." },
  { key: "vyska_najemneho", label: "Výše měsíčního nájemného", prompt: "Jaká bude výše čistého měsíčního nájemného? (např. '15 000 Kč')" },
  { key: "poplatky_sluzby", label: "Zálohy na služby a energie", prompt: "Kolik činí měsíční zálohy na služby a energie? (např. '3 500 Kč')" },
  { key: "vratna_kauce", label: "Vratná kauce (Jistota)", prompt: "Jaká bude výše vratné kauce? (obvykle se dává 1 až 2 měsíční nájmy, např. '25 000 Kč')" },
  { key: "vypovedni_lhuta", label: "Výpovědní lhůta", prompt: "Jaká bude výpovědní lhůta? (zákonné minimum je '3 měsíce', doporučuje se ponechat toto nastavení)" },
  { key: "datum_zacatku", label: "Datum začátku nájmu", prompt: "Od kdy nájemní vztah začíná? (např. '1. srpna 2026')" }
];

const employmentFields = [
  { key: "zamestnavatel", label: "Zaměstnavatel", prompt: "Jaký je přesný název nebo jméno Zaměstnavatele?" },
  { key: "zamestnanec", label: "Zaměstnanec", prompt: "Uveďte prosím celé jméno Zaměstnance." },
  { key: "pracovni_pozice", label: "Pracovní pozice", prompt: "Jaká bude pracovní pozice / druh vykonávané práce? (např. 'Kurýr zásilek' nebo 'Software vývojář')" },
  { key: "misto_vykonu", label: "Místo výkonu práce", prompt: "Kde bude hlavní místo výkonu práce? (např. 'Praha' nebo konkrétní provozovna)" },
  { key: "datum_nastupu", label: "Datum nástupu", prompt: "Jaké je datum nástupu do zaměstnání? (např. '1. srpna 2026')" },
  { key: "mzda", label: "Mzda (Hrubá)", prompt: "Jaká bude výše hrubé měsíční mzdy? (např. '45 000 Kč')" },
  { key: "zkusebni_doba", label: "Zkušební doba", prompt: "Jak dlouhá bude zkušební doba? (u běžných zaměstnanců je zákonný limit max '3 měsíce')" },
  { key: "pracovni_doba", label: "Týdenní pracovní doba", prompt: "Jaká bude stanovená týdenní pracovní doba? (standardní plný úvazek je '40 hodin týdně')" }
];

const workFields = [
  { key: "employerName", label: "Zhotovitel", prompt: "Kdo bude dílo vytvářet? Uveďte celé jméno nebo název firmy." },
  { key: "employerICO", label: "IČO zhotovitele", prompt: "Jaké je IČO zhotovitele?" },
  { key: "employerAddress", label: "Adresa zhotovitele", prompt: "Jaká je adresa zhotovitele?" },
  { key: "employerEmail", label: "Email zhotovitele", prompt: "Jaký je email zhotovitele?" },
  { key: "employerPhone", label: "Telefon zhotovitele", prompt: "Jaký je telefon zhotovitele?" },
  { key: "clientName", label: "Objednatel", prompt: "Kdo dílo zadává? Uveďte celé jméno nebo název firmy objednatele." },
  { key: "clientICO", label: "IČO objednatele", prompt: "Jaké je IČO objednatele?" },
  { key: "clientAddress", label: "Adresa objednatele", prompt: "Jaká je adresa objednatele?" },
  { key: "clientEmail", label: "Email objednatele", prompt: "Jaký je email objednatele?" },
  { key: "workDescription", label: "Předmět díla", prompt: "Co přesně má být vytvořeno nebo dodáno? Popište předmět díla konkrétně." },
  { key: "workDeadline", label: "Termín dokončení", prompt: "Do kdy má být dílo hotové?" },
  { key: "workPrice", label: "Cena díla", prompt: "Jaká je dohodnutá cena díla?" },
  { key: "workVat", label: "Cena včetně DPH", prompt: "Je cena včetně DPH?" },
  { key: "paymentTerms", label: "Platební podmínky", prompt: "Jaké budou platební podmínky?" },
  { key: "workPlace", label: "Místo plnění", prompt: "Kde bude dílo předáno?" },
  { key: "safeguardNDA", label: "Doložka o mlčenlivosti", prompt: "Má smlouva obsahovat doložku o mlčenlivosti?" },
  { key: "safeguardIP", label: "Převod autorských práv", prompt: "Má se převést právo k výsledkům díla na objednatele?" },
  { key: "safeguardPenalty", label: "Sankce za prodlení", prompt: "Má smlouva obsahovat sankce za prodlení?" },
  { key: "lawJurisdiction", label: "Rozhodné právo", prompt: "Pod jaké rozhodné právo má smlouva spadat?" },
];

const adviceDict: Record<string, string> = {
  poskytovatel: "Poskytovatel důvěrných informací je strana, která vlastní tajné informace (např. zdrojové kódy, know-how, data klientů) a předává je druhé straně za účelem spolupráce. Může jít o fyzickou osobu i firmu.",
  prijemce: "Příjemce důvěrných informací je ten, kdo se seznamuje s chráněným tajemstvím a zavazuje se ho chránit před zneužitím nebo vyzrazením třetím stranám.",
  predmet_tajemstvi: "Předmět tajemství by měl být popsán dostatečně určitě, abyste v případě sporu věděli, co přesně bylo chráněno. Například: 'podrobné obchodní, technické a designové specifikace k mobilní aplikaci pro rozvoz jídla'.",
  smluvni_pokuta: "Smluvní pokuta by měla být přiměřená a reálná. U standardních dohod se obvykle dává částka od 50 000 Kč do 150 000 Kč. Pokud by byla pokuta extrémní (např. miliony u jednoduchého NDA), soud by ji mohl prohlásit za neplatnou pro rozpor s dobrými mravy.",
  doba_platnosti: "Doba platnosti mlčenlivosti určuje, jak dlouho po skončení jednání nebo spolupráce musíte tajemství držet v tajnosti. Standardně se sjednává na 3 až 5 let. Sjednání 'na věčné časy' je právně sporné a soud by jej mohl považovat za neplatné.",
  rozhodne_pravo: "Rozhodné právo určuje, kterým právním řádem se smlouva řídí a které soudy by řešily případné spory. Pro tuzemské subjekty je nejvhodnější zvolit české právo a soudy v České republice.",
  pronajimatel: "Pronajímatel je vlastník nemovitosti (bytu, domu), který ji přenechává nájemci k dočasnému užívání za úplatu (nájemné).",
  najemce: "Nájemce je osoba, která si byt najímá k bydlení a zavazuje se platit nájemné a zálohy na služby.",
  predmet_najmu: "Předmět nájmu musí být specifikován naprosto přesně - uveďte ulici, číslo popisné, město, číslo bytu, případně patro a dispozici (např. 2+kk), aby byla smlouva nezpochybnitelná.",
  vyska_najemneho: "Výše nájemného se sjednává pevnou měsíční částkou. Obvykle se platí předem, nejpozději do 5. dne příslušného měsíce. Neobsahuje poplatky za služby.",
  poplatky_sluzby: "Zálohy na služby zahrnují energie, vodu, odvoz odpadu, úklid společných prostor atd. Doporučuje se sjednat, že tyto poplatky budou pronajímatelem jednou ročně řádně vyúčtovány podle skutečné spotřeby.",
  vratna_kauce: "Vratná kauce (jistota) slouží ke krytí případných dluhů na nájemném nebo poškození bytu. Podle zákona smí činit maximálně 3 měsíční nájmy, standardně se sjednává ve výši 1 až 2 měsíčních nájmů.",
  vypovedni_lhuta: "Podle občanského zákoníku je minimální výpovědní lhůta u nájmu bytu 3 měsíce. Začíná běžet prvním dnem měsíce následujícího po doručení výpovědi. Kratší lhůta by byla neplatná.",
  datum_zacatku: "Uveďte den, od kterého máte právo v bytě bydlet a začíná vám běžet povinnost platit nájemné. Může to být např. '1. srpna 2026' nebo 'dnem podpisu smlouvy'.",
  zamestnavatel: "Zaměstnavatel je firma (s.r.o., a.s.) nebo fyzická osoba podnikající (OSVČ), která dává zaměstnanci práci, platí mu mzdu a odvádí za něj pojištění.",
  zamestnanec: "Zaměstnanec je fyzická osoba, která pro zaměstnavatele vykonává závislou práci podle jeho pokynů.",
  pracovni_pozice: "Druh práce (pracovní pozice) musí být definován dostatečně jasně. Může jít o jednu pozici (např. 'Software vývojář') nebo širší okruh činností.",
  misto_vykonu: "Místo výkonu práce určuje, kam jste povinni docházet. Mělo by být definováno konkrétně (např. 'Praha' nebo konkrétní provozovna). Příliš široké místo (např. 'celá ČR') dává zaměstnavateli právo vysílat vás bez souhlasu na daleké pracovní cesty.",
  datum_nastupu: "Datum nástupu je den, kdy vzniká pracovní poměr a jste povinni začít vykonávat práci. Od tohoto dne vzniká nárok na mzdu.",
  mzda: "Mzda se sjednává jako hrubá měsíční nebo hodinová částka. Může být sjednána přímo ve smlouvě, nebo určena mzdovým výměrem. Sjednání ve smlouvě je pro zaměstnance výhodnější, protože ji zaměstnavatel nemůže jednostranně změnit.",
  zkusebni_doba: "Zkušební doba slouží oběma stranám k vyzkoušení spolupráce. U běžných zaměstnanců nesmí být delší než 3 měsíce. Nelze ji sjednat zpětně ani ji dodatečně prodlužovat.",
  pracovni_doba: "Standardní týdenní pracovní doba při plném úvazku činí 40 hodin týdně. Je možné sjednat i zkrácený úvazek.",
  employerName: "Zhotovitel je osoba nebo firma, která dílo vytváří. Uveďte přesný název nebo jméno. U fyzické osoby doplněte i bydliště.",
  employerICO: "IČO zhotovitele se uvádí pro identifikaci. U OSVČ je to IČO živnosti, u firmy IČO z obchodního rejstříku.",
  clientName: "Objednatel je strana, která dílo objednává a platí za něj. Obvykle firma, může být i fyzická osoba.",
  clientICO: "IČO objednatele. Uveďte, pokud je objednatelem firma nebo podnikající fyzická osoba.",
  workDescription: "Předmět díla popište konkrétně. Čím přesnější popis, tím méně sporů. Uveďte rozsah, formu předání a případné milníky.",
  workDeadline: "Termín dokončení by měl být jasný a měřitelný. Doporučuje se uvést datum předání finální verze.",
  workPrice: "Cena díla může být pevná, hodinová nebo kombinovaná. Uveďte, zda je včetně či bez DPH, a měnu.",
  paymentTerms: "Platební podmínky chrání obě strany. Standardně se sjednává záloha 30–50 % před zahájením a doplatek po předání.",
  workPlace: "Místo plnění určuje, kde a jak se dílo předává. Může být elektronicky (email/cloud) nebo fyzicky.",
  safeguardNDA: "Doložka o mlčenlivosti chrání obchodní tajemství a know-how. Doporučuje se u citlivých projektů.",
  safeguardIP: "Převod autorských práv zajišťuje, že objednatel získá práva k výsledkům díla. Bez ní zůstává autor u zhotovitele.",
  safeguardPenalty: "Sankce za prodlení motivuje zhotovitele dodržet termín. Měla by být přiměřená, ne trestná.",
  lawJurisdiction: "Rozhodné právo určuje, který právní řád se použije při sporu. Pro české smluvní vztahy doporučujeme české právo."
};

function smartLocalChatFallback(contractType: string, messages: any[], currentFields: any) {
  const fieldsList = contractType === "nda" ? ndaFields : contractType === "rent" ? rentFields : contractType === "work" ? workFields : employmentFields;
  const emptyFields = fieldsList.filter(f => !currentFields[f.key] || currentFields[f.key].trim() === '');
  const userMessage = messages[messages.length - 1];
  const userText = userMessage ? userMessage.text.trim() : "";
  const isQuestion = userText.endsWith("?") || /co je|vysvětli|jak|proč|kdy|kolik|kde|porad|doporuč|stane|musím|co to/i.test(userText);

  if (emptyFields.length > 0) {
    const currentField = emptyFields[0];
    if (isQuestion) {
      const advice = adviceDict[currentField.key] || "S tímto údajem vám rád poradím. Uveďte prosím standardní text nebo hodnotu.";
      return {
        reply: `${advice}\n\n**Zadejte prosím:** ${currentField.prompt}`,
        extractedFields: {},
        lastUpdatedField: "",
        isFinished: false,
        nextSuggestedPrompts: ["Použít doporučené", "Vysvětlit více", "Přeskočit"]
      };
    }
    const cleanVal = userText.replace(/^(jmenuji se|jmenuje se|bude to|bude|nazev je|název je|je to|je|nastav na|nastav|hodnota je)\s+/i, "").trim();
    const updatedExtracted: Record<string, string> = { [currentField.key]: cleanVal };
    const remainingEmpty = emptyFields.slice(1);
    if (remainingEmpty.length > 0) {
      const nextField = remainingEmpty[0];
      return {
        reply: `Uložil(a) jsem hodnotu pro **${fieldsList.find(f => f.key === currentField.key)?.label || currentField.key}**: „${cleanVal}“.\n\nNyní přejdeme k dalšímu kroku:\n**${nextField.prompt}**`,
        extractedFields: updatedExtracted,
        lastUpdatedField: currentField.key,
        isFinished: false,
        nextSuggestedPrompts: ["Ano, rozumím", "Vysvětlit tento krok", "Resetovat údaje"]
      };
    } else {
      return {
        reply: `Skvělé! Všechny potřebné údaje byly úspěšně shromážděny. Vaše smlouva je kompletní a připravena v pravém panelu k náhledu.\n\nDoporučuji nyní nahoře přepnout na záložku „AI Kontrola rizik“ a nechat smlouvu zkontrolovat na případné nevýhodné doložky.`,
        extractedFields: updatedExtracted,
        lastUpdatedField: currentField.key,
        isFinished: true,
        nextSuggestedPrompts: ["Analyzovat rizika smlouvy", "Resetovat smlouvu", "Jaká jsou rizika?"]
      };
    }
  }

  // No empty fields — check for update intent
  const fieldPatterns: [RegExp, string][] = [
    [/pokut/i, "smluvni_pokuta"], [/poskytovatel/i, "poskytovatel"],
    [/příjemce|prijemce/i, "prijemce"], [/doba|platnost|trvání|trvani/i, "doba_platnosti"],
    [/právo|pravo|jurisdikce/i, "rozhodne_pravo"], [/pronajímatel|pronajimatel/i, "pronajimatel"],
    [/nájemce|najemce/i, "najemce"], [/předmět nájmu|predmet najmu|adresa|byt/i, "predmet_najmu"],
    [/nájemné|najemne|výše nájmu/i, "vyska_najemneho"], [/služby|sluzby|poplatky/i, "poplatky_sluzby"],
    [/kauce|jistot/i, "vratna_kauce"], [/výpověď|vypoved/i, "vypovedni_lhuta"],
    [/začátek|zacatek|datum začátku/i, "datum_zacatku"], [/zaměstnavatel|zamestnavatel/i, "zamestnavatel"],
    [/zaměstnanec|zamestnanec/i, "zamestnanec"], [/pozice|druh práce/i, "pracovni_pozice"],
    [/místo výkonu|misto vykonu/i, "misto_vykonu"], [/nástup|nastup|datum nástupu/i, "datum_nastupu"],
    [/mzda|plat/i, "mzda"], [/zkušební|zkusebni/i, "zkusebni_doba"],
    [/pracovní doba|pracovni doba/i, "pracovni_doba"],
    [/zhotovitel/i, "employerName"], [/objednatel/i, "clientName"],
    [/předmět díla|predmet dla|popis praci|popis práci|co dodáš/i, "workDescription"],
    [/termín|termin|deadline/i, "workDeadline"], [/cena|honorář|honorar/i, "workPrice"],
    [/DPH|vat/i, "workVat"], [/platba|záloha|zbytek|splátk/i, "paymentTerms"],
    [/místo plnění|misto plneni/i, "workPlace"], [/mlčenlivost|mlcenlivost|NDA/i, "safeguardNDA"],
    [/autorská práva|autorska prava|převod práv/i, "safeguardIP"],
    [/sankce|prodlení|prodeleni|penále/i, "safeguardPenalty"]
  ];

  for (const [pattern, fieldKey] of fieldPatterns) {
    if (pattern.test(userText)) {
      const extractedValue = userText.replace(/.*(na |bude |změň|zmen|uprav|je )\s*/i, "").trim();
      return {
        reply: `Úspěšně jsem upravil(a) pole **${fieldsList.find(f => f.key === fieldKey)?.label || fieldKey}** na: „${extractedValue}“. Smlouva se automaticky aktualizovala.`,
        extractedFields: { [fieldKey]: extractedValue },
        lastUpdatedField: fieldKey,
        isFinished: true,
        nextSuggestedPrompts: ["Spustit analýzu rizik", "Změnit jiný údaj", "Vytisknout smlouvu"]
      };
    }
  }

  return {
    reply: `Smlouva je již kompletně sestavena! Můžete si ji prohlédnout v pravém panelu, stáhnout nebo vytisknout. Pokud chcete nějaké údaje změnit, stačí mi napsat (např. 'Změň smluvní pokutu na 80 000 Kč').`,
    extractedFields: {},
    lastUpdatedField: "",
    isFinished: true,
    nextSuggestedPrompts: ["Spustit analýzu rizik", "Jaká jsou rizika?", "Resetovat smlouvu"]
  };
}

async function queryOllamaChat(model: string, systemInstruction: string, messages: any[], jsonFormat: boolean = false): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY not configured");
  }

  const body: any = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text
      }))
    ],
    stream: false,
    options: { temperature: 0.3 }
  };

  if (jsonFormat) {
    body.format = "json";
  }

  const response = await fetch(OLLAMA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OLLAMA_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return data?.message?.content || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractType, messages, currentFields, selectedModel } = req.body;
    const modelToUse = selectedModel || "deepseek-v4-flash";

    if (!contractType) {
      return res.status(400).json({ error: "contractType is required" });
    }

    let fieldsToCollect = "";
    if (contractType === "nda") {
      fieldsToCollect = `
        - poskytovatel: Jméno či firma Poskytovatele informací
        - prijemce: Jméno či firma Příjemce informací
        - predmet_tajemstvi: O jaké tajemství nebo projekt jde
        - smluvni_pokuta: Výše smluvní pokuty za porušení mlčenlivosti
        - doba_platnosti: Jak dlouho mlčenlivost trvá
        - rozhodne_pravo: Rozhodné právo
      `;
    } else if (contractType === "rent") {
      fieldsToCollect = `
        - pronajimatel: Jméno či firma pronajímatele bytu
        - najemce: Jméno nájemce
        - predmet_najmu: Přesná adresa bytu a specifikace
        - vyska_najemneho: Měsíční nájemné
        - poplatky_sluzby: Zálohy na služby a energie
        - vratna_kauce: Vratná jistota / kauce
        - vypovedni_lhuta: Výpovědní lhůta
        - datum_zacatku: Datum, od kdy nájem začíná
      `;
    } else if (contractType === "employment") {
      fieldsToCollect = `
        - zamestnavatel: Název či jméno zaměstnavatele
        - zamestnanec: Jméno zaměstnance
        - pracovni_pozice: Pracovní pozice / druh práce
        - misto_vykonu: Místo výkonu práce
        - datum_nastupu: Datum nástupu do práce
        - mzda: Výše měsíční mzdy
        - zkusebni_doba: Délka zkušební doby
        - pracovni_doba: Týdenní pracovní doba
      `;
    } else if (contractType === "work") {
      fieldsToCollect = `
        - employerName: Zhotovitel (kdo dílo vytváří)
        - employerICO: IČO zhotovitele
        - employerAddress: Adresa zhotovitele
        - employerEmail: Email zhotovitele
        - employerPhone: Telefon zhotovitele
        - clientName: Objednatel (kdo dílo zadává)
        - clientICO: IČO objednatele
        - clientAddress: Adresa objednatele
        - clientEmail: Email objednatele
        - workDescription: Předmět díla
        - workDeadline: Termín dokončení
        - workPrice: Cena díla
        - workVat: Cena včetně DPH?
        - paymentTerms: Platební podmínky
        - workPlace: Místo plnění
        - safeguardNDA: Doložka o mlčenlivosti
        - safeguardIP: Převod autorských práv
        - safeguardPenalty: Sankce za prodlení
        - lawJurisdiction: Rozhodné právo
      `;
    }

    const systemInstruction = `Jsi DocuGenius AI, vysoce kvalifikovaný a zkušený právní asistent pro tvorbu smluv v České republice.
Tvým úkolem je vést s uživatelem přátelský rozhovor a pomoci mu krok za krokem sestavit kvalitní smlouvu typu: ${contractType.toUpperCase()}.

Zde jsou pole, která se snažíme posbírat:
${fieldsToCollect}

Aktuální hodnoty, které již známe:
${JSON.stringify(currentFields, null, 2)}

Tvoje striktní pravidla chování:
1. Komunikuj výhradně česky, srozumitelně, přátelsky a profesionálně.
2. Ptej se VŽDY na JEDNU informaci po druhé.
3. Pokud ti uživatel poskytne hodnotu, vytáhni ji a přidej ji do objektu 'extractedFields' v odpovědi.
4. Pokud ti uživatel položí dotaz týkající se nějakého ustanovení, vysvětli mu ho lidsky a poraď mu.
5. Objekt 'extractedFields' smí obsahovat POUZE nově zjištěná nebo upravená pole v tomto kroku.
6. V 'lastUpdatedField' uveď název klíče, který byl v tomto kroku úspěšně zapsán.
7. V 'nextSuggestedPrompts' navrhni 2 až 3 krátké, kontextové české fráze.
8. Když jsou všechna důležitá pole vyplněna, nastav 'isFinished' na true.

Odpověz VŽDY jako validní JSON dokument s těmito klíči: "reply", "extractedFields", "lastUpdatedField", "isFinished", "nextSuggestedPrompts".`;

    const lastUserText = messages[messages.length - 1]?.text || "";
    const prompt = `Uživatel píše: "${lastUserText}"
Aktuální pole smlouvy: ${JSON.stringify(currentFields)}`;

    try {
      const responseText = await queryOllamaChat(modelToUse, systemInstruction, messages, true);
      if (responseText) {
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        return res.json(parsed);
      }
    } catch (aiErr: any) {
      console.warn(`AI call failed for model ${modelToUse}:`, aiErr.message);
    }

    // Fallback
    const fallbackRes = smartLocalChatFallback(contractType, messages, currentFields);
    res.json(fallbackRes);

  } catch (error: any) {
    console.error("Error in DocBot Chat API:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
}
