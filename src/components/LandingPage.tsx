// src/components/LandingPage.tsx
// Landing page pro Karla DocBota — Apple-style, dark, dospělý.

import React, { useState } from 'react';
import { FileText, Check, Shield } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [showPitch, setShowPitch] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col relative overflow-hidden">
      {/* Subtle centered glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c8962e]/5 blur-[120px]" />
      </div>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto space-y-10 relative z-10">
        {/* Slogan */}
        <div className="space-y-4">
          <p className="text-[#71717a] text-sm font-medium tracking-widest uppercase eyebrow">
            Smlouva je problém?
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-[#f4f4f5]">
            DocBot
            <br />
            <span className="font-normal text-[#a1a1aa]">řeší problémy.</span>
          </h1>
        </div>

        {/* CTA — hlavní akce */}
        <div className="space-y-4">
          <button
            onClick={onStart}
            className="btn-apple-primary text-base cursor-pointer"
          >
            Začít teď
            <span aria-hidden="true"> →</span>
          </button>

          <p className="text-[#71717a] text-sm">
            Žádné formuláře. Žádné vysvětlování. 15 sekund.
          </p>
        </div>

        {/* Pitch toggle */}
        <button
          onClick={() => setShowPitch(!showPitch)}
          className="text-[#71717a] hover:text-[#c8962e] text-sm transition-colors cursor-pointer underline-offset-4 hover:underline"
        >
          {showPitch ? 'Skrýt pitch deck' : 'Pro investory a partnery →'}
        </button>

        {showPitch && (
          <div className="w-full text-left apple-card p-6 space-y-5 mt-6 animate-fade-in">
            <h3 className="font-bold text-lg text-[#f4f4f5]">Pitch Deck</h3>
            <div className="space-y-4 text-sm text-[#a1a1aa]">
              <div className="flex gap-3">
                <span className="text-[#c8962e] font-bold shrink-0">01</span>
                <p>
                  <strong className="text-[#f4f4f5]">Nahá realita.</strong> Smluvní agenda je v roce 2026 stále zaseknutá v roce 1995. Nikdo nechce „psát smlouvu" — všichni chtějí jen, aby stála v PDF.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#c8962e] font-bold shrink-0">02</span>
                <p>
                  <strong className="text-[#f4f4f5]">Karel DocBot.</strong> První skutečně blbuvzdorný smluvní asistent. Multi-Source Smart Drop — Ctrl+V, foto, URL, cokoliv.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#c8962e] font-bold shrink-0">03</span>
                <p>
                  <strong className="text-[#f4f4f5]">Proč to vyhraje.</strong> Průměrný freelancer stráví 4–6h měsíčně přípravou smluv. DocBot to stlačí na 15 minut. Lock-in efekt = data jsou moat.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#c8962e] font-bold shrink-0">04</span>
                <p>
                  <strong className="text-[#f4f4f5]">The Ask.</strong> B2B partneři, komunity freelancerů, seed investoři. Demo call — 20 minut, živě.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <p className="text-[#71717a] text-sm font-medium">docbot.petrpiskacek.cloud</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Value Props ── */}
      <section className="px-6 py-14 border-t border-[rgba(255,255,255,0.06)] relative z-10">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: '15 sekund',
                desc: 'Od vizitky k podepsanému PDF',
              },
              {
                icon: Check,
                title: 'Žádné psaní',
                desc: 'Ctrl+V, foto, URL — všechno se hodí',
              },
              {
                icon: Shield,
                title: 'Právně v pořádku',
                desc: 'České právo, náležitosti v krabici',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="apple-card p-5 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[#c8962e]">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-base text-[#f4f4f5]">{title}</p>
                <p className="text-[#71717a] text-sm">{desc}</p>
              </div>
            ))}
          </div>

          {/* "Jak to funguje" — 3 kroky */}
          <div className="space-y-4">
            <p className="text-[#71717a] text-xs uppercase tracking-widest font-medium text-center eyebrow">
              Jak to funguje
            </p>
            <div className="flex items-center justify-between gap-4">
              {[
                { step: '1', label: 'Hodíš', sublabel: 'text, fotku, URL' },
                { step: '2', label: 'DocBot koukne', sublabel: 'vytáhne, co potřebuje' },
                { step: '3', label: 'Hotovo', sublabel: 'PDF bez práce' },
              ].map(({ step, label, sublabel }, i) => (
                <React.Fragment key={step}>
                  <div className="flex-1 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center font-bold text-sm text-[#f4f4f5] border border-[rgba(255,255,255,0.08)]">
                      {step}
                    </div>
                    <p className="font-medium text-sm text-[#f4f4f5]">{label}</p>
                    <p className="text-[#71717a] text-xs">{sublabel}</p>
                  </div>
                  {i < 2 && (
                    <span className="text-[#71717a] flex-shrink-0" aria-hidden="true">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="px-6 py-12 border-t border-[rgba(255,255,255,0.06)] text-center space-y-3 relative z-10">
        <button
          onClick={onStart}
          className="btn-apple-secondary text-base cursor-pointer"
        >
          Klik, klik. Klik. Ááá, klk!
        </button>
        <p className="text-[#71717a] text-sm">
          Smlouva je problém?{' '}
          <span className="font-medium text-[#f4f4f5]">DocBot řeší problémy.</span>
        </p>
      </section>

      {/* ── Trust strip ── */}
      <section className="px-6 py-8 border-t border-[rgba(255,255,255,0.06)] relative z-10">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-[#71717a] text-sm">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#a1a1aa] shrink-0" />
            Bez registrace
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#a1a1aa] shrink-0" />
            Data jen u vás
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#a1a1aa] shrink-0" />
            České právo
          </span>
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#a1a1aa] shrink-0" />
            PDF připraven
          </span>
        </div>
      </section>
    </div>
  );
}
