'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Edit, Save, ExternalLink, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Ad } from '@/types';
import { useAdminCache } from '../context/AdminCacheContext';

const SLOT_SIZES: Record<string, string> = {
  home_top: '728x90px',
  home_middle: '728x90px',
  home_sidebar: '300x250px',
  home_footer: '728x90px',
  sidebar_news_detail: '300x250px',
  sidebar_news_detail_bottom: '300x250px',
  article_inline: '300x250px ou 728x90px',
  category_top: '728x90px',
  category_footer: '728x90px',
  archive_top: '728x90px',
  archive_footer: '728x90px',
};

export default function AdminAds() {
  const { ads, adsLoading: loading, refreshAds } = useAdminCache();
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    target_url: '',
    slot: 'home_top',
    is_active: true,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  // URL valid states and image error states
  const [formImageError, setFormImageError] = useState(false);
  const [brokenAdIds, setBrokenAdIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    refreshAds();
  }, []);

  // Reset form image error when image URL changes
  useEffect(() => {
    setFormImageError(false);
  }, [formData.image_url]);

  const fetchAds = async () => {
    try {
      await refreshAds();
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate well-formed URLs
    if (!isValidUrl(formData.image_url)) {
      alert('Por favor, insira uma URL de imagem válida (ex: https://dominio.com/imagem.png).');
      return;
    }
    if (!isValidUrl(formData.target_url)) {
      alert('Por favor, insira uma URL de destino válida (ex: https://site-cliente.com).');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('ads')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Anúncio atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('ads')
          .insert(formData);
        if (error) throw error;
        alert('Anúncio criado com sucesso!');
      }
      
      setFormData({
        name: '',
        image_url: '',
        target_url: '',
        slot: 'home_top',
        is_active: true,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      setEditingId(null);
      fetchAds();
    } catch (error: any) {
      console.error('Error saving ad:', error);
      alert('Erro ao salvar anúncio: ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setFormData({
      name: ad.name,
      image_url: ad.image_url,
      target_url: ad.target_url,
      slot: ad.slot,
      is_active: ad.is_active,
      starts_at: ad.starts_at,
      ends_at: ad.ends_at
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este anúncio?')) return;
    try {
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) throw error;
      fetchAds();
      alert('Anúncio excluído!');
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      alert('Erro ao excluir anúncio: ' + (error.message || error));
    }
  };

  if (loading && ads.length === 0) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando anúncios...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">
          {editingId ? 'Editar Anúncio' : 'Novo Anúncio'}
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título / Cliente</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Supermercado Prudente Banner Natal"
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Posição (Slot)</label>
            <select
              value={formData.slot}
              onChange={e => setFormData(prev => ({ ...prev, slot: e.target.value }))}
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all outline-none"
            >
              <option value="home_top">Home Topo</option>
              <option value="home_middle">Home Meio</option>
              <option value="home_sidebar">Home Lateral</option>
              <option value="home_footer">Home Rodapé</option>
              <option value="sidebar_news_detail">Notícia Lateral Superior</option>
              <option value="sidebar_news_detail_bottom">Notícia Lateral Inferior</option>
              <option value="article_inline">Notícia Interno (Inline)</option>
              <option value="category_top">Categoria Topo</option>
              <option value="category_footer">Categoria Rodapé</option>
              <option value="archive_top">Notícias Geral Topo</option>
              <option value="archive_footer">Notícias Geral Rodapé</option>
            </select>
            {/* Recommendation Tagline (Requirement 9) */}
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-1 pl-1">
              Dimensão recomendada: <span className="text-red-600">{SLOT_SIZES[formData.slot] || '728x90px'}</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL da Imagem</label>
            <input
              type="url"
              required
              value={formData.image_url}
              onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://sua-url-de-imagem.com/banner.png"
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all outline-none"
            />
            {formData.image_url && !isValidUrl(formData.image_url) && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                <AlertCircle size={12} /> URL malformada. Certifique-se de que começa com http:// ou https://
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL de Destino</label>
            <input
              type="url"
              required
              value={formData.target_url}
              onChange={e => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
              placeholder="https://site-do-cliente.com"
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all outline-none"
            />
          </div>

          {/* SUTLE FORM IMAGE PREVIEW WITH FALLBACK (Requirement 7 & 10) */}
          {formData.image_url && isValidUrl(formData.image_url) && (
            <div className="md:col-span-2 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visualização do Banner</span>
              <div className="aspect-video max-h-48 border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50 flex items-center justify-center relative">
                {!formImageError ? (
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    onError={() => setFormImageError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <AlertCircle size={24} className="text-zinc-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Imagem Indisponível (URL inválida ou inacessível)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end md:col-span-2 gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    image_url: '',
                    target_url: '',
                    slot: 'home_top',
                    is_active: true,
                    starts_at: new Date().toISOString(),
                    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                  });
                }}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold px-6 py-3 rounded-xl transition-all text-xs h-12 flex items-center justify-center"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs h-12"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {editingId ? 'Atualizar' : 'Criar Anúncio'}</>}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 pl-1">
          Anúncios Cadastrados ({ads.length})
        </h3>
        
        {ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ads.map(ad => (
              <div key={ad.id} className="bg-white p-5 rounded-3xl border border-zinc-200 group hover:border-red-200 transition-all space-y-4 flex flex-col justify-between shadow-sm min-w-0">
                <div className="space-y-4">
                  {/* PREVIEW CONTAINER WITH ERRO ON LOAD FALLBACK (Requirement 10) */}
                  <div className="aspect-video bg-zinc-50 rounded-2xl overflow-hidden relative border border-zinc-100 flex items-center justify-center">
                    {!brokenAdIds[ad.id] ? (
                      <img 
                        src={ad.image_url} 
                        alt={ad.name} 
                        onError={() => setBrokenAdIds(prev => ({ ...prev, [ad.id]: true }))}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-zinc-400 p-4 text-center">
                        <AlertCircle size={24} className="text-zinc-300" />
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Imagem Indisponível</span>
                        <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[200px]" title={ad.image_url}>
                          {ad.image_url}
                        </span>
                      </div>
                    )}
                    
                    {/* Floating Controls with 44px capability */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        onClick={() => handleEdit(ad)}
                        title="Editar anúncio"
                        className="p-2.5 bg-white/95 backdrop-blur shadow-sm rounded-xl text-zinc-600 hover:text-blue-600 transition-all min-w-10 min-h-10 flex items-center justify-center"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(ad.id)}
                        title="Excluir anúncio"
                        className="p-2.5 bg-white/95 backdrop-blur shadow-sm rounded-xl text-zinc-600 hover:text-red-600 transition-all min-w-10 min-h-10 flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 break-words">
                      <h4 className="font-extrabold text-sm text-zinc-900 break-words leading-snug">{ad.name}</h4>
                      
                      {/* Slot metadata */}
                      <p className="text-[9px] text-red-600 font-black uppercase tracking-widest mt-1">
                        Posição: {ad.slot} ({SLOT_SIZES[ad.slot] || '728x90px'})
                      </p>
                    </div>
                    <a 
                      href={ad.target_url} 
                      target="_blank" 
                      title="Testar URL de destino"
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors min-w-10 min-h-10 flex items-center justify-center"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl py-12 text-center text-zinc-400 italic text-xs uppercase font-bold">
            Nenhum anúncio cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
