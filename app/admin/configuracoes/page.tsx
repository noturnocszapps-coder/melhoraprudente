'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Globe, Mail, Image as ImageIcon } from 'lucide-react';
import { Settings } from '@/types';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data || {
        id: '',
        site_name: 'Melhora Prudente',
        primary_color: '#dc2626',
        secondary_color: '#18181b',
        logo_url: null,
        favicon_url: null,
        whatsapp: null,
        instagram: null,
        facebook: null,
        adsense_code: null
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert(settings);

      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={32} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando configurações...</p>
    </div>
  );

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings(prev => prev ? ({ ...prev, [key]: value }) : null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Settings */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <Globe size={18} className="text-red-600" /> Geral
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nome do Site</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={e => updateSetting('site_name', e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Google Adsense Code</label>
              <textarea
                value={settings.adsense_code || ''}
                onChange={e => updateSetting('adsense_code', e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all min-h-[100px]"
                placeholder="Insira o código do Adsense aqui..."
              />
            </div>
          </div>

          {/* Contact Settings */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <Mail size={18} className="text-red-600" /> Contato
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">WhatsApp</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={e => updateSetting('whatsapp', e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Instagram</label>
              <input
                type="text"
                value={settings.instagram || ''}
                onChange={e => updateSetting('instagram', e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Facebook</label>
              <input
                type="text"
                value={settings.facebook || ''}
                onChange={e => updateSetting('facebook', e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 space-y-6 md:col-span-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-red-600" /> Aparência
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL do Logo</label>
                <input
                  type="url"
                  value={settings.logo_url || ''}
                  onChange={e => updateSetting('logo_url', e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL do Favicon</label>
                <input
                  type="url"
                  value={settings.favicon_url || ''}
                  onChange={e => updateSetting('favicon_url', e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Cor Primária</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={settings.primary_color || '#dc2626'}
                    onChange={e => updateSetting('primary_color', e.target.value)}
                    className="h-11 w-20 bg-zinc-50 border-none rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color || '#dc2626'}
                    onChange={e => updateSetting('primary_color', e.target.value)}
                    className="flex-1 bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Cor Secundária</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={settings.secondary_color || '#18181b'}
                    onChange={e => updateSetting('secondary_color', e.target.value)}
                    className="h-11 w-20 bg-zinc-50 border-none rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color || '#18181b'}
                    onChange={e => updateSetting('secondary_color', e.target.value)}
                    className="flex-1 bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-12 py-4 rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Salvar Alterações</>}
          </button>
        </div>
      </form>
    </div>
  );
}
