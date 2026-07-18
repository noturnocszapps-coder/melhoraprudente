'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Loader2, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  FileText,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Lock,
  Server,
  FileQuestion,
  XCircle
} from 'lucide-react';
import { useAdminCache } from './context/AdminCacheContext';

interface HealthState {
  status: 'Carregando...' | 'Operacional' | 'Atenção' | 'Indisponível' | 'Não configurado';
  details: string;
}

export default function AdminDashboard() {
  const { stats, trending, dashboardLoading, refreshDashboard } = useAdminCache();

  // Real system health states
  const [health, setHealth] = useState<Record<string, HealthState>>({
    auth: { status: 'Carregando...', details: 'Verificando Supabase Auth...' },
    database: { status: 'Carregando...', details: 'Testando conexão com tabelas...' },
    storage: { status: 'Carregando...', details: 'Verificando buckets de mídia...' },
    garimpo: { status: 'Carregando...', details: 'Testando tabela do Garimpo...' },
    ia: { status: 'Carregando...', details: 'Verificando serviço do Gemini API...' }
  });
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Run real system checks
  const checkSystemHealth = async () => {
    setCheckingHealth(true);

    // 1. Supabase Auth
    let authRes: HealthState = { status: 'Não configurado', details: 'Configurações do Supabase pendentes.' };
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        authRes = { status: 'Indisponível', details: `Erro de conexão: ${error.message}` };
      } else {
        authRes = { status: 'Operacional', details: 'Autenticação e sessão ativas.' };
      }
    } catch (e: any) {
      authRes = { status: 'Indisponível', details: e.message || 'Erro inesperado.' };
    }
    setHealth(prev => ({ ...prev, auth: authRes }));

    // 2. Database
    let dbRes: HealthState = { status: 'Não configurado', details: 'Sem conexão de banco.' };
    try {
      const { error } = await supabase.from('news').select('id').limit(1);
      if (error) {
        dbRes = { status: 'Indisponível', details: `Erro de leitura: ${error.message}` };
      } else {
        dbRes = { status: 'Operacional', details: 'Acesso e leitura de tabelas ativo.' };
      }
    } catch (e: any) {
      dbRes = { status: 'Indisponível', details: e.message || 'Erro de rede.' };
    }
    setHealth(prev => ({ ...prev, database: dbRes }));

    // 3. Supabase Storage
    let storageRes: HealthState = { status: 'Não configurado', details: 'Nenhum bucket configurado.' };
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        storageRes = { status: 'Atenção', details: 'Policies de acesso ativas ou restritas.' };
      } else if (data && data.length > 0) {
        storageRes = { status: 'Operacional', details: `${data.length} bucket(s) operacionais.` };
      } else {
        storageRes = { status: 'Operacional', details: 'Conexão ativa, sem buckets criados.' };
      }
    } catch (e: any) {
      storageRes = { status: 'Não configurado', details: 'Armazenamento inativo.' };
    }
    setHealth(prev => ({ ...prev, storage: storageRes }));

    // 4. Garimpo candidates table
    let garimpoRes: HealthState = { status: 'Não configurado', details: 'Tabela de candidatos ausente.' };
    try {
      const { error } = await supabase.from('news_candidates').select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
          garimpoRes = { status: 'Não configurado', details: 'Tabela news_candidates ausente.' };
        } else {
          garimpoRes = { status: 'Indisponível', details: `Erro: ${error.message}` };
        }
      } else {
        garimpoRes = { status: 'Operacional', details: 'Fila do Garimpo queryable.' };
      }
    } catch (e: any) {
      garimpoRes = { status: 'Indisponível', details: e.message || 'Erro desconhecido.' };
    }
    setHealth(prev => ({ ...prev, garimpo: garimpoRes }));

    // 5. IA Service (Gemini API)
    let iaRes: HealthState = { status: 'Não configurado', details: 'Chave Gemini indisponível.' };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/ai-editorial', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const body = await res.json();
          if (body.api_configured) {
            iaRes = { status: 'Operacional', details: 'Gemini 2.5/3.5 ativo no servidor.' };
          } else {
            iaRes = { status: 'Não configurado', details: 'GEMINI_API_KEY vazia no servidor.' };
          }
        } else {
          iaRes = { status: 'Atenção', details: `Código de resposta editorial: ${res.status}` };
        }
      } else {
        iaRes = { status: 'Indisponível', details: 'Sessão requerida para verificar.' };
      }
    } catch (e: any) {
      iaRes = { status: 'Indisponível', details: 'Sem resposta da API de IA.' };
    }
    setHealth(prev => ({ ...prev, ia: iaRes }));
    setCheckingHealth(false);
  };

  useEffect(() => {
    refreshDashboard();
    checkSystemHealth();
  }, []);

  const hasNoData = stats.totalPosts === 0 && stats.totalUsers === 0 && trending.length === 0;

  // Real-time integration check based on client process environments
  const isGaConfigured = typeof process.env.NEXT_PUBLIC_GA_ID === 'string' && process.env.NEXT_PUBLIC_GA_ID.length > 0;
  const isClarityConfigured = typeof process.env.NEXT_PUBLIC_CLARITY_ID === 'string' && process.env.NEXT_PUBLIC_CLARITY_ID.length > 0;
  const isSentryConfigured = false; // Never configured or present in deps

  // Sorting dynamic metrics from cached trending data
  const newsByViews = [...trending].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5);
  const newsByShares = [...trending].sort((a, b) => b.sharesCount - a.sharesCount).slice(0, 5);
  const newsByComments = [...trending].sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 5);

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca sincronizado';
    try {
      return new Date(dateStr).toLocaleString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Operacional':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
            <CheckCircle size={10} className="stroke-[3]" />
            Operacional
          </span>
        );
      case 'Atenção':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/25">
            <AlertTriangle size={10} className="stroke-[3]" />
            Atenção
          </span>
        );
      case 'Indisponível':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/25">
            <XCircle size={10} className="stroke-[3]" />
            Indisponível
          </span>
        );
      case 'Não configurado':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-400/10 text-zinc-500 border border-zinc-500/15">
            <FileQuestion size={10} className="stroke-[3]" />
            Não configurado
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Sync State */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">Auditoria Editorial & Painel Real</h2>
          <p className="text-xs text-zinc-500 font-semibold">Métricas e diagnósticos auditados diretamente do banco de dados.</p>
        </div>
        <button 
          onClick={() => { refreshDashboard(); checkSystemHealth(); }}
          disabled={dashboardLoading || checkingHealth}
          className="self-start sm:self-center flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-zinc-200 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={cn((dashboardLoading || checkingHealth) && "animate-spin")} />
          Atualizar Dados
        </button>
      </div>

      {dashboardLoading && hasNoData ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-red-600" size={28} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Carregando painel de auditoria real...</p>
        </div>
      ) : (
        <>
          {/* Blocks Grid: CONTEÚDO, GARIMPO, ENGAJAMENTO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BLOCK 1: CONTEÚDO */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText size={14} /></span>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Bloco de Conteúdo</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Publicadas</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.publishedPosts}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Publicadas Hoje</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.publishedToday}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Últimos 7 dias</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.publishedLast7Days}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rascunhos</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.draftPosts}</p>
                </div>
              </div>
            </div>

            {/* BLOCK 2: GARIMPO */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Sparkles size={14} /></span>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Bloco do Garimpo</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Coletadas/Total</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.garimpoTotal}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Pendentes</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.garimpoPending}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Aprovadas</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.garimpoApproved}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rejeitadas</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.garimpoRejected}</p>
                </div>
              </div>
            </div>

            {/* BLOCK 3: ENGAJAMENTO */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={14} /></span>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Bloco de Engajamento</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Visualizações</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.viewsCount.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Curtidas</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.likesCount.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Comentários</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.commentsCount.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Compartilhados</p>
                  <p className="text-lg font-black text-zinc-900 mt-1">{stats.sharesCount.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

          </div>

          {/* BLOCK 4: RANKINGS EDITORIAIS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Rankings de Conteúdo Auditado</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* RANKING: MAIS LIDAS */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-1.5">
                    <Eye size={14} className="text-zinc-500" />
                    Mais Lidas
                  </h4>
                  <span className="text-[8px] font-black bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded uppercase">views</span>
                </div>
                <div className="space-y-3 min-h-[180px] flex flex-col justify-start">
                  {newsByViews.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                      <FileQuestion size={24} className="text-zinc-300 mb-2" />
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Nenhuma leitura registrada</p>
                    </div>
                  ) : (
                    newsByViews.map((news) => (
                      <div key={news.id} className="flex items-start justify-between gap-3 text-xs border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-800 truncate leading-tight">{news.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-bold uppercase text-zinc-400">{news.category}</span>
                            <span className="text-[8px] text-zinc-300">•</span>
                            <span className="text-[8px] font-bold text-zinc-500 flex items-center gap-1">
                              <Eye size={8} /> {news.viewsCount} views
                            </span>
                          </div>
                        </div>
                        <Link 
                          href={`/noticia/${news.slug}`}
                          target="_blank"
                          className="flex-shrink-0 text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5"
                        >
                          Ver
                          <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RANKING: MAIS COMPARTILHADAS */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-1.5">
                    <Share2 size={14} className="text-zinc-500" />
                    Mais Compartilhadas
                  </h4>
                  <span className="text-[8px] font-black bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded uppercase">shares</span>
                </div>
                <div className="space-y-3 min-h-[180px] flex flex-col justify-start">
                  {newsByShares.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                      <FileQuestion size={24} className="text-zinc-300 mb-2" />
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Nenhum compartilhamento ainda</p>
                    </div>
                  ) : (
                    newsByShares.map((news) => (
                      <div key={news.id} className="flex items-start justify-between gap-3 text-xs border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-800 truncate leading-tight">{news.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-bold uppercase text-zinc-400">{news.category}</span>
                            <span className="text-[8px] text-zinc-300">•</span>
                            <span className="text-[8px] font-bold text-zinc-500 flex items-center gap-1">
                              <Share2 size={8} /> {news.sharesCount} shares
                            </span>
                          </div>
                        </div>
                        <Link 
                          href={`/noticia/${news.slug}`}
                          target="_blank"
                          className="flex-shrink-0 text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5"
                        >
                          Ver
                          <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RANKING: MAIS COMENTADAS */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-zinc-500" />
                    Mais Comentadas
                  </h4>
                  <span className="text-[8px] font-black bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded uppercase">comments</span>
                </div>
                <div className="space-y-3 min-h-[180px] flex flex-col justify-start">
                  {newsByComments.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                      <FileQuestion size={24} className="text-zinc-300 mb-2" />
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Nenhum comentário enviado</p>
                    </div>
                  ) : (
                    newsByComments.map((news) => (
                      <div key={news.id} className="flex items-start justify-between gap-3 text-xs border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-zinc-800 truncate leading-tight">{news.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-bold uppercase text-zinc-400">{news.category}</span>
                            <span className="text-[8px] text-zinc-300">•</span>
                            <span className="text-[8px] font-bold text-zinc-500 flex items-center gap-1">
                              <MessageSquare size={8} /> {news.commentsCount} comments
                            </span>
                          </div>
                        </div>
                        <Link 
                          href={`/noticia/${news.slug}`}
                          target="_blank"
                          className="flex-shrink-0 text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5"
                        >
                          Ver
                          <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* BLOCK 5: SAÚDE DO SISTEMA & INTEGRAÇÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SAÚDE DO SISTEMA */}
            <div className="bg-zinc-950 p-6 md:p-8 rounded-3xl text-zinc-100 space-y-6 border border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-zinc-900 rounded-xl border border-zinc-800"><Server size={16} className="text-red-500" /></span>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-100">Saúde do Sistema</h3>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Verificação de Conexões em Tempo Real</p>
                  </div>
                </div>
                <button
                  onClick={checkSystemHealth}
                  disabled={checkingHealth}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-wider text-zinc-300 disabled:opacity-50 transition-all"
                >
                  <RefreshCw size={10} className={cn(checkingHealth && "animate-spin")} />
                  Testar Novamente
                </button>
              </div>

              {/* Status list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs font-bold">
                
                <div className="flex flex-col gap-1 border-b border-zinc-900 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Supabase Auth</span>
                    {getStatusBadge(health.auth.status)}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold truncate">{health.auth.details}</span>
                </div>

                <div className="flex flex-col gap-1 border-b border-zinc-900 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Banco de Dados</span>
                    {getStatusBadge(health.database.status)}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold truncate">{health.database.details}</span>
                </div>

                <div className="flex flex-col gap-1 border-b border-zinc-900 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Supabase Storage</span>
                    {getStatusBadge(health.storage.status)}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold truncate">{health.storage.details}</span>
                </div>

                <div className="flex flex-col gap-1 border-b border-zinc-900 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Garimpo de Notícias</span>
                    {getStatusBadge(health.garimpo.status)}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold truncate">{health.garimpo.details}</span>
                </div>

                <div className="flex flex-col gap-1 border-b border-zinc-900 pb-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Serviço de IA (Gemini API)</span>
                    {getStatusBadge(health.ia.status)}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold truncate">{health.ia.details}</span>
                </div>

                <div className="flex items-center justify-between sm:col-span-2 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900 text-[10px] text-zinc-400 font-semibold">
                  <span className="uppercase font-bold text-[9px] text-zinc-500">Última Sincronização do Garimpo:</span>
                  <span className="font-mono">{formatLastSync(stats.garimpoLastSync)}</span>
                </div>

              </div>
            </div>

            {/* INTEGRAÇÕES & AÇÕES */}
            <div className="flex flex-col justify-between gap-6">
              
              {/* Box de Integrações */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4 flex-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 pb-2 border-b border-zinc-100">Status das Integrações de Terceiros</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-800">Google Analytics 4 (GA4)</span>
                      <span className="text-[10px] text-zinc-400">Rastreamento de pageviews e audiência</span>
                    </div>
                    {isGaConfigured ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Configurado</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-400 border border-zinc-200/65">Não configurado</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-800">Microsoft Clarity</span>
                      <span className="text-[10px] text-zinc-400">Mapas de calor e gravações de sessão</span>
                    </div>
                    {isClarityConfigured ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Configurado</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-400 border border-zinc-200/65">Não configurado</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-800">Monitoramento de Erros (Sentry)</span>
                      <span className="text-[10px] text-zinc-400">Captura de exceções em produção</span>
                    </div>
                    {isSentryConfigured ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Configurado</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-400 border border-zinc-200/65">Não configurado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações de Gerenciamento */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200/75 p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Atalhos Administrativos</h3>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">Operações diretas para redigir matérias ou organizar tags.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link 
                    href="/admin/noticias/nova" 
                    className="bg-white p-3.5 rounded-xl border border-zinc-200 hover:border-red-300 hover:text-red-600 text-zinc-700 transition-all text-center shadow-sm font-black text-[10px] uppercase tracking-wider"
                  >
                    Nova Notícia
                  </Link>
                  <Link 
                    href="/admin/categorias" 
                    className="bg-white p-3.5 rounded-xl border border-zinc-200 hover:border-red-300 hover:text-red-600 text-zinc-700 transition-all text-center shadow-sm font-black text-[10px] uppercase tracking-wider"
                  >
                    Gerenciar Categorias
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
