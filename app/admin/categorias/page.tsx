'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { useAdminCache } from '../context/AdminCacheContext';

export default function AdminCategories() {
  const { categories, categoriesLoading: loading, refreshCategories } = useAdminCache();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      await refreshCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const slug = formData.slug || formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update({ ...formData, slug })
        .eq('id', editingCategory.id);
      if (error) console.error('Erro ao atualizar categoria:', error);
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{ ...formData, slug }]);
      if (error) console.error('Erro ao criar categoria:', error);
    }

    setSaving(false);
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    // In a real app, use a custom modal
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Erro ao excluir categoria. Verifique se existem notícias vinculadas:', error);
    else fetchCategories();
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tighter uppercase">Categorias</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '' });
            setIsModalOpen(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-red-600" size={32} />
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando categorias...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
          
          {/* DESKTOP VIEW: TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900">{category.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">{category.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-600 line-clamp-1">{category.description || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            title="Editar Categoria"
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all min-w-10 min-h-10 flex items-center justify-center"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            title="Excluir Categoria"
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all min-w-10 min-h-10 flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                      Nenhuma categoria cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW: CARDS */}
          <div className="block md:hidden p-4 space-y-4">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div 
                  key={category.id} 
                  className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col gap-3 transition-colors hover:border-zinc-300 min-w-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-zinc-900 break-words">
                      {category.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-150">
                      {category.slug}
                    </span>
                  </div>

                  {category.description ? (
                    <p className="text-xs text-zinc-500 leading-relaxed break-words">
                      {category.description}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic font-medium">
                      Sem descrição cadastrada
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex-1 max-w-[120px] h-10 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-700 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="flex-1 max-w-[120px] h-10 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-400 italic text-xs uppercase font-bold">
                Nenhuma categoria cadastrada.
              </div>
            )}
          </div>

        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl">
            <h2 className="text-xl font-black tracking-tighter uppercase">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="Ex: Política"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug (Opcional)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                  placeholder="ex-politica"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 outline-none h-24 resize-none"
                  placeholder="Breve descrição da categoria..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
