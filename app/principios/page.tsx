import React from 'react';
import { ShieldAlert, BookOpen, Scale, History, FileEdit } from 'lucide-react';

export const metadata = {
  title: 'Princípios Editoriais e Correções | Melhora Prudente',
  description: 'Conheça nossos princípios éticos, nossa carta de compromisso jornalístico e nossa política de retificações e correções rápidas.',
};

export default function PrincipiosPage() {
  return (
    <div className="bg-zinc-50 min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 space-y-16">
        
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <BookOpen size={14} /> Ética Jornalística
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900">
            Princípios Editoriais & <span className="text-red-600">Correções</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
            Nossa credibilidade é construída sobre a verdade, a ética profissional e o compromisso inabalável com a apuração dos fatos.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Box 1: Editorial Principles */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-150 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                <Scale size={18} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Princípios Editoriais</h2>
            </div>
            
            <p className="text-sm text-zinc-600 leading-relaxed">
              O <strong>Melhora Prudente</strong> rege-se pelos princípios fundamentais do jornalismo democrático, ético e cidadão:
            </p>

            <ul className="space-y-4 text-sm text-zinc-700">
              <li className="flex gap-2 items-start">
                <span className="text-red-600 font-extrabold select-none">•</span>
                <div>
                  <strong>Independência:</strong> Não possuímos vínculos com partidos políticos, coligações ou grupos econômicos específicos. Nosso único patrão é o leitor.
                </div>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-red-600 font-extrabold select-none">•</span>
                <div>
                  <strong>Verificabilidade:</strong> Toda matéria de denúncia exige audição obrigatória de todas as partes envolvidas (direito ao contraditório).
                </div>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-red-600 font-extrabold select-none">•</span>
                <div>
                  <strong>Respeito à Diversidade:</strong> Rejeitamos qualquer manifestação discriminatória de gênero, cor, raça, orientação sexual ou religião.
                </div>
              </li>
            </ul>
          </div>

          {/* Box 2: Corrections Policy */}
          <div className="bg-white p-8 rounded-3xl border border-zinc-150 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                <History size={18} />
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">Política de Correções</h2>
            </div>
            
            <p className="text-sm text-zinc-600 leading-relaxed">
              Erros acontecem, mas a transparência na retificação é o que separa o jornalismo sério do sensacionalismo. Nossa conduta diante de equívocos é imediata:
            </p>

            <ul className="space-y-4 text-sm text-zinc-700">
              <li className="flex gap-2 items-start">
                <span className="text-blue-600 font-extrabold select-none">•</span>
                <div>
                  <strong>Agilidade:</strong> Constatado um erro factual, a matéria é atualizada imediatamente com os dados corretos.
                </div>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-blue-600 font-extrabold select-none">•</span>
                <div>
                  <strong>Sinalização Visual:</strong> Toda matéria retificada exibe uma nota de rodapé explicativa transparente detalhando o que foi alterado, a data e o horário da modificação.
                </div>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-blue-600 font-extrabold select-none">•</span>
                <div>
                  <strong>Errata Pública:</strong> Quando um erro induz a interpretações severamente incorretas, publicamos uma errata formal em nossas redes de comunicação oficiais.
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* How to report errors */}
        <div className="bg-zinc-900 text-white p-8 md:p-10 rounded-3xl shadow-md space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-red-500 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-black tracking-tight uppercase tracking-wider">Como Solicitar uma Correção Factural?</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Qualquer cidadão, instituição ou parte interessada pode reportar inconsistências, dados incorretos ou solicitar direito de resposta em reportagens publicadas no Melhora Prudente. 
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Para registrar uma contestação formal, envie um e-mail detalhado para <a href="mailto:correcao@melhoraprudente.com.br" className="text-red-500 font-bold hover:underline">correcao@melhoraprudente.com.br</a> incluindo o link permanente da reportagem, o trecho contestado e os documentos ou comprovações factuais que embasam sua solicitação. Nosso conselho editorial retornará o contato em até 24 horas úteis.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
