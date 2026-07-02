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
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image: '',
    category: 'Geral',
    status: 'draft' as 'draft' | 'published'
  });

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
          author_id: user.id
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
            author: { full_name: 'Antônio Silva' }
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-zinc-100 rounded-xl transition-all text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Nova Notícia</h2>
          <p className="text-xs text-zinc-500">Escreva e publique uma nova matéria no portal.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título da Notícia</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-2xl py-4 px-6 text-lg font-bold focus:ring-2 focus:ring-red-100 outline-none transition-all"
                placeholder="Obras no centro avançam..."
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
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-2.5 px-4 text-xs font-mono focus:ring-2 focus:ring-red-100 outline-none transition-all"
                placeholder="link-da-noticia"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Linha de Apoio / Resumo</label>
              <textarea
                value={formData.excerpt}
                onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-2xl py-3 px-5 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all min-h-[80px]"
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
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all min-h-[300px]"
                placeholder="Escreva o texto completo da sua notícia aqui..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 space-y-6">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Status de Publicação</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Categoria</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all"
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
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all"
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
              className="flex-[2] bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Notícia</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
