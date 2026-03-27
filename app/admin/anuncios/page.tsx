'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Edit, Save, ExternalLink } from 'lucide-react';
import { Ad } from '@/types';
import { adService } from '@/services';

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    target_url: '',
    slot: 'sidebar_top',
    is_active: true,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('ads')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ads')
          .insert(formData);
        if (error) throw error;
      }
      
      setFormData({
        name: '',
        image_url: '',
        target_url: '',
        slot: 'sidebar_top',
        is_active: true,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      setEditingId(null);
      fetchAds();
    } catch (error) {
      console.error('Error saving ad:', error);
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
    // In a real app, use a custom modal
    if (!window.confirm('Excluir este anúncio?')) return;
    try {
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) throw error;
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando anúncios...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Form */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-100 space-y-6">
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
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Posição</label>
            <select
              value={formData.slot}
              onChange={e => setFormData(prev => ({ ...prev, slot: e.target.value }))}
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
            >
              <option value="sidebar_top">Lateral Superior</option>
              <option value="sidebar_middle">Lateral Meio</option>
              <option value="sidebar_news_detail">Lateral Detalhe Notícia</option>
              <option value="home_footer">Home Rodapé</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL da Imagem</label>
            <input
              type="url"
              required
              value={formData.image_url}
              onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL de Destino</label>
            <input
              type="url"
              required
              value={formData.target_url}
              onChange={e => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
              className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
            />
          </div>
          <div className="flex justify-end md:col-span-2 gap-3">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    image_url: '',
                    target_url: '',
                    slot: 'sidebar_top',
                    is_active: true,
                    starts_at: new Date().toISOString(),
                    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                  });
                }}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold px-6 py-3 rounded-xl transition-all text-xs"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 text-xs"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> {editingId ? 'Atualizar' : 'Criar'}</>}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map(ad => (
          <div key={ad.id} className="bg-white p-6 rounded-3xl border border-zinc-100 group hover:border-red-100 transition-all space-y-4">
            <div className="aspect-video bg-zinc-50 rounded-2xl overflow-hidden relative">
              <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => handleEdit(ad)}
                  className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-zinc-600 hover:text-blue-600 transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-zinc-600 hover:text-red-600 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-zinc-900">{ad.name}</h4>
                <p className="text-xs text-zinc-400 font-black uppercase tracking-widest">{ad.slot}</p>
              </div>
              <a href={ad.target_url} target="_blank" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
