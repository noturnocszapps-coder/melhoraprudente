'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          {/* Brand & About */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter text-white leading-none">
                MELHORA<span className="text-red-600">PRUDENTE</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              O seu portal de notícias local. Informação com credibilidade, agilidade e foco total em Presidente Prudente e região.
            </p>
            <div className="flex items-center gap-5">
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black mb-8 uppercase tracking-[0.2em] text-[10px]">Editorias</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
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
            <h4 className="text-white font-black mb-8 uppercase tracking-[0.2em] text-[10px]">Institucional</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <li><Link href="/sobre" className="hover:text-red-600 transition-colors">Sobre Nós</Link></li>
              <li><Link href="/contato" className="hover:text-red-600 transition-colors">Contato</Link></li>
              <li><Link href="/anuncie" className="hover:text-red-600 transition-colors">Anuncie</Link></li>
              <li><Link href="/privacidade" className="hover:text-red-600 transition-colors">Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-red-600 transition-colors">Termos</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="lg:col-span-4 space-y-8">
            <h4 className="text-white font-black mb-8 uppercase tracking-[0.2em] text-[10px]">Fale Conosco</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">E-mail</p>
                  <p className="text-sm text-white font-bold">contato@melhoraprudente.com.br</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Telefone</p>
                  <p className="text-sm text-white font-bold">(18) 99999-9999</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-[0.2em]">
          <p>© {new Date().getFullYear()} Melhora Prudente. Todos os direitos reservados.</p>
          <div className="flex items-center gap-8">
            <span className="text-zinc-600">Presidente Prudente - SP</span>
            <span className="text-zinc-600">Desenvolvido com ❤️</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
