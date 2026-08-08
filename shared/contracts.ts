/**
 * SHARED CONTRACT DEFINITIONS
 * 
 * Single source of truth for ALL contract field definitions, labels, prompts,
 * advice dictionary, and titles. Imported by both:
 * - src/lib/contracts.ts (client-side)
 * - api/chat.ts (server-side Vercel functions)
 * 
 * NEVER duplicate field definitions in api/ or src/ again.
 * Add new contract types HERE and everything updates automatically.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type ContractType = 'nda' | 'rent' | 'employment' | 'work';

export interface FieldDefinition {
  key: string;
  label: string;
  prompt: string;
  defaultValue: string;
  placeholder?: string;
}

// ─── NDA ────────────────────────────────────────────────────────────

export const NDA_FIELDS: FieldDefinition[] = [
  {
    key: 'poskytovatel',
    label: 'Poskytovatel informací',
    prompt: 'Jaké je celé jméno nebo název firmy Poskytovatele důvěrných informací?',
    defaultValue: '',
    placeholder: 'např. Inovativní Startup s.r.o.',
  },
  {
    key: 'prijemce',
    label: 'Příjemce informací',
    prompt: 'A kdo je Příjemcem důvěrných informací? Uveďte prosím jméno nebo název firmy.',
    defaultValue: '',
    placeholder: 'např. Jan Horký',
  },
  {
    key: 'predmet_tajemstvi',
    label: 'Předmět tajemství / Účel',
    prompt: 'Co bude předmětem ochrany tajemství? (např. "zdrojové kódy mobilní aplikace" nebo "obchodní plány k projektu X")',
    defaultValue: '',
    placeholder: 'např. zdrojové kódy a designové podklady',
  },
  {
    key: 'smluvni_pokuta',
    label: 'Smluvní pokuta',
    prompt: 'Jaká má být výše smluvní pokuty za případné porušení mlčenlivosti? (např. "100 000 Kč" - doporučuje se přiměřená částka)',
    defaultValue: '50 000 Kč',
    placeholder: 'např. 100 000 Kč',
  },
  {
    key: 'doba_platnosti',
    label: 'Doba platnosti / Trvání',
    prompt: 'Jak dlouho má mlčenlivost po předání informací platit? (např. "3 roky od podpisu")',
    defaultValue: '3 roky od podpisu',
    placeholder: 'např. 5 let od ukončení spolupráce',
  },
  {
    key: 'rozhodne_pravo',
    label: 'Rozhodné právo',
    prompt: 'A nakonec, pod jaké rozhodné právo má dohoda spadat? (např. "Česká republika (české právo)")',
    defaultValue: 'Česká republika (české právo)',
    placeholder: 'např. Česká republika (české právo)',
  },
];

// ─── RENT ───────────────────────────────────────────────────────────

export const RENT_FIELDS: FieldDefinition[] = [
  {
    key: 'pronajimatel',
    label: 'Pronajímatel',
    prompt: 'Kdo je Pronajímatelem bytu? Uveďte prosím celé jméno nebo název firmy.',
    defaultValue: '',
    placeholder: 'např. Jaroslav Bohatý',
  },
  {
    key: 'najemce',
    label: 'Nájemce',
    prompt: 'Kdo bude Nájemcem bytu? Uveďte prosím celé jméno.',
    defaultValue: '',
    placeholder: 'např. Květoslav Chudý',
  },
  {
    key: 'predmet_najmu',
    label: 'Předmět nájmu / Adresa',
    prompt: 'Uveďte prosím přesnou adresu pronajímaného bytu (např. "Spálená 23, Praha 1, byt č. 4").',
    defaultValue: '',
    placeholder: 'např. Spálená 23, Praha 1, byt č. 4',
  },
  {
    key: 'vyska_najemneho',
    label: 'Výše měsíčního nájemného',
    prompt: 'Jaká bude výše čistého měsíčního nájemného? (např. "15 000 Kč")',
    defaultValue: '',
    placeholder: 'např. 15 000 Kč',
  },
  {
    key: 'poplatky_sluzby',
    label: 'Zálohy na služby a energie',
    prompt: 'Kolik činí měsíční zálohy na služby a energie? (např. "3 500 Kč")',
    defaultValue: '',
    placeholder: 'např. 3 500 Kč',
  },
  {
    key: 'vratna_kauce',
    label: 'Vratná kauce (Jistota)',
    prompt: 'Jaká bude výše vratné kauce? (obvykle se dává 1 až 2 měsíční nájmy, např. "25 000 Kč")',
    defaultValue: '',
    placeholder: 'např. 25 000 Kč',
  },
  {
    key: 'vypovedni_lhuta',
    label: 'Výpovědní lhůta',
    prompt: 'Jaká bude výpovědní lhůta? (zákonné minimum je "3 měsíce", doporučuje se ponechat toto nastavení)',
    defaultValue: '3 měsíce',
    placeholder: 'např. 3 měsíce',
  },
  {
    key: 'datum_zacatku',
    label: 'Datum začátku nájmu',
    prompt: 'Od kdy nájemní vztah začíná? (např. "1. srpna 2026")',
    defaultValue: '',
    placeholder: 'např. 1. srpna 2026',
  },
];

// ─── EMPLOYMENT ─────────────────────────────────────────────────────

export const EMPLOYMENT_FIELDS: FieldDefinition[] = [
  {
    key: 'zamestnavatel',
    label: 'Zaměstnavatel',
    prompt: 'Jaký je přesný název nebo jméno Zaměstnavatele?',
    defaultValue: '',
    placeholder: 'např. Rychlá Logistika a.s.',
  },
  {
    key: 'zamestnanec',
    label: 'Zaměstnanec',
    prompt: 'Uveďte prosím celé jméno Zaměstnance.',
    defaultValue: '',
    placeholder: 'např. Pavel Rychlý',
  },
  {
    key: 'pracovni_pozice',
    label: 'Pracovní pozice',
    prompt: 'Jaká bude pracovní pozice / druh vykonávané práce? (např. "Kurýr zásilek" nebo "Software vývojář")',
    defaultValue: '',
    placeholder: 'např. Software vývojář',
  },
  {
    key: 'misto_vykonu',
    label: 'Místo výkonu práce',
    prompt: 'Kde bude hlavní místo výkonu práce? (např. "Praha" nebo konkrétní provozovna)',
    defaultValue: '',
    placeholder: 'např. Praha',
  },
  {
    key: 'datum_nastupu',
    label: 'Datum nástupu do práce',
    prompt: 'Jaké je datum nástupu do zaměstnání? (např. "1. srpna 2026")',
    defaultValue: '',
    placeholder: 'např. 1. srpna 2026',
  },
  {
    key: 'mzda',
    label: 'Mzda (Hrubý měsíční plat)',
    prompt: 'Jaká bude výše hrubé měsíční mzdy? (např. "45 000 Kč")',
    defaultValue: '',
    placeholder: 'např. 45 000 Kč',
  },
  {
    key: 'zkusebni_doba',
    label: 'Zkušební doba',
    prompt: 'Jak dlouhá bude zkušební doba? (u běžných zaměstnanců je zákonný limit max "3 měsíce")',
    defaultValue: '3 měsíce',
    placeholder: 'např. 3 měsíce (max. zákonný limit)',
  },
  {
    key: 'pracovni_doba',
    label: 'Týdenní pracovní doba',
    prompt: 'Jaká bude stanovená týdenní pracovní doba? (standardní plný úvazek je "40 hodin týdně")',
    defaultValue: '40 hodin týdně',
    placeholder: 'např. 40 hodin týdně',
  },
];

// ─── WORK (Smlouva o dílo) ─────────────────────────────────────────

export const WORK_FIELDS: FieldDefinition[] = [
  {
    key: 'employerName',
    label: 'Zhotovitel',
    prompt: 'Kdo bude dílo vytvářet? Uveďte celé jméno nebo název firmy.',
    defaultValue: '',
    placeholder: 'např. Pepa Vývojář s.r.o.',
  },
  {
    key: 'employerICO',
    label: 'IČO zhotovitele',
    prompt: 'Jaké je IČO zhotovitele?',
    defaultValue: '',
    placeholder: 'např. 12345678',
  },
  {
    key: 'employerAddress',
    label: 'Adresa zhotovitele',
    prompt: 'Jaká je adresa zhotovitele?',
    defaultValue: '',
    placeholder: 'např. Ulice 123, Praha',
  },
  {
    key: 'employerEmail',
    label: 'Email zhotovitele',
    prompt: 'Jaký je email zhotovitele?',
    defaultValue: '',
    placeholder: 'např. info@firma.cz',
  },
  {
    key: 'employerPhone',
    label: 'Telefon zhotovitele',
    prompt: 'Jaký je telefon zhotovitele?',
    defaultValue: '',
    placeholder: 'např. +420 123 456 789',
  },
  {
    key: 'clientName',
    label: 'Objednatel',
    prompt: 'Kdo dílo zadává? Uveďte celé jméno nebo název firmy objednatele.',
    defaultValue: '',
    placeholder: 'např. Firma Klient a.s.',
  },
  {
    key: 'clientICO',
    label: 'IČO objednatele',
    prompt: 'Jaké je IČO objednatele?',
    defaultValue: '',
    placeholder: 'např. 87654321',
  },
  {
    key: 'clientAddress',
    label: 'Adresa objednatele',
    prompt: 'Jaká je adresa objednatele?',
    defaultValue: '',
    placeholder: 'např. Náměstí 1, Brno',
  },
  {
    key: 'clientEmail',
    label: 'Email objednatele',
    prompt: 'Jaký je email objednatele?',
    defaultValue: '',
    placeholder: 'např. objednavatel@klient.cz',
  },
  {
    key: 'workDescription',
    label: 'Předmět díla',
    prompt: 'Co přesně má být vytvořeno nebo dodáno? Popište předmět díla konkrétně.',
    defaultValue: '',
    placeholder: 'např. Vývoj mobilní aplikace pro iOS a Android',
  },
  {
    key: 'workDeadline',
    label: 'Termín dokončení',
    prompt: 'Do kdy má být dílo hotové?',
    defaultValue: '',
    placeholder: 'např. 31. prosince 2026',
  },
  {
    key: 'workPrice',
    label: 'Cena díla',
    prompt: 'Jaká je dohodnutá cena díla?',
    defaultValue: '',
    placeholder: 'např. 50 000 Kč',
  },
  {
    key: 'workVat',
    label: 'Cena včetně DPH',
    prompt: 'Je cena včetně DPH?',
    defaultValue: 'Ne',
    placeholder: 'Ano / Ne / Neplatí DPH',
  },
  {
    key: 'paymentTerms',
    label: 'Platební podmínky',
    prompt: 'Jaké budou platební podmínky?',
    defaultValue: '',
    placeholder: 'např. Záloha 50 % před zahájením, zbytek po předání',
  },
  {
    key: 'workPlace',
    label: 'Místo plnění',
    prompt: 'Kde bude dílo předáno?',
    defaultValue: '',
    placeholder: 'např. Sídlo objednatele v Praze',
  },
  {
    key: 'safeguardNDA',
    label: 'Doložka o mlčenlivosti',
    prompt: 'Má smlouva obsahovat doložku o mlčenlivosti?',
    defaultValue: 'Ano',
    placeholder: 'Ano / Ne',
  },
  {
    key: 'safeguardIP',
    label: 'Převod autorských práv',
    prompt: 'Má se převést právo k výsledkům díla na objednatele?',
    defaultValue: 'Ano',
    placeholder: 'Ano / Ne',
  },
  {
    key: 'safeguardPenalty',
    label: 'Sankce za prodlení',
    prompt: 'Má smlouva obsahovat sankce za prodlení?',
    defaultValue: 'Ano',
    placeholder: 'Ano / Ne',
  },
  {
    key: 'lawJurisdiction',
    label: 'Rozhodné právo',
    prompt: 'Pod jaké rozhodné právo má smlouva spadat?',
    defaultValue: 'Česká republika (české právo)',
    placeholder: 'např. Česká republika (české právo)',
  },
];

// ─── Schema Registry ────────────────────────────────────────────────

export const SCHEMAS: Record<ContractType, FieldDefinition[]> = {
  nda: NDA_FIELDS,
  rent: RENT_FIELDS,
  employment: EMPLOYMENT_FIELDS,
  work: WORK_FIELDS,
};

export const TITLES: Record<ContractType, string> = {
  nda: 'Dohoda o ochraně důvěrných informací (NDA)',
  rent: 'Nájemní smlouva na byt',
  employment: 'Pracovní smlouva',
  work: 'Smlouvu o dílo',
};

// ─── Advice Dictionary ──────────────────────────────────────────────

export const ADVICE_DICT: Record<string, string> = {
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
  lawJurisdiction: "Rozhodné právo určuje, který právní řád se použije při sporu. Pro české smluvní vztahy doporučujeme české právo.",
};

// ─── Accessor Helpers ───────────────────────────────────────────────

export function getFieldsForType(type: ContractType): FieldDefinition[] {
  return SCHEMAS[type];
}

export function getFieldKeys(type: ContractType): string[] {
  return SCHEMAS[type].map(f => f.key);
}

export function getTitle(type: ContractType): string {
  return TITLES[type];
}

export function getAdvice(key: string): string {
  return ADVICE_DICT[key] || '';
}
