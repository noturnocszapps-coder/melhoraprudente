'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  ShieldCheck,
  MapPin,
  Mail,
  Send,
  Heart,
  CheckCircle2,
} from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800 mt-16">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              INFORMATIVO DIÁRIO DE PRUDENTE
            </h3>
            <p className="text-xs text-slate-400">
              Receba o resumo matinal das notícias de Presidente Prudente diretamente no seu e-mail.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex items-center gap-2 w-full md:w-auto max-w-md"
          >
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/80 px-4 py-2.5 rounded-lg border border-emerald-800/60">
                <CheckCircle2 className="w-4 h-4" />
                <span>Inscrição realizada! Você receberá nosso resumo diário.</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  placeholder="Seu melhor e-mail..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 text-white text-xs px-4 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Inscrever</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white font-black">
              <Newspaper className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              MELHORA<span className="text-red-500">.</span>PRUDENTE
            </span>
          </Link>

          <p className="text-xs text-slate-400 leading-relaxed">
            Portal independente de informação, agregação inteligente e notícias jornalísticas de Presidente Prudente e região do Oeste Paulista.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span>Presidente Prudente — SP, Brasil</span>
          </div>
        </div>

        {/* Categories Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Editorias
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Cidade & Cotidiano
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Economia & Negócios
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Política & Gestão
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Inovação & Tecnologia
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Segurança Pública
              </Link>
            </li>
          </ul>
        </div>

        {/* Institutional Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Institucional
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/sobre" className="hover:text-white transition-colors">
                Sobre o Portal
              </Link>
            </li>
            <li>
              <Link href="/principios" className="hover:text-white transition-colors">
                Princípios Editoriais
              </Link>
            </li>
            <li>
              <Link href="/midia" className="hover:text-white transition-colors">
                Mídia Kit & Publicidade
              </Link>
            </li>
            <li>
              <Link href="/contato" className="hover:text-white transition-colors">
                Fale com a Redação
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-white transition-colors">
                Acesso Administrativo
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Transparência & Legal
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/privacidade" className="hover:text-white transition-colors">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
            </li>
            <li>
              <a href="/rss.xml" className="hover:text-white transition-colors">
                Feed RSS XML
              </a>
            </li>
            <li>
              <a href="/ads.txt" className="hover:text-white transition-colors">
                Anúncios (ads.txt)
              </a>
            </li>
          </ul>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" /> Curadoria Verificada
            </span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} Melhora Prudente. Todos os direitos reservados.
          </p>
          <p className="flex items-center justify-center gap-1 text-slate-400">
            Faz parte do ecossistema <span className="text-white font-bold">Roxou</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
