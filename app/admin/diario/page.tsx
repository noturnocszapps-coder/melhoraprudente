'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  BookOpen, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  FileText,
  Calendar,
  Lock,
  ArrowUpRight,
  Bookmark,
  ChevronDown
} from 'lucide-react';

export default function DiarioAdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState(false);
  const [editions, setEditions] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/diario', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.error === "MISSING_TABLES") {
        setMissingTables(true);
      } else if (data.success) {
        setEditions(data.editions || []);
        setItems(data.items || []);
        setMissingTables(false);
      } else {
        setErrorMsg(data.error || "Erro ao carregar dados do Diário Oficial.");
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

      const res = await fetch('/api/admin/diario', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Varredura concluída com sucesso! Edições catalogadas: ${data.coletados}, novos atos extraídos e classificados por IA: ${data.itemsExtraidos}.`);
        await loadData();
      } else {
        setErrorMsg(data.error || "Erro ao executar varredura do Diário Oficial.");
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
      case 'LICITAÇÕES E CONTRATOS':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'NOMEAÇÕES E PESSOAL':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DECRETOS E LEIS':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ZELADORIA E OBRAS':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ORÇAMENTO':
        return 'bg-rose-100 text-rose-700 border-rose-200';
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
              <BookOpen size={26} />
            </span>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200/50">Módulo Estratégico</span>
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 mt-1">Diário Oficial Inteligente</h2>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">Fase 1: Transparência Pública Simplificada por IA</p>
            </div>
          </div>
          
          <button
            onClick={handleScan}
            disabled={loading || scanning || missingTables}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-600/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
            {scanning ? "Lendo Subdomínio..." : "Sincronizar Diário Oficial"}
          </button>
        </div>

        {/* Informative Disclaimer */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-zinc-600 font-medium">
          <ShieldAlert size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-zinc-900 uppercase text-[10px] tracking-wider block">Regras da Fase 1 (Leitura Concreta e Sem Alucinações):</span>
            <p>O robô monitora de maneira estruturada o subdomínio oficial do diário municipal (<span className="font-semibold text-red-600">diario.presidenteprudente.sp.gov.br</span>). Ele extrai os atos, resoluções, portarias, decretos e compras públicas da última edição. A IA atua na <span className="font-semibold text-zinc-800">classificação por categoria e na simplificação da linguagem</span> para democratizar o acesso.</p>
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
            As tabelas <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600">official_gazette_editions</code> e <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600">official_gazette_items</code> foram adicionadas ao arquivo de schema do projeto. Execute a migração no console Supabase para ativar este módulo estratégico.
          </p>
        </div>
      ) : loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="animate-spin text-red-600" size={32} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Carregando edições e atos do diário...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Edition index */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Bookmark size={14} className="text-zinc-500" />
                Edições Catalogadas ({editions.length})
              </h3>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
              {editions.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-xs font-bold uppercase">Nenhuma edição catalogada</div>
              ) : (
                editions.map((ed) => (
                  <div key={ed.id} className="p-4 space-y-2 hover:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-zinc-950">Edição nº {ed.edition_number}</h4>
                      <span className="text-[10px] text-zinc-400 font-semibold">{ed.publication_date ? new Date(ed.publication_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Recente'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                      <span>Coletado em: {new Date(ed.collected_at).toLocaleDateString('pt-BR')}</span>
                      {ed.file_url && (
                        <a 
                          href={ed.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-red-600 hover:text-red-700 flex items-center gap-0.5"
                        >
                          Ver PDF
                          <ArrowUpRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Extracted Items with AI Analysis */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <FileText size={14} className="text-zinc-500" />
              Atos e Resoluções Traduzidos por IA ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-3 shadow-sm">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Nenhum ato administrativo extraído ainda</p>
                <p className="text-[11px] text-zinc-500 font-semibold max-w-sm mx-auto">Use o botão "Sincronizar Diário Oficial" acima para rastrear a última edição disponível e gerar as análises transparentes automáticas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-2xl border transition-all p-5 space-y-4 shadow-sm hover:shadow-md cursor-pointer ${selectedItem?.id === item.id ? "border-red-300 ring-2 ring-red-500/10" : "border-zinc-200"}`}
                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getCategoryBadgeColor(item.category)}`}>
                            {item.category}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                            <Calendar size={10} />
                            Edição nº {item.edition?.edition_number || 'N/A'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-zinc-950 leading-snug">{item.title}</h4>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">{item.section || 'PREFEITURA DE PRESIDENTE PRUDENTE'}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Relevância Pública</span>
                        <span className={`text-base font-black ${item.relevance_score >= 75 ? 'text-emerald-600' : item.relevance_score >= 45 ? 'text-amber-500' : 'text-zinc-500'}`}>
                          {item.relevance_score || '50'}/100
                        </span>
                      </div>
                    </div>

                    {selectedItem?.id === item.id ? (
                      <div className="pt-4 border-t border-zinc-100 space-y-4 text-xs leading-relaxed transition-all">
                        {/* Summary */}
                        <div className="space-y-1 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/50">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block flex items-center gap-1">
                            <Sparkles size={10} className="text-red-500" />
                            Resumo Editorial (IA)
                          </span>
                          <p className="text-zinc-600 font-medium">{item.summary || 'Aguardando processamento...'}</p>
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1 bg-red-50/10 p-3.5 rounded-xl border border-red-500/10">
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block flex items-center gap-1">
                            <BookOpen size={10} />
                            O que isso significa para o Cidadão Prudentino?
                          </span>
                          <p className="text-zinc-700 font-medium">{item.explanation_citizen || 'Aguardando síntese amigável...'}</p>
                        </div>

                        {/* Raw Source Reference Text */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Texto Original do Diário</span>
                          <pre className="bg-zinc-50 text-[10px] text-zinc-500 p-3 rounded-xl border border-zinc-200/50 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                            {item.raw_text}
                          </pre>
                        </div>

                        {/* Page Number and date details */}
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold pt-1">
                          <span className="uppercase">Edição de: {item.edition?.publication_date ? new Date(item.edition.publication_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Recente'}</span>
                          <span>Pág. {item.page_number || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-red-600 hover:text-red-700 font-black uppercase tracking-widest flex items-center gap-0.5 justify-end">
                        Expandir Tradução Cidadã
                        <ChevronDown size={12} />
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
