'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Edit, 
  ThumbsDown,
  Eye,
  Settings,
  Flame,
  Globe,
  Plus,
  BookOpen
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cn, generateSafeExcerpt } from '@/lib/utils';

interface NewsCandidate {
  id: string;
  source_name: string;
  source_url: string;
  external_id: string;
  original_url: string;
  original_title: string;
  original_excerpt: string | null;
  original_image_url: string | null;
  original_published_at: string | null;
  collected_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  ai_title: string | null;
  ai_summary: string | null;
  ai_category: string | null;
  ai_relevance_score: number | null;
  ai_regional_impact_score: number | null;
  ai_viral_potential_score: number | null;
  created_at: string;
  updated_at: string;

  // Novos campos estruturados da Segunda Onda
  source_id?: string | null;
  source_type?: 'official' | 'journalistic' | null;
  source_image_url?: string | null;
  image_usage_status?: 'unknown' | 'allowed' | 'not_allowed' | 'own_image_required' | null;
  editorial_status?: 'coletada' | 'analisada' | 'em_revisao' | 'aprovada' | 'publicada' | 'rejeitada' | null;
  ai_analysis_status?: string | null;
  ai_analyzed_at?: string | null;
  ai_model?: string | null;
  possible_duplicate_of?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  published_news_id?: string | null;
}

const checkTitleSimilarityValue = (title1: string, title2: string): number => {
  if (!title1 || !title2) return 0;
  const clean = (t: string) => t.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['para', 'pelo', 'pela', 'com', 'mais', 'sobre', 'como', 'onde', 'quando', 'tudo', 'presidente', 'prudente'].includes(w));
  
  const w1 = clean(title1);
  const w2 = clean(title2);
  if (w1.length === 0 || w2.length === 0) return 0;

  const intersect = w1.filter(w => w2.includes(w));
  return intersect.length / Math.max(w1.length, w2.length);
};

const mapAiCategoryToUi = (cat: string | null | undefined): string => {
  if (!cat) return 'Cidade';
  const norm = cat.toUpperCase();
  if (norm === 'POLÍCIA' || norm === 'POLICIA' || norm === 'SEGURANÇA' || norm === 'SEGURANCA') return 'Segurança';
  if (norm === 'POLÍTICA' || norm === 'POLITICA') return 'Política';
  if (norm === 'ESPORTES') return 'Esportes';
  if (norm === 'ECONOMIA') return 'Economia';
  if (norm === 'SAÚDE' || norm === 'SAUDE') return 'Saúde';
  if (norm === 'EDUCAÇÃO' || norm === 'EDUCACAO') return 'Educação';
  if (norm === 'CULTURA') return 'Cultura';
  if (norm === 'CIDADE') return 'Cidade';
  if (norm === 'GERAL') return 'Geral';
  return cat;
};

export default function GarimpoDashboard() {
  const [candidates, setCandidates] = useState<NewsCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_published' | 'rejected'>('pending');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'prefeitura-prudente' | 'g1-presidente-prudente' | 'inova-prudente'>('all');
  
  // Diagnostic states
  const [diagnostic, setDiagnostic] = useState<{
    url: string;
    method: string;
    status: number;
    statusText: string;
    contentType: string;
    responsePreview: string;
  } | null>(null);

  const [scanDetails, setScanDetails] = useState<{
    sourceName: string;
    scraped: number;
    newCandidates: number;
    saved: number;
    skipped: number;
    duplicates: number;
    old: number;
    ignored: number;
    errorsCount: number;
    errorsList: string[];
  } | null>(null);

  const handleApiError = async (res: Response, url: string, method: string) => {
    const contentType = res.headers.get('content-type') || 'unknown';
    let textPreview = '';
    try {
      const clonedRes = res.clone();
      textPreview = await clonedRes.text();
      textPreview = textPreview.substring(0, 300);
    } catch {
      textPreview = 'Não foi possível ler o corpo da resposta.';
    }

    setDiagnostic({
      url,
      method,
      status: res.status,
      statusText: res.statusText || '',
      contentType,
      responsePreview: textPreview
    });
  };

  const handleNetworkError = (err: any, url: string, method: string) => {
    setDiagnostic({
      url,
      method,
      status: 0,
      statusText: 'Network Error / Connection Failed',
      contentType: 'unknown',
      responsePreview: err.message || String(err)
    });
  };

  // Statuses & Actions
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [missingTable, setMissingTable] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  
  // Expanded & Edit states
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<NewsCandidate | null>(null);
  
  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('Cidade');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [publishStatus, setPublishStatus] = useState<'published' | 'draft'>('published');
  const [loadingFullContent, setLoadingFullContent] = useState(false);
  const [scrapedContent, setScrapedContent] = useState('');

  // Load candidates list
  const loadCandidates = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setMissingTable(false);
    setDiagnostic(null); // Limpar diagnósticos anteriores
    try {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setLoading(false);
        return;
      }

      const url = '/api/admin/garimpo';
      const method = 'GET';
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        await handleApiError(res, url, method);
        throw new Error(`Erro na requisição: HTTP ${res.status}`);
      }

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        await handleApiError(res, url, method);
        throw new Error(`Resposta inválida do servidor (${res.status})`);
      }
      
      if (data.error === 'MISSING_TABLE') {
        setMissingTable(true);
      } else if (data.candidates) {
        setCandidates(data.candidates);
      } else if (data.error) {
        console.error('Erro retornado pela API do Garimpo:', data.error);
        setDiagnostic({
          url,
          method,
          status: res.status,
          statusText: 'API Error Response',
          contentType: contentType || 'application/json',
          responsePreview: JSON.stringify(data).substring(0, 300)
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar candidatos do garimpo:', err);
      if (!diagnostic) {
        handleNetworkError(err, '/api/admin/garimpo', 'GET');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // Trigger search / scanning
  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setScanDetails(null);
    setDiagnostic(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = '/api/admin/garimpo';
      const method = 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ limit: 12 })
      });

      if (!res.ok) {
        await handleApiError(res, url, method);
        throw new Error(`Erro na requisição: HTTP ${res.status}`);
      }

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        await handleApiError(res, url, method);
        throw new Error(`Resposta inválida do servidor (${res.status})`);
      }

      if (data.error === 'MISSING_TABLE') {
        setMissingTable(true);
      } else if (data.stats) {
        const stats = data.stats;
        setScanResult(stats);
        setScanDetails({
          sourceName: 'Prefeitura, G1 e Inova - Multi-fontes',
          scraped: stats.scraped,
          newCandidates: stats.newCandidates,
          saved: stats.saved,
          skipped: stats.skipped,
          duplicates: stats.duplicates || 0,
          old: stats.old || 0,
          ignored: stats.ignored || 0,
          errorsCount: stats.errors?.length || 0,
          errorsList: stats.errors || []
        });
        await loadCandidates(true);
      } else if (data.error) {
        setDiagnostic({
          url,
          method,
          status: res.status,
          statusText: 'API Error Response',
          contentType: contentType || 'application/json',
          responsePreview: JSON.stringify(data).substring(0, 300)
        });
        alert('Erro ao varrer portal: ' + data.error);
      }
    } catch (err: any) {
      if (!diagnostic) {
        handleNetworkError(err, '/api/admin/garimpo', 'POST');
      }
      alert('Erro de conexão ao garimpo: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Reject candidate
  const handleReject = async (id: string) => {
    if (!confirm('Deseja rejeitar esta notícia? Ela sairá da fila de pendentes.')) return;
    setActionId(id);
    setDiagnostic(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = '/api/admin/garimpo/reject';
      const method = 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        await handleApiError(res, url, method);
        throw new Error(`Erro na requisição: HTTP ${res.status}`);
      }

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        await handleApiError(res, url, method);
        throw new Error(`Resposta inválida do servidor (${res.status})`);
      }

      if (data.success) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        if (expandedId === id) setExpandedId(null);
        if (editingCandidate?.id === id) setEditingCandidate(null);
      } else {
        setDiagnostic({
          url,
          method,
          status: res.status,
          statusText: 'API Error Response',
          contentType: contentType || 'application/json',
          responsePreview: JSON.stringify(data).substring(0, 300)
        });
        alert('Erro ao rejeitar notícia: ' + data.error);
      }
    } catch (err: any) {
      if (!diagnostic) {
        handleNetworkError(err, '/api/admin/garimpo/reject', 'POST');
      }
      alert('Erro de conexão: ' + err.message);
    } finally {
      setActionId(null);
    }
  };

  // Start revision edit form
  const startEditing = (cand: NewsCandidate) => {
    setEditingCandidate(cand);
    setEditTitle((cand.ai_title || cand.original_title).toUpperCase());
    
    // O ai_summary gerado pelo Gemini é o corpo editorial reescrito (2-4 parágrafos)
    // Se ele existir e não for um fallback curto com "...", deve ser o Conteúdo Principal (editContent)
    // e o resumo otimizado deve ser o original (curto) ou um safe excerpt
    const hasAiSummary = typeof cand.ai_summary === 'string' && 
                          cand.ai_summary.trim().length > 0 && 
                          !cand.ai_summary.endsWith('...');
    
    setEditContent(hasAiSummary ? cand.ai_summary! : (cand.original_excerpt || 'Carregando conteúdo completo da matéria...'));
    setEditExcerpt(cand.original_excerpt || (hasAiSummary ? generateSafeExcerpt(cand.ai_summary!, 180) : ''));
    
    setEditCategory(mapAiCategoryToUi(cand.ai_category));
    setEditCoverImage(cand.original_image_url || '');
    setPublishStatus('published');
    setScrapedContent(''); // Limpar ao iniciar nova edição

    // Carregar automaticamente o conteúdo completo em background via API Proxy sem CORS
    loadFullContentForEdit(cand, hasAiSummary);
  };

  // Safe lazy load detail contents for revision using secure server-side API proxy
  const loadFullContentForEdit = async (cand: NewsCandidate, hasAiSummary: boolean) => {
    setActionId(cand.id);
    setLoadingFullContent(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/admin/garimpo/fetch-content?url=${encodeURIComponent(cand.original_url)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP Erro: ${res.status}`);
      
      const data = await res.json();
      if (data.success && data.content) {
        setScrapedContent(data.content);
        
        // APENAS substituir o editContent se NÃO houver um resumo de IA estruturado para preservar
        if (!hasAiSummary) {
          setEditContent(data.content);
        }
        
        // Se a imagem original não estiver salva ou for inválida, mas o scraper extrair uma válida
        if (!editCoverImage && data.imageUrl) {
          setEditCoverImage(data.imageUrl);
        }
      } else {
        const fallback = cand.original_excerpt || 'Conteúdo original não disponível.';
        setScrapedContent(fallback);
        if (!hasAiSummary) {
          setEditContent(fallback);
        }
      }
    } catch (err) {
      console.warn('Não foi possível obter detalhes do conteúdo original via proxy:', err);
      const fallback = cand.original_excerpt || 'Não foi possível carregar o conteúdo original.';
      setScrapedContent(fallback);
      if (!hasAiSummary) {
        setEditContent(fallback);
      }
    } finally {
      setActionId(null);
      setLoadingFullContent(false);
    }
  };

  // Confirm publication and save
  const handleApproveAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    setActionId(editingCandidate.id);
    setDiagnostic(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = '/api/admin/garimpo/approve';
      const method = 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingCandidate.id,
          title: editTitle.toUpperCase(), // Forçar em maiúsculo automaticamente
          excerpt: editExcerpt,
          content: editContent,
          category: editCategory,
          cover_image: editCoverImage || undefined,
          status: publishStatus
        })
      });

      if (!res.ok) {
        await handleApiError(res, url, method);
        throw new Error(`Erro na requisição: HTTP ${res.status}`);
      }

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        await handleApiError(res, url, method);
        throw new Error(`Resposta inválida do servidor (${res.status})`);
      }

      if (data.success) {
        alert(publishStatus === 'published' ? 'Notícia publicada com sucesso!' : 'Notícia salva como rascunho com sucesso!');
        setCandidates(prev => prev.filter(c => c.id !== editingCandidate.id));
        setEditingCandidate(null);
        if (expandedId === editingCandidate.id) setExpandedId(null);
      } else {
        setDiagnostic({
          url,
          method,
          status: res.status,
          statusText: 'API Error Response',
          contentType: contentType || 'application/json',
          responsePreview: JSON.stringify(data).substring(0, 300)
        });
        alert('Erro ao aprovar e publicar notícia: ' + data.error);
      }
    } catch (err: any) {
      if (!diagnostic) {
        handleNetworkError(err, '/api/admin/garimpo/approve', 'POST');
      }
      alert('Erro de conexão: ' + err.message);
    } finally {
      setActionId(null);
    }
  };

  const copySqlToClipboard = () => {
    const sqlText = `-- SQL para criar a tabela de Garimpo de Notícias por IA
CREATE TABLE IF NOT EXISTS public.news_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  external_id TEXT NOT NULL,
  original_url TEXT UNIQUE NOT NULL,
  original_title TEXT NOT NULL,
  original_excerpt TEXT,
  original_image_url TEXT,
  original_published_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  ai_title TEXT,
  ai_summary TEXT,
  ai_category TEXT,
  ai_relevance_score INTEGER CHECK (ai_relevance_score BETWEEN 0 AND 100),
  ai_regional_impact_score INTEGER CHECK (ai_regional_impact_score BETWEEN 0 AND 100),
  ai_viral_potential_score INTEGER CHECK (ai_viral_potential_score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS news_candidates_status_collected_at_idx ON public.news_candidates (status, collected_at DESC);
CREATE INDEX IF NOT EXISTS news_candidates_external_id_idx ON public.news_candidates (source_name, external_id);

ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can select news_candidates" ON public.news_candidates
  FOR SELECT USING (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can insert news_candidates" ON public.news_candidates
  FOR INSERT WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update news_candidates" ON public.news_candidates
  FOR UPDATE USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can delete news_candidates" ON public.news_candidates
  FOR DELETE USING (get_role(auth.uid()) IN ('admin', 'editor'));`;

    navigator.clipboard.writeText(sqlText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // Filtering candidates logic
  const filteredCandidates = candidates.filter(cand => {
    // Tab filtering
    const matchesTab = activeTab === 'pending' 
      ? cand.status === 'pending'
      : activeTab === 'approved_published'
      ? (cand.status === 'approved' || cand.status === 'published')
      : cand.status === 'rejected';

    if (!matchesTab) return false;

    // Source filtering
    if (sourceFilter !== 'all') {
      const actualSourceId = cand.source_id || (cand.source_name.toLowerCase().includes('prefeitura') ? 'prefeitura-prudente' : 'g1-presidente-prudente');
      if (actualSourceId !== sourceFilter) return false;
    }

    // Search query filtering
    if (!searchQuery) return true;
    const normSearch = searchQuery.toLowerCase();
    const titleMatch = (cand.ai_title || cand.original_title || '').toLowerCase().includes(normSearch);
    const summaryMatch = (cand.ai_summary || cand.original_excerpt || '').toLowerCase().includes(normSearch);
    
    return titleMatch || summaryMatch;
  });

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-zinc-100 text-zinc-500';
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return 'Sem data';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Render Missing Table View
  if (missingTable) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase text-zinc-900">Tabela de Notícias Coletadas Ausente</h2>
              <p className="text-zinc-600 text-sm mt-2 leading-relaxed">
                A tabela <code className="bg-white/80 px-1.5 py-0.5 rounded border border-amber-200 font-mono text-xs">news_candidates</code> não foi encontrada no seu banco de dados Supabase. Esta tabela é essencial para hospedar a Fila Editorial do Garimpo de Notícias por IA.
              </p>
              <p className="text-zinc-600 text-sm mt-3 leading-relaxed font-semibold">
                Siga os passos rápidos abaixo para criá-la gratuitamente:
              </p>

              <ol className="list-decimal list-inside text-zinc-600 text-sm mt-3 space-y-2 pl-2">
                <li>Abra o painel do seu projeto no <strong className="text-zinc-900">Supabase</strong>.</li>
                <li>No menu lateral esquerdo, clique em <strong className="text-zinc-900">SQL Editor</strong>.</li>
                <li>Clique em <strong className="text-zinc-900">New query</strong>.</li>
                <li>Copie o script SQL abaixo clicando no botão de copiar.</li>
                <li>Cole o script no editor do Supabase e clique no botão <strong className="text-zinc-900">Run</strong> no canto inferior direito.</li>
              </ol>

              <div className="mt-6">
                <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 rounded-t-2xl">
                  <span className="text-xs font-mono font-bold text-zinc-400">garimpo_schema.sql</span>
                  <button
                    onClick={copySqlToClipboard}
                    className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-red-400 transition-colors"
                  >
                    <Copy size={14} />
                    {sqlCopied ? 'Copiado!' : 'Copiar SQL'}
                  </button>
                </div>
                <pre className="bg-zinc-950 text-zinc-300 text-[11px] font-mono p-4 rounded-b-2xl max-h-60 overflow-y-auto border border-zinc-800 leading-normal select-all">
{`CREATE TABLE IF NOT EXISTS public.news_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  external_id TEXT NOT NULL,
  original_url TEXT UNIQUE NOT NULL,
  original_title TEXT NOT NULL,
  original_excerpt TEXT,
  original_image_url TEXT,
  original_published_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  ai_title TEXT,
  ai_summary TEXT,
  ai_category TEXT,
  ai_relevance_score INTEGER CHECK (ai_relevance_score BETWEEN 0 AND 100),
  ai_regional_impact_score INTEGER CHECK (ai_regional_impact_score BETWEEN 0 AND 100),
  ai_viral_potential_score INTEGER CHECK (ai_viral_potential_score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS news_candidates_status_collected_at_idx ON public.news_candidates (status, collected_at DESC);
CREATE INDEX IF NOT EXISTS news_candidates_external_id_idx ON public.news_candidates (source_name, external_id);

ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can select news_candidates" ON public.news_candidates
  FOR SELECT USING (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can insert news_candidates" ON public.news_candidates
  FOR INSERT WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update news_candidates" ON public.news_candidates
  FOR UPDATE USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can delete news_candidates" ON public.news_candidates
  FOR DELETE USING (get_role(auth.uid()) IN ('admin', 'editor'));`}
                </pre>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => loadCandidates()}
                  className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all w-full sm:w-auto"
                >
                  <RefreshCw size={16} />
                  Testar Conexão Novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview stats or banner */}
      <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Sparkles size={160} />
        </div>
        <div className="max-w-2xl relative z-10">
          <span className="bg-red-600/30 text-red-400 border border-red-600/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Módulo Exclusivo</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight mt-3">Garimpo de Notícias por IA</h2>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Monitoramento de fontes locais e oficiais em tempo real. As notícias recentes coletadas entram na fila editorial para revisão humana antes da publicação.
          </p>
          
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-400 transition-all select-none"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Buscando e analisando novas notícias...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Buscar Novas Notícias
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic panel for invalid responses or connections */}
      {diagnostic && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-black tracking-tight uppercase text-rose-950">Falha ao consultar Garimpo</h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                O servidor retornou uma resposta inválida ou houve falha de comunicação. Isso pode indicar uma tabela ausente ou problema na autenticação. Veja os dados técnicos abaixo para diagnóstico seguro:
              </p>
            </div>
            <button 
              onClick={() => setDiagnostic(null)} 
              className="text-rose-400 hover:text-rose-600 font-bold text-xs"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white/80 p-4 rounded-2xl border border-rose-100 font-mono">
            <div>
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-wider block">Endpoint / URL</span>
              <span className="text-zinc-900 font-semibold break-all">{diagnostic.url}</span>
            </div>
            <div>
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-wider block">Método HTTP</span>
              <span className="text-zinc-900 font-semibold uppercase">{diagnostic.method}</span>
            </div>
            <div>
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-wider block">HTTP Status</span>
              <span className="text-zinc-900 font-semibold">
                {diagnostic.status === 0 ? 'Conexão Rejeitada / Timeout' : `${diagnostic.status} - ${diagnostic.statusText}`}
              </span>
            </div>
            <div className="md:col-span-3 border-t border-rose-100 pt-3">
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-wider block">Content-Type</span>
              <span className="text-zinc-900 font-semibold">{diagnostic.contentType}</span>
            </div>
            <div className="md:col-span-3 border-t border-rose-100 pt-3">
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-wider block">Primeiros 300 caracteres da resposta</span>
              <pre className="bg-zinc-950 text-zinc-300 p-3 rounded-xl mt-1.5 max-h-36 overflow-y-auto text-[11px] leading-relaxed select-all font-mono whitespace-pre-wrap break-all">
                {diagnostic.responsePreview || 'Nenhum corpo de resposta retornado.'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Scraper / scanning results */}
      {scanDetails && (
        <div className="bg-zinc-900 border border-zinc-800 text-white p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight uppercase">Resumo da Varredura Editorial</h4>
              <p className="text-xs text-zinc-400">Fonte: <span className="font-bold text-white">{scanDetails.sourceName}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Encontradas</span>
              <span className="text-lg font-mono font-bold text-white mt-1 block">{scanDetails.scraped}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Identificadas</span>
              <span className="text-lg font-mono font-bold text-amber-400 mt-1 block">{scanDetails.newCandidates}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Salvas</span>
              <span className="text-lg font-mono font-bold text-emerald-400 mt-1 block">{scanDetails.saved}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Duplicadas</span>
              <span className="text-lg font-mono font-bold text-zinc-400 mt-1 block">{scanDetails.duplicates}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Antigas</span>
              <span className="text-lg font-mono font-bold text-blue-400 mt-1 block">{scanDetails.old}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Ignoradas (IA)</span>
              <span className="text-lg font-mono font-bold text-zinc-500 mt-1 block">{scanDetails.ignored}</span>
            </div>
            <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-wider block leading-tight">Erros</span>
              <span className={`text-lg font-mono font-bold mt-1 block ${scanDetails.errorsCount > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                {scanDetails.errorsCount}
              </span>
            </div>
          </div>

          {scanResult?.sourcesBreakdown && (
            <div className="border-t border-zinc-800/80 pt-4 mt-4 space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Breakdown por Provedor</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scanResult.sourcesBreakdown.map((src: any) => (
                  <div key={src.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{src.name}</span>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                        src.status === 'Operacional' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {src.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-[11px] font-mono text-center">
                      <div className="bg-zinc-900/40 p-1.5 rounded-lg">
                        <span className="text-[8px] text-zinc-500 block uppercase font-bold leading-tight">Enc</span>
                        <span className="text-zinc-100 font-bold block mt-0.5">{src.scraped}</span>
                      </div>
                      <div className="bg-zinc-900/40 p-1.5 rounded-lg">
                        <span className="text-[8px] text-zinc-500 block uppercase font-bold leading-tight">Rec</span>
                        <span className="text-amber-400 font-bold block mt-0.5">{src.newCandidates}</span>
                      </div>
                      <div className="bg-zinc-900/40 p-1.5 rounded-lg">
                        <span className="text-[8px] text-zinc-500 block uppercase font-bold leading-tight">Salv</span>
                        <span className="text-emerald-400 font-bold block mt-0.5">{src.saved}</span>
                      </div>
                      <div className="bg-zinc-900/40 p-1.5 rounded-lg">
                        <span className="text-[8px] text-zinc-500 block uppercase font-bold leading-tight">Dup</span>
                        <span className="text-zinc-400 block mt-0.5">{src.duplicates}</span>
                      </div>
                      <div className="bg-zinc-900/40 p-1.5 rounded-lg">
                        <span className="text-[8px] text-zinc-500 block uppercase font-bold leading-tight">Ant</span>
                        <span className="text-blue-400 block mt-0.5">{src.old}</span>
                      </div>
                    </div>
                    {src.error && (
                      <div className="text-[10px] text-red-400 border-t border-zinc-900/60 pt-2 font-mono break-all leading-relaxed">
                        {src.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {scanDetails.errorsCount > 0 && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-2xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} /> Detalhes dos Erros ({scanDetails.errorsCount})
              </h5>
              <div className="max-h-32 overflow-y-auto text-xs text-zinc-400 space-y-1 font-mono leading-relaxed">
                {scanDetails.errorsList.map((err, i) => (
                  <div key={i} className="border-l-2 border-red-500 pl-2 py-0.5">{err}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs and search filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        {/* Tabs statuses */}
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('pending'); setEditingCandidate(null); }}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              activeTab === 'pending' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <Clock size={14} />
            Pendentes
            {candidates.filter(c => c.status === 'pending').length > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {candidates.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('approved_published'); setEditingCandidate(null); }}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              activeTab === 'approved_published' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <Check size={14} />
            Aprovados
          </button>
          <button
            onClick={() => { setActiveTab('rejected'); setEditingCandidate(null); }}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              activeTab === 'rejected' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            )}
          >
            <ThumbsDown size={14} />
            Rejeitados
          </button>
        </div>

        {/* Source and Search Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Source Filter */}
          <div className="flex bg-zinc-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSourceFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                sourceFilter === 'all' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              Todas Fontes
            </button>
            <button
              onClick={() => setSourceFilter('prefeitura-prudente')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                sourceFilter === 'prefeitura-prudente' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              Prefeitura
            </button>
            <button
              onClick={() => setSourceFilter('g1-presidente-prudente')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                sourceFilter === 'g1-presidente-prudente' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              G1 Prudente
            </button>
            <button
              onClick={() => setSourceFilter('inova-prudente')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                sourceFilter === 'inova-prudente' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              Inova Prudente
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Buscar na fila..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Editor revising form section (if active) */}
      {editingCandidate && (
        <div className="bg-zinc-50 border-2 border-red-200 p-6 md:p-8 rounded-3xl space-y-6 animate-fade-in relative">
          <button 
            onClick={() => setEditingCandidate(null)}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-wider">
            <Sparkles size={16} />
            Curadoria Humana / Revisão da Notícia Garimpada
          </div>

          <form onSubmit={handleApproveAndPublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Título da Notícia (Será convertido automaticamente em letras maiúsculas)
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm font-bold tracking-tight text-zinc-900 focus:ring-1 focus:ring-red-500 uppercase focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Categoria Editorial
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
                >
                  <option value="Cidade">Cidade</option>
                  <option value="Política">Política</option>
                  <option value="Segurança">Segurança/Polícia</option>
                  <option value="Esportes">Esportes</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Geral">Geral</option>
                  <option value="Economia">Economia</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Mundo">Mundo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  URL da Imagem de Capa (Opcional)
                </label>
                <input
                  type="text"
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  placeholder="Insira a URL de uma imagem de cobertura"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Resumo Otimizado (Excerpt / Meta-Descrição)
              </label>
              <textarea
                required
                rows={2}
                value={editExcerpt}
                onChange={(e) => setEditExcerpt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                  Conteúdo da Notícia
                  {loadingFullContent && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-wider animate-pulse">
                      <RefreshCw size={10} className="animate-spin" />
                      Buscando original...
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  disabled={loadingFullContent}
                  onClick={() => loadFullContentForEdit(editingCandidate, typeof editingCandidate?.ai_summary === 'string' && editingCandidate.ai_summary.trim().length > 0)}
                  className="text-xs font-bold text-red-600 hover:text-red-800 disabled:text-zinc-400 transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={12} className={cn(loadingFullContent && "animate-spin")} />
                  Recarregar conteúdo completo
                </button>
              </div>
              <textarea
                required
                rows={10}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Insira o texto principal da matéria aqui"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:ring-1 focus:ring-red-500 focus:outline-none font-sans leading-relaxed transition-all",
                  loadingFullContent && "opacity-60 bg-zinc-50"
                )}
              />
              {scrapedContent && (
                <div className="mt-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                      Texto Original Raspado da Fonte (Referência de Comparação)
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditContent(scrapedContent)}
                      className="text-[10px] font-black text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider"
                      title="Substituir o conteúdo editado pelo texto original da fonte"
                    >
                      Copiar original para o editor
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto text-xs text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap select-all font-sans">
                    {scrapedContent}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Publicar notícias como:</span>
                <div className="flex bg-white p-1 rounded-xl border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setPublishStatus('published')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      publishStatus === 'published' ? "bg-red-600 text-white" : "text-zinc-500 hover:text-zinc-800"
                    )}
                  >
                    Publicado
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishStatus('draft')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      publishStatus === 'draft' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-800"
                    )}
                  >
                    Rascunho (Draft)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-200 transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionId !== null}
                  className="flex-1 sm:flex-initial bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-red-700 transition-all text-center"
                >
                  {actionId ? 'Salvando...' : 'Confirmar & Publicar Notícia'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main candidate list rendering */}
      {loading && candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="animate-spin text-red-600" size={32} />
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Carregando notícias...</p>
        </div>
      ) : diagnostic && candidates.length === 0 ? (
        <div className="border border-red-200 bg-red-50/50 rounded-3xl py-12 px-4 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <AlertTriangle className="text-red-600 mb-3" size={40} />
          <h3 className="text-sm font-black tracking-tight text-red-950 uppercase">Erro ao carregar notícias</h3>
          <p className="text-red-800 text-xs mt-2 leading-relaxed max-w-md">
            Não foi possível carregar as notícias do servidor ou do banco de dados no momento.
          </p>
          <button
            onClick={() => loadCandidates()}
            className="mt-4 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-red-700 transition-all shadow-sm"
          >
            <RefreshCw size={12} />
            Tentar novamente
          </button>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-3xl py-20 px-4 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <BookOpen className="text-zinc-300 mb-4" size={48} />
          <h3 className="text-base font-black tracking-tight text-zinc-700 uppercase">Fila Editorial Vazia</h3>
          <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
            Não há notícias {activeTab === 'pending' ? 'pendentes para aprovação' : activeTab === 'approved_published' ? 'aprovadas/publicadas' : 'rejeitadas'} no momento.
          </p>
          {activeTab === 'pending' && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="mt-6 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={cn(isScanning && "animate-spin")} />
              Verificar portal oficial agora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((cand) => {
            const isExpanded = expandedId === cand.id;
            
            return (
              <div 
                key={cand.id} 
                className={cn(
                  "border rounded-3xl bg-white transition-all shadow-sm overflow-hidden",
                  isExpanded ? "border-zinc-300 ring-1 ring-zinc-100" : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                {/* Header card element */}
                <div className="p-5 md:p-6 flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border",
                        (cand.source_id === 'g1-presidente-prudente' || cand.source_name.toLowerCase().includes('g1'))
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : cand.source_id === 'inova-prudente'
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        <Globe size={10} />
                        {cand.source_name}
                      </span>
                      
                      <span className="text-zinc-400 text-[10px] font-bold flex items-center gap-1">
                        <Clock size={10} />
                        {formatDateString(cand.original_published_at)}
                      </span>

                      {cand.ai_category && (
                        <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                          {cand.ai_category}
                        </span>
                      )}

                      {/* Status badge for Aprovados Tab */}
                      {activeTab === 'approved_published' && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          cand.status === 'published' 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}>
                          {cand.status === 'published' ? 'PUBLICADA NO FEED' : 'APROVADA (RASCUNHO)'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black tracking-tight text-zinc-900 leading-snug uppercase">
                      {cand.ai_title || cand.original_title}
                    </h3>
                    
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 md:line-clamp-3">
                      {cand.ai_summary || cand.original_excerpt}
                    </p>

                    {/* Deduplication warning if possible duplicate is flagged */}
                    {cand.possible_duplicate_of && (() => {
                      const relatedCand = candidates.find(c => c.id === cand.possible_duplicate_of);
                      if (relatedCand) {
                        const similarityValue = checkTitleSimilarityValue(cand.original_title || cand.ai_title || '', relatedCand.original_title || relatedCand.ai_title || '');
                        const similarityPercent = Math.round(similarityValue * 100);
                        
                        return (
                          <div className="mt-3 bg-amber-50/80 border border-amber-200 text-amber-950 px-4 py-3 rounded-2xl text-[11px] space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[12px]">
                              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                              <span>Possível pauta duplicada semântica detectada</span>
                            </div>
                            <div className="text-zinc-700 pl-5 space-y-1">
                              <p><strong>Matéria relacionada:</strong> <span className="uppercase">{relatedCand.ai_title || relatedCand.original_title}</span></p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-semibold">
                                <span>Fonte: <span className="text-zinc-700">{relatedCand.source_name}</span></span>
                                <span>Publicação: <span className="text-zinc-700">{formatDateString(relatedCand.original_published_at)}</span></span>
                                <span>Similaridade: <span className="text-amber-700 font-black">{similarityPercent}%</span></span>
                                <span>Status: <span className="text-zinc-700">{relatedCand.status === 'pending' ? 'Pendente' : relatedCand.status === 'published' ? 'Publicado' : relatedCand.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</span></span>
                              </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium italic pl-5 pt-0.5 border-t border-amber-200/50">
                              * O editor possui autonomia total para decidir se aproveita, rejeita ou aguarda atualizações.
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="mt-2 bg-amber-50/70 border border-amber-200 text-amber-900 px-3 py-2 rounded-2xl text-[11px] flex items-center gap-1.5 font-medium">
                          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                          <span><strong>Possível pauta duplicada:</strong> Cobertura de pauta similar identificada no Garimpo (ID: {cand.possible_duplicate_of.substring(0, 8)}...).</span>
                        </div>
                      );
                    })()}

                    {/* Image rights advisory */}
                    {cand.original_image_url && (
                      <div className="mt-2 flex items-center">
                        {(cand.source_id === 'g1-presidente-prudente' || cand.source_name.toLowerCase().includes('g1')) ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            <AlertTriangle size={10} />
                            Imagem G1 Protegida (Requer Imagem Própria ou Atribuição Estrita)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            <Check size={10} />
                            Imagem Prefeitura (Domínio Público - Uso Livre)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Historical Editorial tracking details */}
                    {activeTab === 'approved_published' && (
                      <div className="text-[10px] text-zinc-500 font-mono space-y-0.5 mt-2 pt-2 border-t border-zinc-100">
                        {cand.approved_at && (
                          <div>
                            <span className="font-bold text-zinc-700">Aprovado em:</span> {new Date(cand.approved_at).toLocaleString('pt-BR')}
                          </div>
                        )}
                        {cand.published_news_id && (
                          <div className="mt-1">
                            <span className="font-bold text-zinc-700">ID de Publicação:</span>{' '}
                            <span className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-600 font-mono text-[9px]">{cand.published_news_id}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Scores metrics panel */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className={cn("px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider text-center shrink-0 min-w-20", getScoreColor(cand.ai_relevance_score))}>
                        <div className="text-[8px] opacity-70">Relevância</div>
                        <div className="text-xs leading-none mt-0.5">{cand.ai_relevance_score}%</div>
                      </div>

                      <div className={cn("px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider text-center shrink-0 min-w-20", getScoreColor(cand.ai_regional_impact_score))}>
                        <div className="text-[8px] opacity-70">Impacto Reg.</div>
                        <div className="text-xs leading-none mt-0.5">{cand.ai_regional_impact_score}%</div>
                      </div>

                      <div className={cn("px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider text-center shrink-0 min-w-20", getScoreColor(cand.ai_viral_potential_score))}>
                        <div className="text-[8px] opacity-70">Viralizável</div>
                        <div className="text-xs leading-none mt-0.5">{cand.ai_viral_potential_score}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom interactive rail */}
                <div className="bg-zinc-50/70 border-t border-zinc-100 px-5 py-3 flex items-center justify-between gap-4">
                  {/* Left expansion buttons */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : cand.id)}
                    className="text-zinc-500 hover:text-zinc-800 text-xs font-bold flex items-center gap-1 transition-colors select-none"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={16} />
                        Recolher detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Ver conteúdo original & imagem
                      </>
                    )}
                  </button>

                  {/* Right quick actions */}
                  <div className="flex items-center gap-1.5">
                    {cand.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReject(cand.id)}
                          disabled={actionId !== null}
                          className="bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 p-2 rounded-xl transition-all select-none"
                          title="Rejeitar"
                        >
                          <ThumbsDown size={14} />
                        </button>
                        <button
                          onClick={() => startEditing(cand)}
                          disabled={actionId !== null}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm select-none"
                        >
                          <Edit size={12} />
                          Revisar & Publicar
                        </button>
                      </>
                    )}

                    <a
                      href={cand.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                      title="Ver original"
                    >
                      <ExternalLink size={14} />
                      <span className="hidden sm:inline">Ver no portal</span>
                    </a>
                  </div>
                </div>

                {/* Expanded content panel details */}
                {isExpanded && (
                  <div className="p-5 md:p-6 border-t border-zinc-200 bg-zinc-50/30 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <div>
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">Título Original da Prefeitura</span>
                          <p className="text-zinc-800 text-sm font-semibold uppercase">{cand.original_title}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">Resumo do Garimpo</span>
                          <p className="text-zinc-700 text-xs leading-relaxed whitespace-pre-wrap">{cand.ai_summary || cand.original_excerpt || 'Sem resumo disponível'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">Imagem de Capa</span>
                        {cand.original_image_url ? (
                          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-white aspect-video lg:aspect-square w-full shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={cand.original_image_url} 
                              alt="Capa original" 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-100 aspect-video lg:aspect-square w-full shrink-0 flex flex-col items-center justify-center p-4 text-center">
                            <span className="text-zinc-400 text-xs font-semibold leading-normal">Esta matéria não possui imagem de capa na fonte original.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
