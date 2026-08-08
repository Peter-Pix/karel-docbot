// src/components/LandingPage.tsx
// Landing page pro Karla DocBota — Apple-style, dospělý, důvěryhodný.

import React, { useState } from 'react';
import { FileText, Check, Shield } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [showPitch, setShowPitch] = useState(false);

  return (
    <div className="min-h-screen bg-white text-zinc-950 flex flex-col">
      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto space-y-10">
        {/* Slogan */}
        <div className="space-y-4">
          <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">
            Smlouva je problém?
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-zinc-950">
            DocBot
            <br />
            <span className="font-normal">řeší problémy.</span>
          </h1>
        </div>

        {/* CTA — hlavní akce */}
        <div className="space-y-4">
          <button
            onClick={onStart}
            className="px-8 py-3.5 bg-zinc-950 hover:bg-zinc-900 text-white font-semibold text-base rounded-xl transition-colors duration-150 cursor-pointer"
          >
            Začít teď
            <span aria-hidden="true"> →</span>
          </button>

          <p className="text-zinc-500 text-sm">
            Žádné formuláře. Žádné vysvětlování. 15 sekund.
          </p>
        </div>

        {/* Pitch toggle */}
        <button
          onClick={() => setShowPitch(!showPitch)}
          className="text-zinc-500 hover:text-zinc-700 text-sm transition-colors cursor-pointer underline-offset-2 hover:underline"
        >
          {showPitch ? 'Skrýt pitch deck' : 'Pro investory a partnery →'}
        </button>

        {showPitch && (
          <div className="w-full text-left bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-5 mt-6">
            <h3 className="font-bold text-lg text-zinc-950">Pitch Deck</h3>
            <div className="space-y-4 text-sm text-zinc-600">
              <div className="flex gap-3">
                <span className="text-zinc-400 font-bold shrink-0">01</span>
                <p>
                  <strong className="text-zinc-950">Nahá realita.</strong> Smluvní agenda je v roce 2026 stále zaseknutá v roce 1995. Nikdo nechce „psát smlouvu" — všichni chtějí jen, aby stála v PDF.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-400 font-bold shrink-0">02</span>
                <p>
                  <strong className="text-zinc-950">Karel DocBot.</strong> První skutečně blbuvzdorný smluvní asistent. Multi-Source Smart Drop — Ctrl+V, foto, URL, cokoliv.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-400 font-bold shrink-0">03</span>
                <p>
                  <strong className="text-zinc-950">Proč to vyhraje.</strong> Průměrný freelancer stráví 4–6h měsíčně přípravou smluv. DocBot to stlačí na 15 minut. Lock-in efekt = data jsou moat.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-400 font-bold shrink-0">04</span>
                <p>
                  <strong className="text-zinc-950">The Ask.</strong> B2B partneři, komunity freelancerů, seed investoři. Demo call — 20 minut, živě.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-zinc-200">
              <p className="text-zinc-400 text-sm font-medium">docbot.petrpiskacek.cloud</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Value Props ── */}
      <section className="px-6 py-14 border-t border-zinc-200">
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
              <div key={title} className="text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-base text-zinc-950">{title}</p>
                <p className="text-zinc-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>

          {/* "Jak to funguje" — 3 kroky */}
          <div className="space-y-4">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium text-center">
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
                    <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 flex items-center justify-center font-bold text-sm text-zinc-950 border border-zinc-200">
                      {step}
                    </div>
                    <p className="font-medium text-sm text-zinc-950">{label}</p>
                    <p className="text-zinc-500 text-xs">{sublabel}</p>
                  </div>
                  {i < 2 && (
                    <span className="text-zinc-300 flex-shrink-0" aria-hidden="true">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="px-6 py-12 border-t border-zinc-200 text-center space-y-3">
        <button
          onClick={onStart}
          className="px-8 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl transition-colors duration-150 cursor-pointer border border-zinc-200"
        >
          Klik, klik. Klik. Ááá, klk!
        </button>
        <p className="text-zinc-500 text-sm">
          Smlouva je problém?{' '}
          <span className="font-medium text-zinc-950">DocBot řeší problémy.</span>
        </p>
      </section>

      {/* ── Trust strip ── */}
      <section className="px-6 py-8 border-t border-zinc-200">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-zinc-500 text-sm">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-400 shrink-0" />
            Bez registrace
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-400 shrink-0" />
            Data jen u vás
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-zinc-400 shrink-0" />
            České právo
          </span>
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
            PDF připraven
          </span>
        </div>
      </section>
    </div>
  );
}
