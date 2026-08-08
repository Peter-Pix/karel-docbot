// src/components/LandingPage.tsx
// Landing page pro Karla DocBota.
// Entry point pred selhani contract typu.

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [showPitch, setShowPitch] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-2xl mx-auto space-y-8"
        >
          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="space-y-2"
          >
            <p className="text-amber-400/80 text-sm font-medium tracking-widest uppercase">
              Smlouva je problém?
            </p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              <span className="text-white">DocBot </span>
              <span className="text-amber-400">řeší problémy.</span>
            </h1>
          </motion.div>

          {/* CTA — hlavní akce */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <button
              onClick={onStart}
              className="group relative px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-amber-400/20 hover:shadow-amber-400/40 hover:scale-105 cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                Začít teď
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <p className="text-zinc-500 text-sm">
              Žádné formuláře. Žádné vysvětlování. 15 sekund.
            </p>
          </motion.div>

          {/* Pitch toggle */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => setShowPitch(!showPitch)}
            className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors cursor-pointer"
          >
            {showPitch ? '▲ Skrýt pitch' : '▼ Pro investory a partnery'}
          </motion.button>

          {showPitch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-left bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-amber-400 font-bold text-lg">Pitch Deck</h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">01</span>
                  <p>
                    <strong className="text-zinc-200">Nahá realita.</strong> Smluvní agenda je v roce 2026 stále
                    zaseknutá v roce 1995. Nikdo nechce „psát smlouvu" — všichni chtějí jen, aby stála v PDF.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">02</span>
                  <p>
                    <strong className="text-zinc-200">Karel DocBot.</strong> První skutečně blbuvzdorný smluvní
                    asistent. Multi-Source Smart Drop — Ctrl+V, foto, URL, cokoliv.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">03</span>
                  <p>
                    <strong className="text-zinc-200">Proč to vyhraje.</strong> Průměrný freelancer stráví 4–6h
                    měsíčně přípravou smluv. DocBot to stlačí na 15 minut. Lock-in efekt = data jsou moat.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-amber-400 font-bold">04</span>
                  <p>
                    <strong className="text-zinc-200">The Ask.</strong> B2B partneři, komunity freelancerů, seed
                    investoři. Demo call — 20 minut, živě.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-amber-400 font-bold text-sm">
                  docbot.petrpiskacek.cloud
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── Value Props ── */}
      <section className="px-6 py-12 border-t border-zinc-900/50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Clock,
                title: '15 sekund',
                desc: 'Od vizitky k podepsanému PDF',
                color: 'text-amber-400',
                bg: 'bg-amber-400/10 border-amber-400/20',
              },
              {
                icon: Zap,
                title: 'Žádné psaní',
                desc: 'Ctrl+V, foto, URL — všechno se hodí',
                color: 'text-cyan-400',
                bg: 'bg-cyan-400/10 border-cyan-400/20',
              },
              {
                icon: Shield,
                title: 'Právně v pořádku',
                desc: 'České právo, náležitosti v krabici',
                color: 'text-green-400',
                bg: 'bg-green-400/10 border-green-400/20',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border ${bg} gap-2`}
              >
                <Icon className={`w-6 h-6 ${color}`} />
                <p className="font-bold text-zinc-100 text-sm">{title}</p>
                <p className="text-zinc-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>

          {/* "Jak to funguje" — 3 kroky */}
          <div className="pt-4 space-y-3">
            <p className="text-zinc-600 text-xs text-center uppercase tracking-widest font-medium">
              Jak to funguje
            </p>
            <div className="flex items-center justify-between gap-2">
              {[
                { step: '1', label: 'Hodíš', sublabel: 'text, fotku, URL' },
                { step: '2', label: 'DocBot koukne', sublabel: 'vytáhne, co potřebuje' },
                { step: '3', label: 'Hotovo', sublabel: 'PDF bez práce' },
              ].map(({ step, label, sublabel }, i) => (
                <React.Fragment key={step}>
                  <div className="flex-1 text-center space-y-1">
                    <div className="w-8 h-8 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {step}
                    </div>
                    <p className="text-zinc-300 text-sm font-medium">{label}</p>
                    <p className="text-zinc-600 text-xs">{sublabel}</p>
                  </div>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="px-6 py-10 border-t border-zinc-900/50 text-center space-y-4">
        <button
          onClick={onStart}
          className="group px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl transition-all duration-200 cursor-pointer"
        >
          <span className="flex items-center gap-3 justify-center">
            <Sparkles className="w-5 h-5" />
            Klik, klik. Klik. Ááá, klk!
          </span>
        </button>
        <p className="text-zinc-600 text-xs">
          Smlouva je problém?{' '}
          <span className="text-amber-400 font-medium">DocBot řeší problémy.</span>
        </p>
      </section>

      {/* ── Social proof strip ── */}
      <section className="px-6 py-6 border-t border-zinc-900/50">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-6 text-zinc-600 text-xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            Bez registrace
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            Data jen u vás
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            České právo
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-green-400" />
            PDF OK
          </span>
        </div>
      </section>
    </div>
  );
}
