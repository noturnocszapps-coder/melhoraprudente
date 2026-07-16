'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
import { 
  Loader2, 
  Save, 
  Globe, 
  Mail, 
  Image as ImageIcon, 
  Share2, 
  Search, 
  Sparkles, 
  Shield, 
  FileText, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Settings } from '@/types';
import { cn } from '@/lib/utils';

interface ExtendedCMSData {
  email: string;
  telephone: string;
  address: string;
  copyright_text: string;
  twitter: string;
  youtube: string;
  meta_description: string;
  meta_keywords: string;
  google_analytics_id: string;
  adsense_publisher_id: string;
  adsense_client_id: string;
  ads_txt_content: string;
  about_us: string;
  privacy_policy: string;
  terms_of_use: string;
}

const DEFAULT_EXTENDED_DATA: ExtendedCMSData = {
  email: 'contato@melhoraprudente.com.br',
  telephone: '(18) 3221-0000',
  address: 'Presidente Prudente - SP',
  copyright_text: '© 2026 Melhora Prudente. Todos os direitos reservados.',
  twitter: '',
  youtube: '',
  meta_description: 'O seu portal de notícias local. Informação com credibilidade, agilidade e foco total em Presidente Prudente e região.',
  meta_keywords: 'noticias, presidente prudente, oeste paulista, regional, jornal',
  google_analytics_id: '',
  adsense_publisher_id: 'pub-0000000000000000',
  adsense_client_id: 'ca-pub-0000000000000000',
  ads_txt_content: 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0',
  about_us: '',
  privacy_policy: '',
  terms_of_use: '',
};

type TabType = 'geral' | 'identidade' | 'contato' | 'seo' | 'adsense' | 'paginas';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('geral');
  
  // Settings values mapping directly to Database Columns
  const [siteName, setSiteName] = useState('Melhora Prudente');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('(18) 3221-0000');
  const [instagram, setInstagram] = useState('https://instagram.com');
  const [facebook, setFacebook] = useState('https://facebook.com');
  const [primaryColor, setPrimaryColor] = useState('#dc2626');
  const [secondaryColor, setSecondaryColor] = useState('#18181b');
  const [dbId, setDbId] = useState<string>('');

  // Extended fields serialized inside adsense_code JSON
  const [extendedData, setExtendedData] = useState<ExtendedCMSData>(DEFAULT_EXTENDED_DATA);

  // Pages state for dynamic CMS
  const [selectedPageSlug, setSelectedPageSlug] = useState('sobre-nos');
  const [pageTitle, setPageTitle] = useState('Quem Somos (Sobre Nós)');
  const [pageContent, setPageContent] = useState('');
  const [pageLoading, setPageLoading] = useState(false);
  const [pageSaving, setPageSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchPageContent(selectedPageSlug);
  }, [selectedPageSlug]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setDbId(data.id || '');
        setSiteName(data.site_name || 'Melhora Prudente');
        setLogoUrl(data.logo_url || null);
        setFaviconUrl(data.favicon_url || null);
        setWhatsapp(data.whatsapp || '');
        setInstagram(data.instagram || '');
        setFacebook(data.facebook || '');
        setPrimaryColor(data.primary_color || '#dc2626');
        setSecondaryColor(data.secondary_color || '#18181b');

        // Parse extended settings from adsense_code if serialized
        if (data.adsense_code && data.adsense_code.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.adsense_code);
            setExtendedData(prev => ({
              ...DEFAULT_EXTENDED_DATA,
              ...parsed
            }));
          } catch (e) {
            console.error('Error parsing extended settings JSON:', e);
          }
        } else if (data.adsense_code) {
          // If adsense_code has raw code/text, preserve it in the ads_txt_content or publisher field
          setExtendedData(prev => ({
            ...prev,
            ads_txt_content: data.adsense_code || prev.ads_txt_content,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageContent = async (slug: string) => {
    setPageLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPageTitle(data.title || '');
          setPageContent(data.content || '');
          setPageLoading(false);
          return;
        }
      }

      // Fallback to local
      const localPages = getStoredData<any[]>('mp_fallback_pages', []);
      const found = localPages.find(p => p.slug === slug);
      if (found) {
        setPageTitle(found.title);
        setPageContent(found.content);
      } else {
        const defaults: Record<string, {title: string, content: string}> = {
          'sobre-nos': { 
            title: 'Quem Somos (Sobre Nós)', 
            content: 'Fundado em 2024, o Melhora Prudente foi criado por um grupo de jornalistas independentes com um propósito claro: descentralizar a informação e dar voz ativa aos moradores de Presidente Prudente e de todas as cidades que compõem o Oeste Paulista.' 
          },
          'politica-privacidade': { 
            title: 'Política de Privacidade & LGPD', 
            content: 'Nossa política de privacidade descreve como coletamos e usamos dados sob a égide da LGPD.' 
          },
          'termos-de-uso': { 
            title: 'Termos de Uso', 
            content: 'Termos e regras de uso do portal Melhora Prudente.' 
          },
          'contato': { 
            title: 'Contato', 
            content: 'Entre em contato com nossa redação pelo e-mail contato@melhoraprudente.com.br ou pelo WhatsApp (18) 3221-0000.' 
          },
          'principios-editoriais': { 
            title: 'Princípios Editoriais', 
            content: 'Nossos princípios editoriais são fundamentados no jornalismo ético, apartidário, transparente e independente.' 
          },
          'correcoes': { 
            title: 'Correções', 
            content: 'Compromisso com a verdade. Se você encontrar algum erro em nossas reportagens, entre em contato.' 
          },
          'anuncie': { 
            title: 'Anuncie Conosco', 
            content: 'Veja os formatos e tamanhos disponíveis para divulgar sua empresa no portal Melhora Prudente.' 
          },
        };
        const def = defaults[slug] || { title: slug, content: '' };
        setPageTitle(def.title);
        setPageContent(def.content);
      }
    } catch (e) {
      console.error('Error fetching page content:', e);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSavePage = async () => {
    setPageSaving(true);
    try {
      const payload = {
        title: pageTitle,
        slug: selectedPageSlug,
        content: pageContent,
        updated_at: new Date().toISOString()
      };

      if (isSupabaseConfigured) {
        const { data: existingPage } = await supabase
          .from('pages')
          .select('id')
          .eq('slug', selectedPageSlug)
          .maybeSingle();

        let error;
        if (existingPage?.id) {
          const { error: updateError } = await supabase
            .from('pages')
            .update({ title: pageTitle, content: pageContent, updated_at: new Date().toISOString() })
            .eq('id', existingPage.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('pages')
            .insert([payload]);
          error = insertError;
        }

        if (error) throw error;
      }

      // Always save to fallback
      const localPages = getStoredData<any[]>('mp_fallback_pages', []);
      const idx = localPages.findIndex(p => p.slug === selectedPageSlug);
      if (idx !== -1) {
        localPages[idx] = { ...localPages[idx], title: pageTitle, content: pageContent, updated_at: new Date().toISOString() };
      } else {
        localPages.push({ id: `page-${Date.now()}`, ...payload, created_at: new Date().toISOString() });
      }
      setStoredData('mp_fallback_pages', localPages);

      alert(`Página "${pageTitle}" salva com sucesso!`);
    } catch (error: any) {
      console.error('Error saving page:', error);
      alert('Erro ao salvar página: ' + (error.message || error));
    } finally {
      setPageSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Serialize all extended fields into the adsense_code field to respect database constraints without altering schemas
      const serializedExtended = JSON.stringify(extendedData);

      const payload = {
        site_name: siteName,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        whatsapp: whatsapp,
        instagram: instagram,
        facebook: facebook,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        adsense_code: serializedExtended,
      };

      let error;
      if (dbId) {
        const { error: updateError } = await supabase
          .from('settings')
          .update(payload)
          .eq('id', dbId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('settings')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      alert('Configurações do CMS salvas com sucesso!');
      await fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar as configurações: ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  const updateExtended = (key: keyof ExtendedCMSData, value: string) => {
    setExtendedData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-red-600" size={36} />
      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Carregando CMS Institucional...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-zinc-950 flex items-center gap-3">
            <Globe className="text-red-600" size={28} /> CMS Institucional
          </h1>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
            Gerencie, edite e acompanhe todas as páginas, SEO, anúncios e identidades do portal.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Tudo</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl overflow-x-auto gap-1 scrollbar-none">
        {[
          { id: 'geral', label: 'Geral', icon: Globe },
          { id: 'identidade', label: 'Identidade', icon: ImageIcon },
          { id: 'contato', label: 'Contato & Redes', icon: Mail },
          { id: 'seo', label: 'SEO & Analytics', icon: Search },
          { id: 'adsense', label: 'AdSense', icon: Sparkles },
          { id: 'paginas', label: 'Páginas do Site', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
              activeTab === tab.id 
                ? "bg-white text-red-600 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms Area */}
      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* TAB: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Configurações Gerais</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Defina os parâmetros centrais e corporativos do seu portal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Nome do Portal</label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={e => setSiteName(e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">E-mail Administrativo</label>
                  <input
                    type="email"
                    value={extendedData.email}
                    onChange={e => updateExtended('email', e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Telefone Fixo</label>
                  <input
                    type="text"
                    value={extendedData.telephone}
                    onChange={e => updateExtended('telephone', e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Endereço Físico</label>
                  <input
                    type="text"
                    value={extendedData.address}
                    onChange={e => updateExtended('address', e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex justify-between">
                    <span>Copyright do Rodapé</span>
                    <span className="text-[10px] text-zinc-400">NT Aplicações mantida por padrão</span>
                  </label>
                  <input
                    type="text"
                    value={extendedData.copyright_text}
                    onChange={e => updateExtended('copyright_text', e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: IDENTIDADE */}
          {activeTab === 'identidade' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Identidade Visual & Logos</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Controle as cores primárias, secundárias, logotipo e ícone do site.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL do Logotipo</label>
                  <input
                    type="url"
                    value={logoUrl || ''}
                    onChange={e => setLogoUrl(e.target.value || null)}
                    placeholder="https://exemplo.com/logo.png"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL do Favicon</label>
                  <input
                    type="url"
                    value={faviconUrl || ''}
                    onChange={e => setFaviconUrl(e.target.value || null)}
                    placeholder="https://exemplo.com/favicon.ico"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Cor Primária (Padrão: Vermelho)</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="h-11 w-16 bg-zinc-50 border-none rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="flex-1 bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Cor Secundária (Padrão: Zinc)</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="h-11 w-16 bg-zinc-50 border-none rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="flex-1 bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTATO */}
          {activeTab === 'contato' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Contato & Redes Sociais</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Conecte seus canais de atendimento e links sociais oficiais.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">WhatsApp / Celular de Atendimento</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="(18) 99999-9999"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Link do Instagram</label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/melhoraprudente"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Link do Facebook</label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={e => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/melhoraprudente"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Link do Twitter / X</label>
                  <input
                    type="url"
                    value={extendedData.twitter}
                    onChange={e => updateExtended('twitter', e.target.value)}
                    placeholder="https://x.com/melhoraprudente"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Canal do YouTube</label>
                  <input
                    type="url"
                    value={extendedData.youtube}
                    onChange={e => updateExtended('youtube', e.target.value)}
                    placeholder="https://youtube.com/c/melhoraprudente"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">SEO & Google Analytics</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Melhore o posicionamento orgânico e o rastreamento do portal.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Meta Description (Padrão)</label>
                  <textarea
                    value={extendedData.meta_description}
                    onChange={e => updateExtended('meta_description', e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Meta Keywords (Palavras-Chave separadas por vírgula)</label>
                  <input
                    type="text"
                    value={extendedData.meta_keywords}
                    onChange={e => updateExtended('meta_keywords', e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Google Analytics Measurement ID</label>
                  <input
                    type="text"
                    value={extendedData.google_analytics_id}
                    onChange={e => updateExtended('google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: ADSENSE */}
          {activeTab === 'adsense' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Monetização do Google AdSense</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Configure suas tags, IDs de publicidade e configure o arquivo de validação ads.txt.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Publisher ID (ID do Editor)</label>
                  <input
                    type="text"
                    required
                    value={extendedData.adsense_publisher_id}
                    onChange={e => updateExtended('adsense_publisher_id', e.target.value)}
                    placeholder="pub-xxxxxxxxxxxxxxxx"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Client ID (ID do Cliente)</label>
                  <input
                    type="text"
                    required
                    value={extendedData.adsense_client_id}
                    onChange={e => updateExtended('adsense_client_id', e.target.value)}
                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Configuração de ads.txt</label>
                    <a 
                      href="/ads.txt" 
                      target="_blank" 
                      className="text-[10px] font-black uppercase tracking-wider text-red-600 hover:underline flex items-center gap-1"
                    >
                      Ver ads.txt ativo <ExternalLink size={10} />
                    </a>
                  </div>
                  <textarea
                    value={extendedData.ads_txt_content}
                    onChange={e => updateExtended('ads_txt_content', e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-mono"
                    placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAGINAS */}
          {activeTab === 'paginas' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Páginas Institucionais (CMS)</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Gerencie e edite as páginas estáticas e os princípios editoriais do portal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Pages selection sidebar */}
                <div className="md:col-span-1 space-y-1 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-100 h-fit">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 py-1.5 border-b border-zinc-200/60 mb-2">Páginas Disponíveis</div>
                  {[
                    { slug: 'sobre-nos', title: 'Quem Somos (Sobre Nós)' },
                    { slug: 'politica-privacidade', title: 'Política de Privacidade' },
                    { slug: 'termos-de-uso', title: 'Termos de Uso' },
                    { slug: 'contato', title: 'Contato' },
                    { slug: 'principios-editoriais', title: 'Princípios Editoriais' },
                    { slug: 'correcoes', title: 'Correções' },
                    { slug: 'anuncie', title: 'Anuncie Conosco' },
                  ].map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => setSelectedPageSlug(p.slug)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all truncate",
                        selectedPageSlug === p.slug
                          ? "bg-red-50 text-red-600 shadow-sm"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                      )}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>

                {/* Editor Area */}
                <div className="md:col-span-3 space-y-4">
                  {pageLoading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-red-600" size={24} />
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Carregando conteúdo da página...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Título da Página</label>
                        <input
                          type="text"
                          value={pageTitle}
                          onChange={(e) => setPageTitle(e.target.value)}
                          className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Identificador (Slug)</label>
                        <input
                          type="text"
                          disabled
                          value={selectedPageSlug}
                          className="w-full bg-zinc-100 border-none rounded-xl py-3 px-4 text-sm text-zinc-500 font-mono select-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Conteúdo (HTML / Markdown / Texto Plano)</label>
                        <textarea
                          value={pageContent}
                          onChange={(e) => setPageContent(e.target.value)}
                          rows={12}
                          className="w-full bg-zinc-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-600 transition-all font-sans leading-relaxed"
                          placeholder="Escreva o conteúdo da página aqui..."
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSavePage}
                          disabled={pageSaving}
                          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 text-[11px]"
                        >
                          {pageSaving ? <Loader2 className="animate-spin" size={12} /> : <><Save size={12} /> Salvar Conteúdo da Página</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {activeTab !== 'paginas' && (
            <div className="flex justify-end pt-6 border-t border-zinc-100">
              <button
                type="submit"
                disabled={saving}
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-12 py-4 rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50 text-xs"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Alterações</>}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
