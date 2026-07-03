'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, ArrowLeft, Image as ImageIcon, Type, AlignLeft } from 'lucide-react';

const CATEGORY_SUGGESTIONS = ['Cidade', 'Política', 'Segurança', 'Esportes', 'Cultura', 'Geral'];

export default function NewNewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image: '',
    category: 'Geral',
    status: 'draft' as 'draft' | 'published',
    
    // Multi-city Tenant
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    region: 'SP',
    is_breaking: false,

    // AI Editorial Engine
    ai_classification: '',
    ai_relevance_score: 50,
    ai_viral_potential_score: 50,
    ai_regional_impact_score: 50,
    ai_summary: '',
    ai_seo_title: '',
    ai_seo_description: '',
  });

  const CITIES = [
    { slug: 'presidente-prudente', name: 'Presidente Prudente', region: 'SP' },
    { slug: 'regiao-prudente', name: 'Região de Prudente (Oeste Paulista)', region: 'SP' }
  ];

  const handleCityChange = (slug: string) => {
    const selected = CITIES.find(c => c.slug === slug);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        city_slug: selected.slug,
        city_name: selected.name,
        region: selected.region
      }));
    }
  };

  const handleAIAnalyze = async () => {
    if (!formData.title || !formData.content) {
      alert('Por favor, preencha o Título e o Conteúdo da matéria antes de rodar a IA.');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai-editorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, content: formData.content })
      });
      if (!res.ok) throw new Error('Falha de conexão com o servidor de IA.');
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        category: data.category || prev.category,
        city_slug: data.city_slug || prev.city_slug,
        city_name: data.city_name || prev.city_name,
        region: data.city_slug === 'rio-de-janeiro' ? 'RJ' : data.city_slug === 'brasilia' ? 'DF' : data.city_slug === 'nacional' ? 'BR' : 'SP',
        is_breaking: data.is_breaking ?? prev.is_breaking,
        ai_classification: data.category || prev.category,
        ai_relevance_score: data.relevance_score ?? 50,
        ai_viral_potential_score: data.viral_potential_score ?? 50,
        ai_regional_impact_score: data.regional_impact_score ?? 50,
        ai_summary: data.ai_summary || '',
        ai_seo_title: data.ai_seo_title || '',
        ai_seo_description: data.ai_seo_description || '',
        excerpt: prev.excerpt || data.ai_summary || '',
      }));
    } catch (err: any) {
      alert('Erro na análise da IA: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('news')
        .insert([{
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          excerpt: formData.excerpt || null,
          cover_image: formData.cover_image || null,
          category: formData.category,
          status: formData.status === 'published' ? 'published' : 'draft',
          author_id: user.id,
          city_slug: formData.city_slug,
          city_name: formData.city_name,
          region: formData.region,
          is_breaking: formData.is_breaking,
          ai_classification: formData.ai_classification || formData.category,
          ai_relevance_score: formData.ai_relevance_score,
          ai_viral_potential_score: formData.ai_viral_potential_score,
          ai_regional_impact_score: formData.ai_regional_impact_score,
          ai_summary: formData.ai_summary || null,
          ai_seo_title: formData.ai_seo_title || null,
          ai_seo_description: formData.ai_seo_description || null
        }]);

      if (error) throw error;
      router.push('/admin/noticias');
    } catch (error: any) {
      console.warn('Error creating news in Supabase, saving to local cache instead:', error);
      if (typeof window !== 'undefined') {
        try {
          const item = window.localStorage.getItem('mp_fallback_posts');
          
          // Use default posts list as baseline if not yet stored
          const baselinePosts = item ? JSON.parse(item) : [];
          
          const newPost = {
            id: `post-${Date.now()}`,
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            excerpt: formData.excerpt || null,
            cover_image_url: formData.cover_image || null,
            category_id: `cat-${Date.now()}`,
            status: formData.status === 'published' ? 'published' : 'draft',
            author_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: formData.status === 'published' ? new Date().toISOString() : null,
            category: { name: formData.category, slug: formData.category.toLowerCase() },
            author: { full_name: 'Antônio Silva' },
            
            // AI and City fields
            city_slug: formData.city_slug,
            city_name: formData.city_name,
            region: formData.region,
            is_breaking: formData.is_breaking,
            ai_classification: formData.ai_classification || formData.category,
            ai_relevance_score: formData.ai_relevance_score,
            ai_viral_potential_score: formData.ai_viral_potential_score,
            ai_regional_impact_score: formData.ai_regional_impact_score,
            ai_summary: formData.ai_summary || null,
            ai_seo_title: formData.ai_seo_title || null,
            ai_seo_description: formData.ai_seo_description || null
          };

          const updatedPosts = [newPost, ...baselinePosts];
          window.localStorage.setItem('mp_fallback_posts', JSON.stringify(updatedPosts));
          router.push('/admin/noticias');
        } catch (e: any) {
          console.error(e);
          alert('Erro ao salvar localmente: ' + e.message);
        }
      } else {
        alert('Erro ao criar notícia: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-all text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Nova Notícia</h2>
            <p className="text-xs text-zinc-500">Escreva e publique uma nova matéria no portal multi-cidades.</p>
          </div>
        </div>

        {/* AI Action Trigger */}
        <button
          type="button"
          onClick={handleAIAnalyze}
          disabled={analyzing || !formData.title || !formData.content}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3 px-5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 border border-indigo-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Analisando com IA...
            </>
          ) : (
            <>
              <span>✨</span> Classificar e Otimizar com IA
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 space-y-5 shadow-sm">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título da Notícia</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-2xl py-4 px-6 text-lg font-bold focus:ring-2 focus:ring-red-100 outline-none transition-all text-zinc-900"
                placeholder="Ex: Reforma da Praça Central em Presidente Prudente é iniciada..."
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Slug / Link permanente</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-2.5 px-4 text-xs font-mono focus:ring-2 focus:ring-red-100 outline-none transition-all text-zinc-800"
                placeholder="link-da-noticia"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Linha de Apoio / Resumo Público</label>
              <textarea
                value={formData.excerpt}
                onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-2xl py-3 px-5 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all min-h-[80px] text-zinc-800"
                placeholder="Um breve resumo de uma ou duas frases que aparece logo abaixo do título nas listagens."
              />
            </div>

            {/* Content (Simple Rich Text Input) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Conteúdo da Matéria (HTML ou Texto plano)</label>
              <textarea
                required
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all min-h-[250px] text-zinc-800"
                placeholder="Escreva o texto completo da sua notícia aqui..."
              />
            </div>
          </div>

          {/* AI Editorial Engine Panel */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 text-white space-y-6 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">Painel de Inteligência Editorial AI</h3>
                <p className="text-[10px] text-zinc-400">Dados preditivos gerados pelo Gemini Editorial Engine.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Relevance Score */}
              <div className="space-y-2 bg-zinc-800/40 p-4 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-400">Relevância Geral</span>
                  <span className="font-mono text-indigo-400 font-bold">{formData.ai_relevance_score}/100</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.ai_relevance_score}
                  onChange={e => setFormData(prev => ({ ...prev, ai_relevance_score: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Viral Score */}
              <div className="space-y-2 bg-zinc-800/40 p-4 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-400">Potencial Viral</span>
                  <span className="font-mono text-pink-400 font-bold">{formData.ai_viral_potential_score}/100</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.ai_viral_potential_score}
                  onChange={e => setFormData(prev => ({ ...prev, ai_viral_potential_score: parseInt(e.target.value) }))}
                  className="w-full accent-pink-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Regional Score */}
              <div className="space-y-2 bg-zinc-800/40 p-4 rounded-2xl border border-zinc-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-400">Impacto Regional</span>
                  <span className="font-mono text-emerald-400 font-bold">{formData.ai_regional_impact_score}/100</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.ai_regional_impact_score}
                  onChange={e => setFormData(prev => ({ ...prev, ai_regional_impact_score: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* AI Summary */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resumo da IA (Geração Automática)</label>
                <textarea
                  value={formData.ai_summary}
                  onChange={e => setFormData(prev => ({ ...prev, ai_summary: e.target.value }))}
                  className="w-full bg-zinc-800/50 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-indigo-900 outline-none transition-all min-h-[60px]"
                  placeholder="Aguardando geração com IA..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SEO Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Título Otimizado SEO</label>
                  <input
                    type="text"
                    value={formData.ai_seo_title}
                    onChange={e => setFormData(prev => ({ ...prev, ai_seo_title: e.target.value }))}
                    className="w-full bg-zinc-800/50 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-indigo-900 outline-none transition-all"
                    placeholder="Aguardando geração com IA..."
                  />
                </div>

                {/* SEO Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Meta Description SEO</label>
                  <input
                    type="text"
                    value={formData.ai_seo_description}
                    onChange={e => setFormData(prev => ({ ...prev, ai_seo_description: e.target.value }))}
                    className="w-full bg-zinc-800/50 border border-zinc-800 focus:border-indigo-500 rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-indigo-900 outline-none transition-all"
                    placeholder="Aguardando geração com IA..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 space-y-6 shadow-sm">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Status de Publicação</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all text-zinc-800"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            {/* City (Multi-City Tenancy) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Cidade (Hub / Regional)</label>
              <select
                value={formData.city_slug}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all text-zinc-800"
              >
                {CITIES.map(c => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Breaking News Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Sinalizar Plantão</label>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 rounded-xl transition-all">
                <input
                  type="checkbox"
                  checked={formData.is_breaking}
                  onChange={e => setFormData(prev => ({ ...prev, is_breaking: e.target.checked }))}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-zinc-300"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800">BREAKING NEWS / URGENTE</span>
                  <span className="text-[10px] text-zinc-400">Exibir com tarja de Plantão Nacional</span>
                </div>
              </label>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Categoria</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all text-zinc-800"
              >
                {CATEGORY_SUGGESTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="pt-1.5">
                <input
                  type="text"
                  placeholder="Ou digite outra categoria..."
                  value={CATEGORY_SUGGESTIONS.includes(formData.category) ? '' : formData.category}
                  onChange={e => e.target.value && setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-lg py-1.5 px-3 text-xs outline-none focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">URL da Imagem de Capa</label>
              <input
                type="url"
                value={formData.cover_image}
                onChange={e => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all text-zinc-800"
                placeholder="https://images.unsplash.com/..."
              />
              {formData.cover_image && (
                <div className="mt-3 aspect-[16/9] rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <img src={formData.cover_image} alt="Pré-visualização" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs shadow-md shadow-zinc-100"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Notícia</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
