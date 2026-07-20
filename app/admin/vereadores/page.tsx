'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  Vote, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle, 
  UserCheck, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  FileText,
  User,
  Calendar,
  Lock,
  ArrowUpRight
} from 'lucide-react';

export default function CouncilorsAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState(false);
  const [councilors, setCouncilors] = useState<any[]>([]);
  const [acts, setActs] = useState<any[]>([]);
  const [selectedAct, setSelectedAct] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/vereadores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.error === "MISSING_TABLES") {
        setMissingTables(true);
      } else if (data.success) {
        setCouncilors(data.councilors || []);
        setActs(data.acts || []);
        setMissingTables(false);
      } else {
        setErrorMsg(data.error || "Erro ao carregar dados do Raio-X.");
      }
    } catch (err: any) {
      setErrorMsg("Erro de conexão com o servidor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (scanning) return;
    setScanning(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErrorMsg("Não autenticado.");
        return;
      }

      const res = await fetch('/api/admin/vereadores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        if (data.confirmedRecord) {
          setSuccessMsg(`Persistência controlada validada! Vereador [${data.confirmedRecord.display_name}] (Partido: ${data.confirmedRecord.party}) foi persistido com sucesso (UUID: ${data.confirmedRecord.id}) e confirmado por leitura direta pós-salvamento no Supabase.`);
        } else {
          setSuccessMsg(data.message || "Coleta e análise finalizadas com sucesso!");
        }
        await loadData();
      } else {
        setErrorMsg(data.error || "Erro ao executar coleta de atos.");
      }
    } catch (err: any) {
      setErrorMsg("Falha na varredura: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'LEGISLAÇÃO SUBSTANTIVA':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'FISCALIZAÇÃO':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DEMANDAS LOCAIS':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ATOS SIMBÓLICOS':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-sm">
              <Vote size={26} />
            </span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200/50">Módulo Estratégico</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 mt-1">Raio-X dos Vereadores</h2>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">Fase 1: Mapeamento de Fontes Oficiais e Análise Inteligente de Atos</p>
            </div>
          </div>
          
          <button
            onClick={handleScan}
            disabled={loading || scanning || missingTables}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-600/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
            {scanning ? "Varrendo Câmara..." : "Coletar e Analisar Atos"}
          </button>
        </div>

        {/* Informative Disclaimer */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-zinc-600 font-medium">
          <ShieldAlert size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider block">Regras da Fase 1 (Transparência Sem Viés):</span>
            <p>Este módulo audita o portal oficial da Câmara Municipal (<span className="font-semibold text-red-600">camarapprudente.sp.gov.br</span>). Para garantir integridade jornalística absoluta, <span className="font-semibold text-zinc-800">nenhuma nota de vereador, ranking de desempenho ou dado fictício</span> é gerado. Atos são extraídos e analisados unicamente de fontes legislativas oficiais para tradução amigável ao cidadão.</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {missingTables ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-base font-black uppercase text-zinc-900">Tabelas do Banco Pendentes</h3>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-md mx-auto">
            As tabelas <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600">councilors</code>, <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600">legislative_acts</code> e <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600">councilor_act_authors</code> foram adicionadas ao arquivo de schema do projeto. Execute a migração no console Supabase para ativar este módulo estratégico.
          </p>
        </div>
      ) : loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="animate-spin text-red-600" size={32} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Carregando mapeamento legislativo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Real Councilors list */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <UserCheck size={14} className="text-zinc-500" />
                Vereadores Eleitos ({councilors.length})
              </h3>
              <span className="text-[9px] font-black bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded uppercase border border-zinc-200">2025-2028</span>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
              {councilors.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex-shrink-0 flex items-center justify-center">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.display_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={18} className="text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-800 leading-tight">{c.display_name}</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded text-[9px] font-bold border border-zinc-200">{c.party}</span>
                        <span>Câmara Municipal</span>
                      </p>
                    </div>
                  </div>

                  <a 
                    href={c.official_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Crawled Legislative Acts with analysis */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <FileText size={14} className="text-zinc-500" />
              Atos Legislativos Coletados e Analisados ({acts.length})
            </h3>

            {acts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-3 shadow-sm">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Nenhum ato legislativo importado ainda</p>
                <p className="text-[11px] text-zinc-500 font-semibold max-w-sm mx-auto">Use o botão "Coletar e Analisar Atos" acima para fazer a varredura real na página de notícias e pautas da Câmara de Presidente Prudente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {acts.map((act) => (
                  <div 
                    key={act.id} 
                    className={`bg-white rounded-2xl border transition-all p-5 space-y-4 shadow-sm hover:shadow-md cursor-pointer ${selectedAct?.id === act.id ? "border-red-300 ring-2 ring-red-500/10" : "border-zinc-200"}`}
                    onClick={() => setSelectedAct(selectedAct?.id === act.id ? null : act)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getCategoryBadgeColor(act.act_category)}`}>
                            {act.act_category}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {act.year || '2026'}
                          </span>
                          {act.is_coauthored && (
                            <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-500 text-[8px] font-bold rounded uppercase tracking-wider">Coautoria</span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-zinc-900 leading-snug">{act.title}</h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Impacto Cidadão</span>
                        <span className={`text-base font-black ${act.relevance_score >= 70 ? 'text-emerald-600' : act.relevance_score >= 40 ? 'text-amber-500' : 'text-zinc-500'}`}>
                          {act.relevance_score || '50'}/100
                        </span>
                      </div>
                    </div>

                    {/* Authors mapping */}
                    {act.authors && act.authors.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Autor(es):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {act.authors.map((auth: any) => (
                            <span key={auth.councilor?.id} className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200/80 rounded-full px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              {auth.councilor?.display_name} ({auth.councilor?.party})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAct?.id === act.id && (
                      <div className="pt-4 border-t border-zinc-100 space-y-4 text-xs leading-relaxed transition-all">
                        {/* Summary */}
                        <div className="space-y-1 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/50">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block flex items-center gap-1">
                            <Sparkles size={10} className="text-red-500" />
                            Resumo Estruturado (IA)
                          </span>
                          <p className="text-zinc-600 font-medium">{act.summary || 'Aguardando análise detalhada...'}</p>
                        </div>

                        {/* Practical Explanation */}
                        <div className="space-y-1 bg-red-50/10 p-3.5 rounded-xl border border-red-500/10">
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block flex items-center gap-1">
                            <UserCheck size={10} />
                            O que isso significa para o Cidadão Prudentino?
                          </span>
                          <p className="text-zinc-700 font-medium">{act.explanation_citizen || 'Aguardando síntese editorial...'}</p>
                        </div>

                        {/* Extra Metadata */}
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold pt-1">
                          <span className="uppercase">Nº Protocolo: {act.number || 'N/A'} • Status: {act.status || 'TRAMITAÇÃO'}</span>
                          {act.official_url && (
                            <a 
                              href={act.official_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-red-600 hover:text-red-700 hover:underline flex items-center gap-0.5"
                            >
                              Consultar na íntegra
                              <ArrowUpRight size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedAct?.id !== act.id && (
                      <div className="text-[10px] text-red-600 hover:text-red-700 font-black uppercase tracking-widest flex items-center gap-0.5 justify-end">
                        Expandir Análise Inteligente
                        <ChevronRight size={12} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
