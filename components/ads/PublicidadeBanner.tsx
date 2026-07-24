'use client';

import React from 'react';
import { Megaphone, ExternalLink } from 'lucide-react';

interface PublicidadeBannerProps {
  type?: 'banner' | 'sidebar' | 'infeed';
  title?: string;
  description?: string;
}

export function PublicidadeBanner({
  type = 'banner',
  title = 'Anuncie no Melhora Prudente',
  description = 'Alcance milhares de leitores em Presidente Prudente e região.',
}: PublicidadeBannerProps) {
  if (type === 'sidebar') {
    return (
      <div className="bg-gradient-to-br from-slate-100 to-amber-50 rounded-2xl p-5 border border-amber-200/60 shadow-sm text-center my-6">
        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2">
          Publicidade
        </span>
        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/20">
          <Megaphone className="w-5 h-5" />
        </div>
        <h4 className="font-extrabold text-slate-900 text-sm mb-1">{title}</h4>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">{description}</p>
        <a
          href="/midia"
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <span>Mídia Kit & Tabela</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="my-8 bg-gradient-to-r from-slate-100 via-red-50/50 to-slate-100 rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
      <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="text-left space-y-1">
          <span className="text-[10px] uppercase font-black tracking-wider text-red-600 block">
            Espaço Publicitário
          </span>
          <h4 className="font-extrabold text-slate-900 text-base">{title}</h4>
          <p className="text-xs text-slate-600">{description}</p>
        </div>

        <a
          href="/midia"
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center gap-1.5"
        >
          <Megaphone className="w-4 h-4" />
          <span>Anuncie Aqui</span>
        </a>
      </div>
    </div>
  );
}
