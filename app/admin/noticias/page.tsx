'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Plus, 
  CheckCircle, 
  Clock, 
  Filter, 
  Calendar, 
  Eye, 
  Copy, 
  FileText, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { News } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { useAdminCache } from '../context/AdminCacheContext';

type DateFilterType = 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom';
type SortType = 'newest' | 'oldest' | 'most_viewed';
type TabStatusType = 'all' | 'published' | 'draft' | 'scheduled' | 'archived';

// Local helpers for robust offline/fallback data persistence
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

function setStoredData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export default function NewsList() {
  const { newsList, newsCategories: categoriesList, newsLoading: loading, refreshNews, setNewsList } = useAdminCache();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  // Tabs & Search
  const [activeTab, setActiveTab] = useState<TabStatusType>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Period Filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Custom confirmation modal for safe deletions
  const [newsToDelete, setNewsToDelete] = useState<News | null>(null);

  // Debounce search input to avoid heavy re-filtering/rendering overhead
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset pagination to first page when any search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, selectedCategory, dateFilter, startDate, endDate, sortBy]);

  useEffect(() => {
    refreshNews();
  }, []);

  // Safe confirm deletion execution
  const executeDelete = async (id: string) => {
    setActionLoadingId(id);
    setNewsToDelete(null);
    try {
      if (isSupabaseConfigured) {
        // Deletion cascades automatically on Supabase tables news_views, news_likes, news_comments due to ON DELETE CASCADE constraints.
        const { error } = await supabase
          .from('news')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        // Fallback local storage deletion
        const local = getStoredData<any[]>('mp_fallback_posts', []);
        const filtered = local.filter((p: any) => p.id !== id);
        setStoredData('mp_fallback_posts', filtered);
        
        // Cleanup comments, likes, views locally too for visual integrity
        const localComments = getStoredData<any[]>('mp_fallback_comments', []);
        setStoredData('mp_fallback_comments', localComments.filter((c: any) => c.news_id !== id));
        
        const localLikes = getStoredData<any[]>('mp_fallback_likes', []);
        setStoredData('mp_fallback_likes', localLikes.filter((l: any) => l.news_id !== id));

        const localViews = getStoredData<any[]>('mp_fallback_views', []);
        setStoredData('mp_fallback_views', localViews.filter((v: any) => v.news_id !== id));
      }

      setNewsList(prev => prev.filter(n => n.id !== id));
      alert('Notícia excluída com sucesso.');
    } catch (error: any) {
      console.error('Error deleting news:', error);
      alert('Erro ao excluir notícia: ' + (error.message || error));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick action: publish / unpublish toggler from the list
  const handleToggleStatus = async (item: News, newStatus: 'published' | 'draft') => {
    setActionLoadingId(item.id);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('news')
          .update({ status: newStatus })
          .eq('id', item.id);
        
        if (error) throw error;
      } else {
        const local = getStoredData<any[]>('mp_fallback_posts', []);
        const idx = local.findIndex((p: any) => p.id === item.id);
        if (idx !== -1) {
          local[idx].status = newStatus;
          local[idx].updated_at = new Date().toISOString();
          setStoredData('mp_fallback_posts', local);
        }
      }

      setNewsList(prev => prev.map(n => n.id === item.id ? { ...n, status: newStatus } : n));
      alert(`Status da notícia alterado para ${newStatus === 'published' ? 'Publicado' : 'Rascunho'}.`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Erro ao alterar status: ' + (error.message || error));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick action: duplicate news item securely
  const handleDuplicate = async (item: News) => {
    setActionLoadingId(item.id);
    try {
      const baseSlug = item.slug.endsWith('-copia') ? item.slug : `${item.slug}-copia`;
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      
      const duplicatedData = {
        title: `${item.title} (Cópia)`,
        slug: uniqueSlug,
        content: item.content || '',
        excerpt: item.excerpt || '',
        cover_image: item.cover_image || null,
        category: item.category || 'Geral',
        status: 'draft', // duplicated items are always drafts initially for editing safety
        author_id: item.author_id || 'system',
        city_slug: item.city_slug || 'presidente-prudente',
        city_name: item.city_name || 'Presidente Prudente',
        region: item.region || 'SP',
        is_breaking: item.is_breaking || false,
        ai_classification: item.ai_classification || item.category || 'Geral',
        ai_relevance_score: item.ai_relevance_score || 50,
        ai_viral_potential_score: item.ai_viral_potential_score || 50,
        ai_regional_impact_score: item.ai_regional_impact_score || 50,
        ai_summary: item.ai_summary || '',
        ai_seo_title: item.ai_seo_title || '',
        ai_seo_description: item.ai_seo_description || '',
      };

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('news')
          .insert([duplicatedData]);
        
        if (error) throw error;
      } else {
        const local = getStoredData<any[]>('mp_fallback_posts', []);
        const localNewItem = {
          ...duplicatedData,
          id: `post-${Math.random().toString(36).substring(2, 11)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        local.unshift(localNewItem);
        setStoredData('mp_fallback_posts', local);
      }

      alert('Notícia duplicada com sucesso como Rascunho!');
      await refreshNews();
    } catch (error: any) {
      console.error('Error duplicating news:', error);
      alert('Erro ao duplicar notícia: ' + (error.message || error));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveTab('all');
    setSelectedCategory('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  // Comprehensive Search, Tab Status and Period Filtering Logic
  const filteredAndSortedNews = newsList
    .filter(item => {
      // Tab Filter (Draft / Published correspond to Postgres constraints)
      const itemStatusStr = item.status as string;
      if (activeTab === 'published' && itemStatusStr !== 'published') return false;
      if (activeTab === 'draft' && itemStatusStr !== 'draft') return false;
      if (activeTab === 'scheduled' && itemStatusStr !== 'scheduled') return false;
      if (activeTab === 'archived' && itemStatusStr !== 'archived') return false;

      // Debounced Search Input (Matches Title, Slug, Category, and City Name)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch = 
          (item.title && item.title.toLowerCase().includes(query)) ||
          (item.slug && item.slug.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.city_name && item.city_name.toLowerCase().includes(query)) ||
          (item.excerpt && item.excerpt.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Category Filter Select
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Created_at Period Filter
      if (dateFilter !== 'all' && item.created_at) {
        const itemDate = new Date(item.created_at);
        const now = new Date();
        
        if (dateFilter === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (itemDate < today) return false;
        } else if (dateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (itemDate < sevenDaysAgo) return false;
        } else if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          if (itemDate < thirtyDaysAgo) return false;
        } else if (dateFilter === 'this_month') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          firstDayOfMonth.setHours(0, 0, 0, 0);
          if (itemDate < firstDayOfMonth) return false;
        } else if (dateFilter === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'most_viewed') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      return 0;
    });

  // Calculate status counts across entire unfiltered list
  const tabCounts = {
    all: newsList.length,
    published: newsList.filter(n => n.status === 'published').length,
    draft: newsList.filter(n => n.status === 'draft').length,
    scheduled: newsList.filter(n => (n.status as string) === 'scheduled').length,
    archived: newsList.filter(n => (n.status as string) === 'archived').length,
  };

  // Pagination bounds calculation
  const totalItems = filteredAndSortedNews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedNews = filteredAndSortedNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading && newsList.length === 0) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={36} />
      <p className="text-zinc-400 font-extrabold uppercase tracking-widest text-[10px]">Carregando Central de Notícias...</p>
    </div>
  );

  return (
    <div className="space-y-6" id="central-noticias-dashboard">
      
      {/* 1. Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5" id="news-header">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900" id="news-main-title">
            NOTÍCIAS
          </h2>
          <p className="text-zinc-500 text-sm mt-1" id="news-sub-title">
            Gerencie, edite e acompanhe todas as publicações do portal.
          </p>
        </div>
        <Link 
          href="/admin/noticias/nova" 
          id="btn-nova-noticia"
          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          Nova Notícia
        </Link>
      </div>

      {/* 2. Responsive Abas / Filtros (Tabs) */}
      <div className="border-b border-zinc-200" id="news-status-tabs">
        <div className="flex overflow-x-auto no-scrollbar -mb-px gap-2 pb-1 pt-1">
          {(['all', 'published', 'draft', 'scheduled', 'archived'] as TabStatusType[]).map((tab) => {
            const labels: Record<TabStatusType, string> = {
              all: 'TODAS',
              published: 'PUBLICADAS',
              draft: 'RASCUNHOS',
              scheduled: 'AGENDADAS',
              archived: 'ARQUIVADAS'
            };
            
            const isActive = activeTab === tab;
            const count = tabCounts[tab];

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                id={`tab-filter-${tab}`}
                className={cn(
                  "border-b-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 outline-none cursor-pointer",
                  isActive 
                    ? "border-red-600 text-red-600 font-black" 
                    : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300"
                )}
              >
                {labels[tab]}
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] rounded-full font-bold",
                  isActive ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search and Advanced Filters Layout */}
      <div className="bg-zinc-50 p-4 md:p-6 rounded-2xl border border-zinc-200/60 space-y-4" id="advanced-filters-panel">
        
        {/* Row 1: Search, Category, and Sorting */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search Input with Debounce */}
          <div className="relative md:col-span-5 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar notícias por título, slug, categoria..." 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              id="search-news-input"
              className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-12 pr-4 text-xs font-semibold focus:ring-2 focus:ring-red-600 transition-all outline-none h-11"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                aria-label="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-1.5 md:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              id="filter-category-select"
              className="bg-white border border-zinc-200 text-zinc-700 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none w-full h-11"
            >
              <option value="all">Todas as categorias</option>
              {categoriesList.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Filter Period */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilterType)}
              id="filter-date-select"
              className="bg-white border border-zinc-200 text-zinc-700 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none w-full h-11"
            >
              <option value="all">Todo o período</option>
              <option value="today">Hoje</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="this_month">Este mês</option>
              <option value="custom">Período personalizado</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortType)}
              id="filter-sort-select"
              className="bg-white border border-zinc-200 text-zinc-700 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none w-full h-11"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="most_viewed">Mais visualizadas</option>
            </select>
          </div>

        </div>

        {/* Custom Date Picker Fields (Activated if dateFilter is 'custom') */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-200/40 animate-in fade-in duration-200" id="custom-date-fields">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Data Inicial</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  id="custom-date-start"
                  className="bg-white border border-zinc-200 text-zinc-700 rounded-xl pl-10 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none w-full h-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Data Final</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  id="custom-date-end"
                  className="bg-white border border-zinc-200 text-zinc-700 rounded-xl pl-10 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 outline-none w-full h-10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Created_at filter details banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/40 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-zinc-400 shrink-0" />
            <span>Filtro de período ativo na Data de Criação (created_at)</span>
          </div>
          <div className="bg-zinc-200/50 border border-zinc-200 text-zinc-700 rounded-lg px-2.5 py-1 text-[10px] font-black">
            Total Encontrado: <span className="text-red-600">{totalItems}</span>
          </div>
        </div>
      </div>

      {/* 4. List Results Container */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm" id="news-results-container">
        
        {/* DESKTOP VIEW: RESPONSIVE TABLE (No horizontal scroll on standard viewport) */}
        <div className="hidden md:block overflow-x-auto" id="desktop-news-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-5/12">Notícia</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-1.5/12">Categoria</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-1.5/12">Cidade</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-1.5/12">Status</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-1.5/12">Data</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-1/12 text-center">Acessos</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right w-1/12">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedNews.length > 0 ? (
                paginatedNews.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Cover Image Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200 shrink-0 flex items-center justify-center">
                          {item.cover_image ? (
                            <img 
                              src={item.cover_image} 
                              alt="Capa" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText size={18} className="text-zinc-400" />
                          )}
                        </div>
                        {/* Title and Excerpt */}
                        <div className="min-w-0 flex flex-col">
                          <span className="font-extrabold text-xs text-zinc-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug" title={item.title}>
                            {item.title}
                          </span>
                          {item.excerpt && (
                            <span className="text-[11px] text-zinc-400 truncate max-w-sm mt-1">
                              {item.excerpt}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black uppercase text-red-600 tracking-wider bg-red-50 border border-red-100 rounded-md px-2.5 py-0.5">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-zinc-600 font-bold text-xs">
                        <MapPin size={11} className="text-zinc-400" />
                        <span className="truncate max-w-[120px]">{item.city_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-[9px] font-black uppercase rounded-full border tracking-wider flex items-center gap-1 w-fit",
                        (item.status as string) === 'published' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : (item.status as string) === 'draft'
                          ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                          : (item.status as string) === 'scheduled'
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        {(item.status as string) === 'published' ? (
                          <><CheckCircle size={9} /> PUBLICADO</>
                        ) : (item.status as string) === 'draft' ? (
                          <><Clock size={9} /> RASCUNHO</>
                        ) : (item.status as string) === 'scheduled' ? (
                          <><Calendar size={9} /> AGENDADA</>
                        ) : (
                          <><X size={9} /> ARQUIVADA</>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-zinc-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-zinc-500 font-black text-xs">
                        <Eye size={12} className="text-zinc-400" />
                        <span>{item.viewsCount}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Custom actions popup menu triggers/shortcuts */}
                        {item.status === 'published' ? (
                          <button
                            onClick={() => handleToggleStatus(item, 'draft')}
                            disabled={actionLoadingId === item.id}
                            title="Despublicar (Mudar para rascunho)"
                            className="p-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-lg border border-zinc-200/50 transition-colors"
                          >
                            <Clock size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(item, 'published')}
                            disabled={actionLoadingId === item.id}
                            title="Publicar agora"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 rounded-lg border border-emerald-100 transition-colors"
                          >
                            <CheckCircle size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDuplicate(item)}
                          disabled={actionLoadingId === item.id}
                          title="Duplicar Notícia"
                          className="p-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-blue-600 rounded-lg border border-zinc-200/50 transition-colors"
                        >
                          <Copy size={12} />
                        </button>

                        <Link 
                          href={`/admin/noticias/editar/${item.id}`} 
                          title="Editar"
                          className="p-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-red-600 rounded-lg border border-zinc-200/50 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                        >
                          <Edit size={12} />
                        </Link>
                        
                        <Link 
                          href={`/noticia/${item.slug}`} 
                          target="_blank" 
                          title="Visualizar no site"
                          className="p-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-lg border border-zinc-200/50 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                        >
                          <ExternalLink size={12} />
                        </Link>
                        
                        <button 
                          onClick={() => setNewsToDelete(item)}
                          disabled={actionLoadingId === item.id}
                          title="Excluir notícia"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600 rounded-lg border border-rose-100/50 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                        >
                          {actionLoadingId === item.id ? (
                            <Loader2 className="animate-spin text-rose-600" size={12} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-400 italic text-xs uppercase font-extrabold tracking-wider">
                    {newsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertTriangle className="text-zinc-400" size={32} />
                        <p>Nenhuma notícia cadastrada ainda.</p>
                        <Link href="/admin/noticias/nova" className="mt-2 text-xs text-red-600 font-black underline uppercase">Criar primeira notícia</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertTriangle className="text-zinc-400" size={32} />
                        <p>Nenhuma notícia encontrada com os filtros selecionados.</p>
                        <button onClick={handleClearFilters} className="mt-2 py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors">Limpar filtros</button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW: VERTICAL CARD LIST (Optimized for 360px, 390px, 412px viewports) */}
        <div className="block md:hidden p-4 space-y-4" id="mobile-news-cards">
          {paginatedNews.length > 0 ? (
            paginatedNews.map(item => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-3 transition-colors hover:border-zinc-300 min-w-0"
              >
                {/* Header: Thumbnail & Metadata */}
                <div className="flex gap-3 items-start">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-zinc-100 overflow-hidden relative border border-zinc-200 shrink-0 flex items-center justify-center">
                    {item.cover_image ? (
                      <img 
                        src={item.cover_image} 
                        alt="Capa" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText size={20} className="text-zinc-400" />
                    )}
                  </div>
                  {/* Title & category */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase text-red-600 tracking-wider bg-red-50 border border-red-100 rounded px-1.5 py-0.5 inline-block mb-1">
                      {item.category}
                    </span>
                    <h3 className="font-extrabold text-xs text-zinc-900 leading-snug break-words">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* City & View Metrics */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-bold border-t border-zinc-100/80 pt-2 bg-zinc-50/40 p-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-zinc-400" />
                    <span>{item.city_name}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Eye size={12} className="text-zinc-400" />
                    <span>{item.viewsCount} acessos</span>
                  </div>
                </div>

                {/* Status & Date */}
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <span className={cn(
                    "px-2 py-0.5 text-[8px] font-black rounded border tracking-wider",
                    (item.status as string) === 'published' 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : (item.status as string) === 'draft'
                      ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                      : (item.status as string) === 'scheduled'
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  )}>
                    {(item.status as string) === 'published' ? 'PUBLICADO' : (item.status as string) === 'draft' ? 'RASCUNHO' : (item.status as string) === 'scheduled' ? 'AGENDADA' : 'ARQUIVADA'}
                  </span>
                  <span className="text-[9px]">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {/* Touch-safe Action Buttons with 44px boundaries */}
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100/80 pt-3">
                  <Link 
                    href={`/admin/noticias/editar/${item.id}`} 
                    className="flex-1 min-w-[70px] h-11 border border-zinc-200 hover:bg-zinc-50 bg-white rounded-xl text-zinc-700 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit size={13} />
                    Editar
                  </Link>

                  <button
                    onClick={() => handleToggleStatus(item, item.status === 'published' ? 'draft' : 'published')}
                    disabled={actionLoadingId === item.id}
                    className={cn(
                      "flex-1 min-w-[70px] h-11 border rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors",
                      item.status === 'published'
                        ? "border-amber-200 hover:bg-amber-50/50 text-amber-700 bg-white"
                        : "border-emerald-200 hover:bg-emerald-50/50 text-emerald-700 bg-white"
                    )}
                  >
                    {item.status === 'published' ? <Clock size={13} /> : <CheckCircle size={13} />}
                    {item.status === 'published' ? 'Unpub' : 'Pub'}
                  </button>

                  <button
                    onClick={() => handleDuplicate(item)}
                    disabled={actionLoadingId === item.id}
                    className="h-11 w-11 border border-zinc-200 hover:bg-zinc-50 bg-white rounded-xl text-zinc-600 flex items-center justify-center shrink-0 transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={13} />
                  </button>

                  <Link 
                    href={`/noticia/${item.slug}`} 
                    target="_blank" 
                    className="h-11 w-11 border border-zinc-200 hover:bg-zinc-50 bg-white rounded-xl text-zinc-600 flex items-center justify-center shrink-0 transition-colors"
                    title="Visualizar"
                  >
                    <ExternalLink size={13} />
                  </Link>

                  <button 
                    onClick={() => setNewsToDelete(item)}
                    disabled={actionLoadingId === item.id}
                    className="flex-1 min-w-[70px] h-11 border border-rose-200 hover:bg-rose-50 bg-white rounded-xl text-rose-600 text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Excluir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-zinc-400 italic text-xs uppercase font-extrabold tracking-wider bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl">
              {newsList.length === 0 ? (
                <div className="p-4 space-y-2">
                  <p>Nenhuma notícia cadastrada.</p>
                  <Link href="/admin/noticias/nova" className="text-xs text-red-600 underline">Criar primeira notícia</Link>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <p>Sem resultados para os filtros.</p>
                  <button onClick={handleClearFilters} className="text-xs text-red-600 underline cursor-pointer">Limpar filtros</button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 5. Pagination Component */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 border border-zinc-200/60 p-4 rounded-xl" id="news-pagination">
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
            Mostrando {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(totalItems, currentPage * itemsPerPage)} de {totalItems} notícias
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-9 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-700 text-xs font-black uppercase flex items-center gap-1 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-black flex items-center justify-center transition-colors border",
                      isCurrent 
                        ? "bg-red-600 border-red-600 text-white" 
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-700 text-xs font-black uppercase flex items-center gap-1 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Custom Modal for Deletion Confirmation */}
      {newsToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="deletion-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="text-base font-black uppercase tracking-tight text-zinc-900">
                Confirmar Exclusão Segura
              </h3>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Tem certeza que deseja excluir esta notícia? Esta ação é definitiva. Todos os comentários, curtidas e contagem de visualizações serão limpos automaticamente.
            </p>
            <div className="bg-zinc-50 border border-zinc-150 p-3.5 rounded-xl mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Título da Notícia</span>
              <p className="font-extrabold text-xs text-zinc-800 break-words line-clamp-3">{newsToDelete.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewsToDelete(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeDelete(newsToDelete.id)}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                Excluir notícia
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
