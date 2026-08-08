export type ContractType = 'nda' | 'rent' | 'employment' | 'work';

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ContractFields {
  // Common fields
  contractType: ContractType;

  // NDA specific
  poskytovatel?: string;
  prijemce?: string;
  predmet_tajemstvi?: string;
  smluvni_pokuta?: string;
  doba_platnosti?: string;
  rozhodne_pravo?: string;

  // Rent specific
  pronajimatel?: string;
  najemce?: string;
  predmet_najmu?: string;
  vyska_najemneho?: string;
  poplatky_sluzby?: string;
  vratna_kauce?: string;
  vypovedni_lhuta?: string;
  datum_zacatku?: string;

  // Employment specific
  zamestnavatel?: string;
  zamestnanec?: string;
  pracovni_pozice?: string;
  misto_vykonu?: string;
  datum_nastupu?: string;
  mzda?: string;
  zkusebni_doba?: string;
  pracovni_doba?: string;

  // Work specific (Smlouva o dílo)
  employerName?: string;
  employerICO?: string;
  employerAddress?: string;
  employerEmail?: string;
  employerPhone?: string;
  clientName?: string;
  clientICO?: string;
  clientAddress?: string;
  clientEmail?: string;
  workDescription?: string;
  workDeadline?: string;
  workPrice?: string;
  workVat?: string;
  paymentTerms?: string;
  workPlace?: string;
  safeguardNDA?: string;
  safeguardIP?: string;
  safeguardPenalty?: string;
  lawJurisdiction?: string;
}

export interface Risk {
  id: string;
  title: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  targetText: string; // The text in the contract to highlight/replace
  replacementText: string; // Safer text to replace with
  applied?: boolean;
}

export interface RiskAnalysisResult {
  risks: Risk[];
  safetyScore: number; // 0 - 100
  summary: string;
}
