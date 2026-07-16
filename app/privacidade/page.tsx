import React from 'react';
import { ShieldCheck, Cookie, Lock, Eye } from 'lucide-react';
import { settingsService } from '@/services';

export const metadata = {
  title: 'Política de Privacidade | Melhora Prudente',
  description: 'Política de Privacidade e Termos de LGPD do portal Melhora Prudente, explicitando o uso de cookies e anúncios do Google AdSense.',
};

export default async function PrivacidadePage() {
  const settings = await settingsService.getSettings().catch(() => null);
  let privacyPolicyCustom = '';
  if (settings && settings.adsense_code?.startsWith('{')) {
    try {
      const parsed = JSON.parse(settings.adsense_code);
      privacyPolicyCustom = parsed.privacy_policy || '';
    } catch(e) {}
  }

  return (
    <div className="bg-zinc-50 min-h-screen py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={14} /> Privacidade e Transparência
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900">
            Política de Privacidade <span className="text-red-600">& LGPD</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
            Última atualização: 16 de Julho de 2026
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-zinc-150 shadow-sm space-y-8 text-sm text-zinc-700 leading-relaxed">
          
          {privacyPolicyCustom ? (
            privacyPolicyCustom.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
              <p key={index} className="text-zinc-600 text-sm leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                  <Lock size={18} className="text-red-600" /> 1. Compromisso com a Segurança de Dados
                </h2>
                <p>
                  O portal <strong>Melhora Prudente</strong> respeita a sua privacidade. Esta política de privacidade descreve como coletamos, guardamos, processamos e protegemos as informações fornecidas voluntariamente ou automaticamente coletadas ao navegar pelo nosso portal de notícias, em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                  <Eye size={18} className="text-red-600" /> 2. Coleta de Informações
                </h2>
                <p>
                  Coletamos informações pessoais de duas formas:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Informações Fornecidas Voluntariamente:</strong> Como seu nome, e-mail e foto do perfil ao criar uma conta, postar comentários em notícias ou submeter formulários na página de Contato.
                  </li>
                  <li>
                    <strong>Informações de Navegação:</strong> Dados técnicos coletados automaticamente através de arquivos de logs e cookies, incluindo endereço IP, geolocalização aproximada do município, tipo de navegador, sistema operacional e páginas visualizadas para fins estatísticos e otimização de performance.
                  </li>
                </ul>
              </section>

              <section className="space-y-3 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
                  <Cookie size={18} className="text-red-600" /> 3. Cookies e Anúncios Personalizados (Google AdSense)
                </h2>
                <p className="text-xs">
                  Este site utiliza cookies para personalizar anúncios, fornecer recursos de mídia social e analisar o tráfego do site. Nós também compartilhamos informações sobre o seu uso do site com nossos parceiros de publicidade e análise de tráfego (como o Google).
                </p>
                <p className="text-xs font-bold text-zinc-950 mt-2">
                  Sobre o Cookie DART do Google:
                </p>
                <p className="text-xs">
                  O Google, como fornecedor terceirizado, utiliza cookies para exibir anúncios neste site. Com o cookie DART, o Google pode exibir anúncios com base nas visitas que o usuário fez a este e a outros sites na Internet. Os usuários podem desativar o cookie DART visitando a Política de Privacidade da rede de conteúdo e anúncios do Google.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">4. Uso e Compartilhamento das Informações</h2>
                <p>
                  As informações pessoais coletadas são usadas exclusivamente para gerenciar as permissões dos comentários, garantir a segurança dos usuários, e-mail de contato de suporte técnico e para exibir anúncios contextuais relevantes através de redes parceiras (Google AdSense). O Melhora Prudente <strong>nunca comercializa ou cede dados pessoais</strong> a terceiros sem consentimento prévio ou exigência legal expressa.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">5. Seus Direitos (LGPD)</h2>
                <p>
                  Como titular dos dados, você possui o direito de solicitar a qualquer momento:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A confirmação da existência de tratamento de seus dados pessoais.</li>
                  <li>O acesso aos seus dados cadastrados.</li>
                  <li>A correção de dados incompletos ou inexatos.</li>
                  <li>A exclusão definitiva da sua conta e de todos os comentários associados a ela (direito ao esquecimento).</li>
                </ul>
                <p className="mt-2">
                  Para exercer qualquer um destes direitos, basta nos enviar um e-mail para <a href="mailto:contato@melhoraprudente.com.br" className="text-red-600 font-bold underline">contato@melhoraprudente.com.br</a>.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black text-zinc-900">6. Contato com o Encarregado de Dados</h2>
                <p>
                  Para dúvidas adicionais relacionadas à privacidade e proteção de dados pessoais, entre em contato diretamente com o nosso Encarregado de Proteção de Dados (DPO) através do e-mail oficial: <span className="font-bold text-zinc-950">dpo@melhoraprudente.com.br</span>.
                </p>
              </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
