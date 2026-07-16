import React from 'react';
import { Newspaper, Users, Award, ShieldCheck } from 'lucide-react';
import { settingsService } from '@/services';

export const metadata = {
  title: 'Sobre Nós | Portal Melhora Prudente',
  description: 'Conheça o Melhora Prudente, a voz do Oeste Paulista. Nossa história, missão e compromisso com o jornalismo ético e regional.',
};

export default async function SobrePage() {
  const settings = await settingsService.getSettings().catch(() => null);
  let aboutUsCustom = '';
  if (settings && settings.adsense_code?.startsWith('{')) {
    try {
      const parsed = JSON.parse(settings.adsense_code);
      aboutUsCustom = parsed.about_us || '';
    } catch(e) {}
  }

  return (
    <div className="bg-zinc-50 min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 space-y-16">
        
        {/* Editorial Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <Newspaper size={14} /> Quem Somos
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900">
            Compromisso com o <span className="text-red-600">Oeste Paulista</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
            Nascido no coração de Presidente Prudente, o Melhora Prudente é o seu canal de jornalismo comunitário, ágil e independente.
          </p>
        </div>

        {/* Hero Illustration Block */}
        <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-zinc-900 relative shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200" 
            alt="Presidente Prudente Região" 
            className="w-full h-full object-cover opacity-70 filter saturate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-8">
            <p className="text-white text-xs font-bold uppercase tracking-widest">Fotografia do Oeste Paulista — Conexão Direta com Nossas Raízes</p>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-zinc-150 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Nossa História</h2>
            {aboutUsCustom ? (
              aboutUsCustom.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                <p key={index} className="text-zinc-600 text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Fundado em 2024, o <strong>Melhora Prudente</strong> foi criado por um grupo de jornalistas independentes com um propósito claro: descentralizar a informação e dar voz ativa aos moradores de Presidente Prudente e de todas as cidades que compõem o Oeste Paulista.
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Acreditamos que a informação local é a ferramenta mais poderosa para o desenvolvimento comunitário. Ao relatar os fatos com precisão cirúrgica e cobrir o que realmente impacta o cotidiano dos nossos leitores — desde obras municipais e segurança urbana até as manifestações culturais mais autênticas da nossa região —, fomentamos o debate saudável e consciente.
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  No Melhora Prudente, a apuração ética corre em nossas veias. Mantemos viva a tradição da investigação séria, agora fortalecida pela velocidade dos meios digitais, gerando um ecossistema seguro e transparente para leitores e parceiros.
                </p>
              </>
            )}
          </div>

          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Nossos Pilares</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">Veracidade</h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">Fatos rigorosamente checados com múltiplas fontes oficiais e locais.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">Foco Comunitário</h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">Espaço aberto para denúncias, elogios e coberturas de bairro.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">Independência</h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">Livre de pressões externas, priorizando sempre o interesse público.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Info */}
        <div className="text-center space-y-2 text-xs text-zinc-400 font-bold uppercase tracking-widest border-t border-zinc-200 pt-8">
          <p>Melhora Prudente Portal de Notícias Ltda.</p>
          <p>CNPJ: 54.237.790/0001-25 — Presidente Prudente - SP</p>
        </div>

      </div>
    </div>
  );
}
