'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, X, Image as ImageIcon, Type, AlignLeft, Globe } from 'lucide-react';
import { Category, Post } from '@/types';
import { categoryService, newsService } from '@/services';

export default function EditPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    cover_image_url: '',
    category_id: '',
    status: 'draft',
    is_featured: false,
    is_breaking: false,
    seo_title: '',
    seo_description: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [cats, post] = await Promise.all([
          categoryService.getAll(),
          supabase.from('posts').select('*').eq('id', id).single()
        ]);
        
        setCategories(cats);
        if (post.data) {
          const { id: _, author_id: __, created_at: ___, updated_at: ____, published_at: _____, ...rest } = post.data;
          setFormData(rest);
        }
      } catch (error) {
        console.error('Error initializing edit page:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
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
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          ...formData,
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      router.push('/admin/noticias');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Erro ao atualizar notícia.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando dados da notícia...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título da Notícia</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-xl font-bold focus:ring-2 focus:ring-red-600 transition-all"
                  placeholder="Ex: Obras no centro avançam..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Subtítulo / Gravata</label>
                <textarea
                  value={formData.subtitle || ''}
                  onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-red-600 transition-all min-h-[100px]"
                  placeholder="Um breve resumo que aparece abaixo do título..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Conteúdo (HTML)</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-sm font-mono focus:ring-2 focus:ring-red-600 transition-all min-h-[400px]"
                  placeholder="<p>Escreva sua notícia aqui...</p>"
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                >
                  <option value="draft">Rascunho</option>
                  <option value="review">Em Revisão</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Categoria</label>
                <select
                  required
                  value={formData.category_id || ''}
                  onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                >
                  <option value="">Selecionar Categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL da Imagem de Capa</label>
                <input
                  type="url"
                  value={formData.cover_image_url || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={e => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-5 h-5 rounded border-zinc-200 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Notícia em Destaque</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_breaking}
                    onChange={e => setFormData(prev => ({ ...prev, is_breaking: e.target.checked }))}
                    className="w-5 h-5 rounded border-zinc-200 text-red-600 focus:ring-red-600"
                  />
                  <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">Urgente / Plantão</span>
                </label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">SEO</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Título SEO</label>
                <input
                  type="text"
                  value={formData.seo_title || ''}
                  onChange={e => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                  className="w-full bg-zinc-50 border-none rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-red-600 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Descrição SEO</label>
                <textarea
                  value={formData.seo_description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                  className="w-full bg-zinc-50 border-none rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-red-600 transition-all min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-4 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Atualizar</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
