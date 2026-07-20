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
        if (data.stats) {
          if (data.stats.vinculos_criados !== undefined) {
            setSuccessMsg(`Sincronização de atos concluída com sucesso! Atos coletados: ${data.stats.totalFound} | Atos persistidos (inseridos): ${data.stats.inserted} | Atos atualizados (duplicações físicas evitadas): ${data.stats.updated} | Vínculos de autoria confirmados: ${data.stats.vinculos_criados} | Falhas: ${data.stats.failed || 0}.`);
          } else {
            setSuccessMsg(`Sincronização concluída! ${data.stats.totalFound} registros identificados na fonte oficial: ${data.stats.inserted} inseridos, ${data.stats.updated} atualizados, ${data.stats.failed} falhas. Todos os ${data.stats.confirmedInDb} registros ativos/afastados foram confirmados por SELECT direto pós-persistência.`);
          }
        } else if (data.confirmedRecord) {
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

  const getSubcategory = (act_type: string, title: string = '', summary: string = ''): string => {
    const combined = `${title.toUpperCase()} ${(summary || '').toUpperCase()}`;
    const type = (act_type || '').toLowerCase();
    
    if (combined.includes('DENOMINA')) {
      return 'denominação de espaço público';
    }
    
    if (type.includes('mocao') || type.includes('moção')) {
      if (combined.includes('PESAR') || combined.includes('FALECIMENTO') || combined.includes('ÓBITO') || combined.includes('OBITO')) {
        return 'pesar';
      }
      return 'congratulação';
    }
    
    if (combined.includes('CIDADÃO') || combined.includes('CIDADÃ') || combined.includes('HONRA') || combined.includes('MEDALHA') || combined.includes('HOMENAGEM') || combined.includes('DIPLOMA') || combined.includes('CONGRATULA') || combined.includes('BENEMÉRITO')) {
      return 'homenagem';
    }

    if (type.includes('indicacao') || type.includes('indicação')) {
      if (combined.includes('ILUMINA') || combined.includes('LÂMPADA') || combined.includes('POSTE')) {
        return 'iluminação';
      }
      if (combined.includes('TRÂNSITO') || combined.includes('SINALIZA') || combined.includes('PLACA') || combined.includes('FAIXA') || combined.includes('LOMBADA') || combined.includes('RUA') || combined.includes('AVENIDA')) {
        return 'trânsito';
      }
      if (combined.includes('BURACO') || combined.includes('ASFALT') || combined.includes('RECAPE') || combined.includes('TAPA')) {
        return 'infraestrutura';
      }
      return 'zeladoria';
    }

    if (type.includes('requerimento')) {
      if (combined.includes('CONVOCA')) {
        return 'convocação';
      }
      if (combined.includes('INFORMA') || combined.includes('SOLICITA') || combined.includes('REQUER')) {
        return 'pedido de informação';
      }
      return 'fiscalização';
    }

    if (type.includes('projeto_lei') || type.includes('projeto de lei')) {
      if (combined.includes('ORGANIZA') || combined.includes('CÂMARA') || combined.includes('ESTRUTURA')) {
        return 'organização da Câmara';
      }
      return 'legislação municipal';
    }

    return 'Outros atos';
  };

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
                Composição da Legislatura ({councilors.length})
              </h3>
              <span className="text-[9px] font-black bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded uppercase border border-zinc-200">2025-2028</span>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
              {councilors.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-11 h-11 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex-shrink-0 flex items-center justify-center ${!c.is_active ? 'opacity-50 grayscale' : ''}`}>
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.display_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={18} className="text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-800 leading-tight flex items-center flex-wrap gap-2">
                        {c.display_name}
                        {!c.is_active && (
                          <span className="px-1.5 py-0.2 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase tracking-widest border border-red-100">Afastado</span>
                        )}
                      </h4>
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
                        
                        {/* 1. DADO OFICIAL */}
                        <div className="space-y-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">
                            Dado Oficial (Fonte: Câmara Municipal)
                          </span>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-zinc-600 font-semibold mb-2">
                            <div>
                              <span className="text-zinc-400 block text-[9px] font-bold uppercase tracking-wide">Tipo Oficial:</span>
                              <span className="capitalize">{act.act_type?.replace('_', ' ') || 'Ato'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-[9px] font-bold uppercase tracking-wide">Número e Ano:</span>
                              <span>{act.number || 'N/A'}/{act.year || '2026'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-[9px] font-bold uppercase tracking-wide">Situação Atual:</span>
                              <span className="uppercase text-red-600">{act.status || 'TRAMITAÇÃO'}</span>
                            </div>
                          </div>
                          <div className="border-t border-zinc-200/50 pt-2 mt-2">
                            <span className="text-zinc-400 block text-[9px] font-bold uppercase tracking-wide mb-1">Ementa/Resumo Original:</span>
                            <p className="text-zinc-700 font-medium italic">"{act.summary || 'Aguardando publicação do resumo original...'}"</p>
                          </div>
                          
                          {act.official_url && (
                            <div className="pt-2 text-right">
                              <a 
                                href={act.official_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold uppercase text-[10px] tracking-wider hover:underline"
                              >
                                Consultar ato na íntegra
                                <ArrowUpRight size={12} />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* 2. CLASSIFICAÇÃO EDITORIAL/METODOLÓGICA */}
                        <div className="space-y-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">
                            Classificação Editorial & Metodológica (Melhora Prudente)
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-zinc-700 font-medium">
                            <div className="space-y-1">
                              <span className="text-zinc-400 block text-[9px] font-bold uppercase tracking-wide">Grupo Analítico:</span>
                              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-zinc-200 text-zinc-800 border border-zinc-300">
                                {act.act_category}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-zinc-400 block text-[9px] font-bold uppercase tracking-wide">Subcategoria Analítica:</span>
                              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/50">
                                {getSubcategory(act.act_type, act.title, act.summary)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. EXPLICAÇÃO EM LINGUAGEM SIMPLES */}
                        <div className="space-y-2 bg-red-50/15 p-4 rounded-xl border border-red-500/10">
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block flex items-center gap-1">
                            <UserCheck size={10} />
                            Explicação em Linguagem Simples (Tradução Cidadã)
                          </span>
                          <p className="text-zinc-700 font-medium text-xs leading-relaxed">
                            {act.explanation_citizen || 'Aguardando síntese editorial e tradução amigável pela equipe Melhora Prudente...'}
                          </p>
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
