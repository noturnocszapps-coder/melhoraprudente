import React from 'react';
import { FileText, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';
import { settingsService } from '@/services';

export const metadata = {
  title: 'Termos de Uso | Melhora Prudente',
  description: 'Termos e Condições de Uso do portal de notícias Melhora Prudente. Regras de conduta, direitos de imagem e moderação de comentários.',
};

export default async function TermosPage() {
  const settings = await settingsService.getSettings().catch(() => null);
  let termsOfUseCustom = '';
  if (settings && settings.adsense_code?.startsWith('{')) {
    try {
      const parsed = JSON.parse(settings.adsense_code);
      termsOfUseCustom = parsed.terms_of_use || '';
    } catch(e) {}
  }

  return (
    <div className="bg-zinc-50 min-h-screen py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <FileText size={14} /> Regras e Diretrizes
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900">
            Termos de <span className="text-red-600">Uso do Portal</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            Última atualização: 16 de Julho de 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-zinc-150 shadow-sm space-y-8 text-sm text-zinc-700 leading-relaxed">
          
          {termsOfUseCustom ? (
            termsOfUseCustom.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
              <p key={index} className="text-zinc-600 text-sm leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                  <Scale size={18} className="text-red-600" /> 1. Aceitação dos Termos
                </h2>
                <p>
                  Ao acessar, ler ou interagir com as postagens, comentários e ferramentas do portal <strong>Melhora Prudente</strong>, o usuário expressa sua integral concordância com estes Termos de Uso. Caso não concorde com qualquer uma das regras aqui estabelecidas, o usuário deve imediatamente interromper a navegação no portal.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">2. Direitos Autorais e Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo textual, incluindo reportagens, crônicas locais, investigações, layout do portal e códigos de software são de propriedade exclusiva do <strong>Melhora Prudente</strong>. 
                </p>
                <p>
                  <strong>Fotografias e Vídeos:</strong> O portal utiliza fotos autorais de sua equipe de reportagem, bem como fotografias licenciadas de acervos públicos (como Unsplash e Pexels). A reprodução parcial ou total de reportagens ou imagens do site para fins comerciais sem menção explícita de crédito e link funcional é estritamente proibida e passível de sanções civis.
                </p>
              </section>

              <section className="space-y-3 p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-600" /> 3. Política e Moderação de Comentários
                </h2>
                <p className="text-xs">
                  O Melhora Prudente valoriza a liberdade de expressão, porém mantém moderação ativa de comentários. O usuário assume responsabilidade civil e criminal exclusiva pelas opiniões que publicar.
                </p>
                <p className="text-xs font-bold text-zinc-950 mt-2">
                  Comentários contendo os seguintes itens serão removidos e as contas associadas suspensas:
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 mt-1 text-zinc-600">
                  <li>Mensagens de ódio, racismo, injúria racial, homofobia ou intolerância religiosa.</li>
                  <li>Difamação, calúnia e mentiras infundadas (Fake News) contra pessoas ou instituições locais.</li>
                  <li>Links de SPAM, publicidade disfarçada e esquemas de ganhos fáceis.</li>
                  <li>Palavrões explícitos ou termos depreciativos agressivos.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">4. Responsabilidade Técnica</h2>
                <p>
                  O Melhora Prudente trabalha continuamente para manter a estabilidade do portal de notícias 24 horas por dia. Contudo, não nos responsabilizamos por quedas temporárias de energia, instabilidade técnica no servidor do usuário ou inconsistências externas que possam interromper a visualização da página.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">5. Alterações nos Termos</h2>
                <p>
                  Reservamo-nos o direito de alterar ou atualizar estes Termos de Uso periodicamente, publicando a versão revisada nesta mesma página. Recomendamos aos usuários recorrentes que revisem esta página com frequência.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">6. Foro de Discussão</h2>
                <p>
                  Fica eleito o Foro da Comarca de <strong>Presidente Prudente, Estado de São Paulo</strong>, para dirimir quaisquer controvérsias decorrentes destes Termos de Uso ou do uso do portal.
                </p>
              </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
