'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Mail, Phone } from 'lucide-react';
import { settingsService } from '@/services';
import { Settings } from '@/types';

const DEFAULT_FALLBACK_SETTINGS: Settings = {
  id: '',
  site_name: 'Melhora Prudente',
  logo_url: null,
  favicon_url: null,
  whatsapp: '(18) 3221-0000',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  adsense_code: null,
  primary_color: '#dc2626',
  secondary_color: '#18181b'
};

const formatBrazilianPhone = (phone: string | null): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return phone.trim();
  
  let cleaned = digits;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    cleaned = digits.slice(2);
  }
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
};

const getWhatsAppLink = (phone: string | null): string => {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}`;
};

export const Footer = () => {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Settings>(DEFAULT_FALLBACK_SETTINGS);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data && active) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching settings in Footer:', err);
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const rawWhatsapp = settings.whatsapp;
  const formattedPhone = rawWhatsapp ? formatBrazilianPhone(rawWhatsapp) : '';
  const whatsappLink = rawWhatsapp ? getWhatsAppLink(rawWhatsapp) : '';

  const hasFacebook = !!settings.facebook && settings.facebook.trim() !== '' && settings.facebook !== '#';
  const hasInstagram = !!settings.instagram && settings.instagram.trim() !== '' && settings.instagram !== '#';

  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-10 pb-8 lg:pt-20 lg:pb-10 border-t border-zinc-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-10 lg:mb-20">
          {/* Brand & About */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-6">
            <Link href="/" className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black tracking-tighter text-white leading-none break-words max-w-full">
                {settings.site_name.toUpperCase().includes('MELHORA') ? (
                  <>
                    MELHORA<span className="text-red-600">PRUDENTE</span>
                  </>
                ) : (
                  settings.site_name
                )}
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs break-words">
              O seu portal de notícias local. Informação com credibilidade, agilidade e foco total em Presidente Prudente e região.
            </p>
            
            {(hasFacebook || hasInstagram) && (
              <div className="flex items-center gap-4">
                {hasFacebook && (
                  <a 
                    href={settings.facebook!} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"
                    aria-label="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {hasInstagram && (
                  <a 
                    href={settings.instagram!} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black mb-4 lg:mb-8 uppercase tracking-[0.2em] text-[10px]">Editorias</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 lg:flex lg:flex-col lg:space-y-4 text-xs font-bold uppercase tracking-widest">
              <li><Link href="/categoria/politica" className="hover:text-red-600 transition-colors">Política</Link></li>
              <li><Link href="/categoria/economia" className="hover:text-red-600 transition-colors">Economia</Link></li>
              <li><Link href="/categoria/esportes" className="hover:text-red-600 transition-colors">Esportes</Link></li>
              <li><Link href="/categoria/cultura" className="hover:text-red-600 transition-colors">Cultura</Link></li>
              <li><Link href="/categoria/policia" className="hover:text-red-600 transition-colors">Polícia</Link></li>
              <li><Link href="/categoria/cidade" className="hover:text-red-600 transition-colors">Cidade</Link></li>
            </ul>
          </div>

          {/* Institutional */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black mb-4 lg:mb-8 uppercase tracking-[0.2em] text-[10px]">Institucional</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 lg:flex lg:flex-col lg:space-y-4 text-xs font-bold uppercase tracking-widest">
              <li><Link href="/sobre" className="hover:text-red-600 transition-colors">Sobre Nós</Link></li>
              <li><Link href="/contato" className="hover:text-red-600 transition-colors">Contato</Link></li>
              <li><Link href="/principios" className="hover:text-red-600 transition-colors">Princípios Editoriais</Link></li>
              <li><Link href="/privacidade" className="hover:text-red-600 transition-colors">Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-red-600 transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-6">
            <h4 className="text-white font-black mb-4 lg:mb-8 uppercase tracking-[0.2em] text-[10px]">Fale Conosco</h4>
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">E-mail</p>
                  <a href="mailto:contato@melhoraprudente.com.br" className="text-sm text-white font-bold hover:text-red-600 transition-colors break-all">
                    contato@melhoraprudente.com.br
                  </a>
                </div>
              </div>
              
              {formattedPhone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Telefone / WhatsApp</p>
                    <a 
                      href={whatsappLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-white font-bold hover:text-red-600 transition-colors break-words"
                    >
                      {formattedPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
          <div className="space-y-1 md:space-y-0 md:flex md:items-center md:gap-2">
            <span>© {new Date().getFullYear()} Melhora Prudente.</span>
            <span className="hidden md:inline">|</span>
            <span>Todos os direitos reservados.</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <span className="text-zinc-600">Presidente Prudente - SP</span>
            <span className="hidden sm:inline text-zinc-800">•</span>
            <a 
              href="https://www.ntaplicacoes.com.br" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-red-600 text-zinc-500 transition-colors"
            >
              Desenvolvido por NT Aplicações
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
