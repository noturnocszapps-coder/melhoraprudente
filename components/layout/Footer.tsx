'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white leading-none">
                MELHORA<span className="text-red-600">PRUDENTE</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              O seu portal de notícias local. Informação com credibilidade, agilidade e foco na nossa região.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube size={20} /></a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Categorias</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/categoria/politica" className="hover:text-white transition-colors">Política</Link></li>
              <li><Link href="/categoria/economia" className="hover:text-white transition-colors">Economia</Link></li>
              <li><Link href="/categoria/esportes" className="hover:text-white transition-colors">Esportes</Link></li>
              <li><Link href="/categoria/cultura" className="hover:text-white transition-colors">Cultura</Link></li>
              <li><Link href="/categoria/policia" className="hover:text-white transition-colors">Polícia</Link></li>
            </ul>
          </div>

          {/* Institutional */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Institucional</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre Nós</Link></li>
              <li><Link href="/contato" className="hover:text-white transition-colors">Contato</Link></li>
              <li><Link href="/anuncie" className="hover:text-white transition-colors">Anuncie</Link></li>
              <li><Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Fale Conosco</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-red-600" />
                <span>contato@melhoraprudente.com.br</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-red-600" />
                <span>(18) 99999-9999</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 text-center text-xs">
          <p>© {new Date().getFullYear()} Melhora Prudente. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
