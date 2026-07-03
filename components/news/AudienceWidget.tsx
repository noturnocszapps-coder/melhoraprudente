'use client';

import React, { useState, useEffect } from 'react';
import { Users, Eye, TrendingUp, Sparkles, Activity } from 'lucide-react';

interface AudienceWidgetProps {
  newsTitle?: string;
}

export default function AudienceWidget({ newsTitle }: AudienceWidgetProps) {
  const [activeUsers, setActiveUsers] = useState(1420);
  const [viewsPerMinute, setViewsPerMinute] = useState(380);
  const [trafficPeak, setTrafficPeak] = useState(5820);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    // Generate organic real-time updates
    const interval = setInterval(() => {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1000);

      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 41) - 20; // -20 to +20
        const updated = prev + change;
        return Math.max(1200, Math.min(3500, updated));
      });

      setViewsPerMinute(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
        const updated = prev + change;
        return Math.max(250, Math.min(800, updated));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xl shadow-zinc-100/50 space-y-6 relative overflow-hidden">
      {/* Decorative accent background */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-green-500/5 rounded-full blur-2xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-950">Audiência Ao Vivo</h4>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Métricas de tráfego nacional</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
          <Activity size={10} className="animate-pulse" />
          TEMPO REAL
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100/80 transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Ativos Agora</span>
            <Users size={14} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-950 tracking-tighter">
              {activeUsers.toLocaleString('pt-BR')}
            </span>
            <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wide">users</span>
          </div>
        </div>

        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100/80 transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Visualizações/Min</span>
            <Eye size={14} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-zinc-950 tracking-tighter">
              {viewsPerMinute.toLocaleString('pt-BR')}
            </span>
            <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wide">pvs</span>
          </div>
        </div>
      </div>

      {newsTitle && (
        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <TrendingUp size={12} className="text-red-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Lendo Neste Momento:</span>
          </div>
          <p className="text-[11px] font-bold text-zinc-800 leading-snug line-clamp-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100/50">
            {newsTitle}
          </p>
        </div>
      )}

      {/* Reading heat statement */}
      <div className="flex items-center gap-2 bg-emerald-500/[0.04] p-3 rounded-xl border border-emerald-500/10 text-emerald-800 text-[10px] font-semibold">
        <Sparkles size={14} className="text-emerald-600 shrink-0" />
        <span>Pico de tráfego histórico de <strong>{trafficPeak.toLocaleString('pt-BR')}</strong> acessos simultâneos registrado hoje.</span>
      </div>
    </div>
  );
}
