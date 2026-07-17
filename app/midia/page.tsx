'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Code, 
  Megaphone, 
  Video, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  MessageSquare, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Send,
  User,
  Building,
  Mail,
  Phone,
  Briefcase,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RoxouLogo from '@/components/brand/RoxouLogo';

export default function RoxouMediaPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'tecnologia' | 'midia' | 'audiovisual' | 'eventos'>('all');
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    mensagem: '',
    servico: 'Tecnologia (Sites, Apps, etc.)'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Audiovisual categories filter
  const avCategories = [
    'Eventos', 'Shows', 'Casamentos', 'Festas', 
    'Aftermovies', 'Institucionais', 'Conteúdo social', 'Cobertura em tempo real'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Prepare WhatsApp Message
    const messageText = `Olá Fernando! Gostaria de solicitar um orçamento para Roxou Mídia:
*Nome*: ${formData.nome}
*Empresa*: ${formData.empresa || 'Não informada'}
*Serviço*: ${formData.servico}
*E-mail*: ${formData.email}
*Telefone*: ${formData.telefone}
*Mensagem*: ${formData.mensagem || 'Sem mensagem adicional'}`;

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/5518997469865?text=${encodedMessage}`;

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      window.open(whatsappUrl, '_blank');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-900 selection:text-purple-100 font-sans">
      
      {/* 🔮 Background Mesh Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[800px] bg-[radial-gradient(circle_at_50%_-100px,#3b0764,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-[1200px] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,#1e1b4b,transparent_70%)] pointer-events-none z-0 opacity-40" />
      <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_50%_100%,#2e1065,transparent_80%)] pointer-events-none z-0 opacity-40" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-20" />

      {/* 🚀 Sticky Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/60 border-b border-zinc-900">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between max-w-7xl">
          <Link href="/midia">
            <RoxouLogo variant="horizontal" theme="dark" size="md" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase text-zinc-400">
            <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
            <a href="#ecossistema" className="hover:text-white transition-colors">Ecossistema</a>
            <a href="#audiovisual" className="hover:text-white transition-colors">Audiovisual</a>
            <a href="#portfolio" className="hover:text-white transition-colors">Portfólio</a>
            <a href="#contato" className="hover:text-white transition-colors">Contato</a>
          </nav>

          <a 
            href="#orcamento" 
            className="hidden sm:inline-flex items-center gap-2 bg-white text-black hover:bg-purple-100 transition-all font-black text-[10px] md:text-xs tracking-wider uppercase px-4 md:px-5 py-2.5 rounded-full shadow-lg hover:shadow-purple-500/25"
          >
            Solicitar Orçamento
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* 💫 HERO SECTION */}
      <section className="relative container mx-auto px-4 pt-16 md:pt-28 pb-20 max-w-7xl z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-950/80 border border-purple-800/60 rounded-full py-1 px-4 text-[10px] md:text-xs font-black tracking-widest uppercase text-purple-300">
            <Sparkles size={12} className="text-purple-400 animate-pulse" />
            NOVA IDENTIDADE OFICIAL
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500">
            Transformamos ideias em <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 filter drop-shadow-[0_2px_10px_rgba(168,85,247,0.2)]">experiências</span> que conectam pessoas.
          </h1>

          <p className="text-sm md:text-lg text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Soluções completas em tecnologia, mídia, audiovisual e experiências para empresas, eventos e negócios. Desenvolvemos o futuro do seu projeto.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#orcamento" 
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full transition-all shadow-xl shadow-purple-600/35 hover:translate-y-[-2px]"
            >
              SOLICITAR ORÇAMENTO
            </a>
            <a 
              href="#servicos" 
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-full transition-all hover:translate-y-[-2px]"
            >
              CONHECER SERVIÇOS
            </a>
          </div>
        </motion.div>

        {/* Hero mockup composition */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-16 md:mt-24 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/60 backdrop-blur-md p-2.5 md:p-4 shadow-2xl shadow-purple-950/10"
        >
          <div className="relative rounded-[1.25rem] overflow-hidden border border-zinc-900 bg-black aspect-[16/9] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
            {/* Tech Wireframe Accent */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path d="M 0,50 L 100,50 M 50,0 L 50,100 M 10,10 L 90,90 M 90,10 L 10,90" stroke="url(#gridGrad)" strokeWidth="0.2" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="30" stroke="url(#gridGrad)" strokeWidth="0.1" fill="none" />
                <circle cx="50" cy="50" r="45" stroke="url(#gridGrad)" strokeWidth="0.1" fill="none" />
              </svg>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <RoxouLogo variant="vertical" theme="dark" size="xl" />
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <span className="bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-zinc-300">
                  ⚡ PREMIUM TECH
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-zinc-300">
                  🎬 HIGH-END AUDIOVISUAL
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-zinc-300">
                  ✨ MEMORABLE EVENTS
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 🛠️ PILARES DE SERVIÇOS */}
      <section id="servicos" className="relative container mx-auto px-4 py-24 max-w-7xl z-10 scroll-mt-20">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-purple-400 font-bold uppercase tracking-widest text-[10px] px-3.5 py-1.5 rounded-full">
            <Sliders size={12} />
            CONHEÇA NOSSAS SOLUÇÕES
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Quatro Pilares de Atuação
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
            Integramos tecnologia robusta, marketing focado em conversão e audiovisual cinematográfico para gerar resultados de verdade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pilar 1: Tecnologia */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative bg-zinc-950/60 border border-zinc-900 hover:border-purple-500/40 rounded-3xl p-8 transition-all duration-300 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/20 transition-all duration-300" />
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <Code size={22} />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                TECNOLOGIA
                <span className="text-[10px] tracking-widest font-bold uppercase bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-md">DEVELOPMENT</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Sites Institucionais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Landing Pages de Alta Conversão
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Plataformas Digitais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Sistemas Web Personalizados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Integrações de API
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Automação de Processos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Sistemas de Reservas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Ferramentas sob Demanda
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Pilar 2: Marketing & Mídia */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative bg-zinc-950/60 border border-zinc-900 hover:border-purple-500/40 rounded-3xl p-8 transition-all duration-300 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/20 transition-all duration-300" />
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <Megaphone size={22} />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                MARKETING & MÍDIA
                <span className="text-[10px] tracking-widest font-bold uppercase bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-md">GROWTH</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Marketing Digital Integrado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Gestão de Redes Sociais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Campanhas Patrocinadas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Criação de Conteúdo Estratégico
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Divulgação de Eventos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> SEO & Otimização de Busca
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Conteúdo Patrocinado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Divulgação no Ecossistema
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Pilar 3: Audiovisual */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative bg-zinc-950/60 border border-zinc-900 hover:border-purple-500/40 rounded-3xl p-8 transition-all duration-300 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/20 transition-all duration-300" />
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <Video size={22} />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                AUDIOVISUAL
                <span className="text-[10px] tracking-widest font-bold uppercase bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-md">CREATIVE</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Cobertura de Grandes Eventos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Filmagem Cinema/4K
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Aftermovies Cinematográficos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Reels, TikToks & Shorts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Vídeos Institucionais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Casamentos & Datas Marcantes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Shows, Lives & Festas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Cobertura Corporativa
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Pilar 4: Soluções para Eventos & Empresas */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative bg-zinc-950/60 border border-zinc-900 hover:border-purple-500/40 rounded-3xl p-8 transition-all duration-300 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/20 transition-all duration-300" />
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <Calendar size={22} />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                EVENTOS & EMPRESAS
                <span className="text-[10px] tracking-widest font-bold uppercase bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-md">OPERATIONS</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Divulgação Estratégica Regional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Sistemas de Lista VIP
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Convites Inteligentes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Gestão de Reservas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Credenciamento Rápido
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Check-in por QR Code
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Gestão de Participantes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-purple-500" /> Landing Pages customizadas
                </li>
              </ul>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 🌐 ECOSSISTEMA ROXOU */}
      <section id="ecossistema" className="relative bg-zinc-950 py-24 scroll-mt-20 border-t border-b border-zinc-900">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-purple-400 font-bold uppercase tracking-widest text-[10px] px-3.5 py-1.5 rounded-full">
              <Briefcase size={12} />
                    PORTFÓLIO DE PRODUTOS
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              O Ecossistema Roxou
            </h2>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
              Desenvolvemos produtos, serviços e plataformas conectadas que impulsionam marcas e criam experiências marcantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Roxou Portal */}
            <div className="bg-black/50 border border-zinc-900 rounded-3xl p-6 hover:border-purple-900 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-purple-400 uppercase bg-purple-950 px-2.5 py-1 rounded-md">EXPERIÊNCIAS</span>
                <span className="text-[10px] text-zinc-500 font-mono">roxou.com.br</span>
              </div>
              <h3 className="text-lg font-black text-white">ROXOU</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                A nossa plataforma principal voltada para a descoberta de lugares incríveis, agenda de eventos regionais e curadoria de experiências inesquecíveis.
              </p>
              <div className="pt-2">
                <a href="https://roxou.com.br" target="_blank" className="text-xs font-bold text-white hover:text-purple-400 inline-flex items-center gap-1.5 group">
                  Acesse roxou.com.br
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Partner Pro */}
            <div className="bg-black/50 border border-zinc-900 rounded-3xl p-6 hover:border-purple-900 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-indigo-400 uppercase bg-indigo-950 px-2.5 py-1 rounded-md">BUSINESS</span>
                <span className="text-[10px] text-zinc-500 font-mono">parceiro.roxou.com.br</span>
              </div>
              <h3 className="text-lg font-black text-white">PARTNER PRO</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Painel gerencial completo para empresas. Controle listas de convidados, reservas de mesas, listas VIP, relatórios de vendas e gestão operacional inteligente.
              </p>
              <div className="pt-2">
                <a href="https://parceiro.roxou.com.br" target="_blank" className="text-xs font-bold text-white hover:text-purple-400 inline-flex items-center gap-1.5 group">
                  Portal do Parceiro
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Reserva Roxou */}
            <div className="bg-black/50 border border-zinc-900 rounded-3xl p-6 hover:border-purple-900 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-950 px-2.5 py-1 rounded-md">ATENDIMENTO</span>
                <span className="text-[10px] text-zinc-500 font-mono">reserva.roxou.com.br</span>
              </div>
              <h3 className="text-lg font-black text-white">RESERVA ROXOU</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Sistema exclusivo integrado para reservas online, agendamento de horários e atendimento otimizado para restaurantes, bares e prestadores de serviço.
              </p>
              <div className="pt-2">
                <a href="https://reserva.roxou.com.br" target="_blank" className="text-xs font-bold text-white hover:text-purple-400 inline-flex items-center gap-1.5 group">
                  Conhecer Sistema
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* DriverDash */}
            <div className="bg-black/50 border border-zinc-900 rounded-3xl p-6 hover:border-purple-900 transition-all duration-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-950 px-2.5 py-1 rounded-md">MOBILIDADE</span>
                <span className="text-[10px] text-zinc-500 font-mono">DRIVERDASH</span>
              </div>
              <h3 className="text-lg font-black text-white">DRIVERDASH ROXOU</h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Nossa solução dedicada para motoristas parceiros e operadores de transporte de passageiros. Gestão inteligente de frotas e logística de transporte.
              </p>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Homologação Interna</span>
              </div>
            </div>

            {/* Roxou Media */}
            <div className="bg-black/50 border border-purple-500/30 rounded-3xl p-6 hover:border-purple-500 transition-all duration-300 space-y-4 ring-1 ring-purple-500/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-purple-400 uppercase bg-purple-950 px-2.5 py-1 rounded-md animate-pulse">AGÊNCIA</span>
                <span className="text-[10px] text-purple-400 font-mono">midia.roxou.com.br</span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                ROXOU MEDIA
                <span className="bg-purple-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">VOCÊ ESTÁ AQUI</span>
              </h3>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                O pilar institucional e de agência da Roxou. Focado em impulsionar o seu negócio através de engenharia web de ponta, mídia, audiovisual e estratégias corporativas.
              </p>
              <div className="pt-2">
                <a href="#servicos" className="text-xs font-bold text-purple-400 hover:text-white inline-flex items-center gap-1.5">
                  Conhecer portfólio de agência
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🎬 AUDIOVISUAL (Histórias que merecem ser lembradas) */}
      <section id="audiovisual" className="relative container mx-auto px-4 py-24 max-w-7xl z-10 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-purple-400 font-bold uppercase tracking-widest text-[10px] px-3.5 py-1.5 rounded-full">
              <Video size={12} />
              AUDIOVISUAL CINEMATOGRÁFICO
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
              Histórias que merecem ser lembradas.
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
              Do primeiro frame ao resultado final, transformamos momentos, marcas e eventos em conteúdo que gera conexão genuína. Produção técnica impecável, som límpido e edição inovadora.
            </p>

            <div className="pt-2 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Captura em Altíssima Definição</h4>
                  <p className="text-xs text-zinc-500 font-medium">Equipamento profissional de alta performance para extrair a melhor luz e detalhe.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Equipe Altamente Qualificada</h4>
                  <p className="text-xs text-zinc-500 font-medium">Olhar artístico refinado, direção criativa integrada e sensibilidade estética.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-[2.5rem] p-6 md:p-8 space-y-6">
            <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase border-b border-zinc-900 pb-3">Formatos Atendidos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {avCategories.map((cat, idx) => (
                <div key={idx} className="bg-black/50 border border-zinc-900 rounded-2xl p-4 flex items-center gap-3 hover:border-purple-900/60 transition-all duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-xs md:text-sm font-bold text-zinc-300">{cat}</span>
                </div>
              ))}
            </div>

            <div className="bg-purple-950/20 border border-purple-900/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-purple-300">Quer registrar sua história?</h4>
                <p className="text-[10px] text-zinc-400">Solicite nossa agenda e garanta sua cobertura audiovisual.</p>
              </div>
              <a href="#orcamento" className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest py-2.5 px-4 rounded-xl transition-all">
                AGENDAR AGORA
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 📁 PORTFÓLIO & PROVA SOCIAL PLACEHOLDERS */}
      <section id="portfolio" className="relative bg-zinc-950 py-24 scroll-mt-20 border-t border-zinc-900">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-purple-400 font-bold uppercase tracking-widest text-[10px] px-3.5 py-1.5 rounded-full">
              <Briefcase size={12} />
              NOSSO PORTFÓLIO
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Projetos Recentes
            </h2>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
              Visualizações de soluções entregues em engenharia web, cobertura, marketing e plataformas conectadas.
            </p>

            {/* Filter buttons */}
            <div className="pt-6 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'tecnologia', label: 'Tecnologia' },
                { id: 'midia', label: 'Marketing' },
                { id: 'audiovisual', label: 'Audiovisual' },
                { id: 'eventos', label: 'Eventos & Soluções' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setActiveCategory(btn.id as any)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeCategory === btn.id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Project 1 */}
            {(activeCategory === 'all' || activeCategory === 'tecnologia') && (
              <div className="group border border-zinc-900 rounded-3xl bg-black overflow-hidden hover:border-purple-900/60 transition-all duration-300">
                <div className="aspect-[16/10] bg-zinc-900/40 relative flex items-center justify-center p-6 border-b border-zinc-900">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#555_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <Code size={48} className="text-zinc-700 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">TECNOLOGIA</span>
                  <h3 className="text-base font-black text-white">Plataformas de Atendimento & Reservas</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Desenvolvimento de interfaces robustas de agendamento em tempo real com conexões via canais digitais.
                  </p>
                </div>
              </div>
            )}

            {/* Project 2 */}
            {(activeCategory === 'all' || activeCategory === 'midia') && (
              <div className="group border border-zinc-900 rounded-3xl bg-black overflow-hidden hover:border-purple-900/60 transition-all duration-300">
                <div className="aspect-[16/10] bg-zinc-900/40 relative flex items-center justify-center p-6 border-b border-zinc-900">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#555_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <Megaphone size={48} className="text-zinc-700 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">MARKETING & MÍDIA</span>
                  <h3 className="text-base font-black text-white">Lançamento & Posicionamento Regional</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Estratégias de anúncios patrocinados, impulsionamento regional e engajamento orgânico de marcas.
                  </p>
                </div>
              </div>
            )}

            {/* Project 3 */}
            {(activeCategory === 'all' || activeCategory === 'audiovisual') && (
              <div className="group border border-zinc-900 rounded-3xl bg-black overflow-hidden hover:border-purple-900/60 transition-all duration-300">
                <div className="aspect-[16/10] bg-zinc-900/40 relative flex items-center justify-center p-6 border-b border-zinc-900">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#555_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <Video size={48} className="text-zinc-700 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">AUDIOVISUAL</span>
                  <h3 className="text-base font-black text-white">Aftermovies de Grandes Eventos</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Edição cinematográfica e cobertura de momentos com entrega ágil para mídias digitais em tempo real.
                  </p>
                </div>
              </div>
            )}

            {/* Project 4 */}
            {(activeCategory === 'all' || activeCategory === 'eventos') && (
              <div className="group border border-zinc-900 rounded-3xl bg-black overflow-hidden hover:border-purple-900/60 transition-all duration-300">
                <div className="aspect-[16/10] bg-zinc-900/40 relative flex items-center justify-center p-6 border-b border-zinc-900">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#555_1px,transparent_1px)] bg-[size:10px_10px]" />
                  <Calendar size={48} className="text-zinc-700 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="p-6 space-y-2">
                  <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase">EVENTOS</span>
                  <h3 className="text-base font-black text-white">Credenciamento & Listas de Convidados</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Sistemas automatizados de validação de QR Code nas portarias, gerando controle e segurança total.
                  </p>
                </div>
              </div>
            )}

          </div>

          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-xs font-semibold">
              * Para preservar a privacidade de nossos parceiros e cláusulas de confidencialidade (NDA), mais detalhes do portfólio de engenharia e campanhas podem ser apresentados sob demanda.
            </p>
            <div className="pt-4">
              <a href="#contato" className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider text-white">
                Falar com Redação & Comercial
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 🤝 CONTATO & ORÇAMENTO SECTION */}
      <section id="orcamento" className="relative container mx-auto px-4 py-24 max-w-7xl z-10 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-purple-400 font-bold uppercase tracking-widest text-[10px] px-3.5 py-1.5 rounded-full">
                <MessageSquare size={12} />
                SOLICITE SUA COTAÇÃO
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                Vamos criar algo extraordinário juntos?
              </h2>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                Conte sua ideia. A Roxou transforma seu sonho em projeto, conteúdo, tecnologia robusta ou em uma experiência inesquecível de marca.
              </p>
            </div>

            <div className="space-y-4 border-t border-zinc-900 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Direção Criativa & Redação</h4>
                  <p className="text-xs text-purple-400 font-bold">Fernando Henrique</p>
                  <p className="text-[10px] text-zinc-500 font-semibold">CEO & Diretor Criativo</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">WhatsApp Comercial</h4>
                  <a href="https://wa.me/5518997469865" target="_blank" className="text-xs text-zinc-300 hover:text-purple-400 font-bold">
                    +55 18 99746-9865
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Instagram</h4>
                  <a href="https://instagram.com/roxou.pp" target="_blank" className="text-xs text-zinc-300 hover:text-purple-400 font-bold">
                    @roxou.pp
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div id="contato" className="lg:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-[2.5rem] p-8 md:p-10 space-y-6 scroll-mt-24">
            <div className="border-b border-zinc-900 pb-4">
              <h3 className="text-lg font-black text-white">Formulário de Contato Rápido</h3>
              <p className="text-xs text-zinc-500 mt-1">Preencha os campos abaixo para ser redirecionado para o atendimento exclusivo no WhatsApp.</p>
            </div>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center mx-auto">
                  <CheckCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">Solicitação Encaminhada!</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">Sua requisição foi estruturada e você está sendo direcionado ao nosso WhatsApp.</p>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-bold text-purple-400 hover:text-white inline-flex items-center gap-1"
                  >
                    Enviar nova mensagem
                    <ChevronRight size={12} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Seu Nome *</label>
                    <input 
                      type="text" 
                      name="nome"
                      required
                      placeholder="Ex: João Silva"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sua Empresa (Opcional)</label>
                    <input 
                      type="text" 
                      name="empresa"
                      placeholder="Ex: Nome da sua marca"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">E-mail Comercial *</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="Ex: joao@empresa.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">WhatsApp / Telefone *</label>
                    <input 
                      type="tel" 
                      name="telefone"
                      required
                      placeholder="Ex: (18) 99746-9865"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Serviço de Interesse *</label>
                  <select 
                    name="servico"
                    value={formData.servico}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-600 transition-colors appearance-none"
                  >
                    <option>Tecnologia (Sites, Apps, etc.)</option>
                    <option>Marketing & Mídia (Campanhas, Redes Sociais)</option>
                    <option>Audiovisual (Filmagens, Coberturas)</option>
                    <option>Soluções para Eventos (VIP, Reservas, QR Code)</option>
                    <option>Parceria Comercial Completa</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mensagem / Ideia do Projeto</label>
                  <textarea 
                    name="mensagem"
                    rows={4}
                    placeholder="Conte um pouco sobre sua ideia, prazos ou objetivos..."
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-600 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                  >
                    {submitting ? 'PROCESSANDO...' : <><Send size={14} /> ENVIAR E ABRIR COMERCIAL</>}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* 🚀 COMPACT FOOTER */}
      <footer className="border-t border-zinc-900 bg-black py-12">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <RoxouLogo variant="horizontal" theme="dark" size="sm" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
              TECNOLOGIA • MÍDIA • EXPERIÊNCIAS
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
            <p className="text-xs text-zinc-400 font-bold">Roxou Media | midia.roxou.com.br</p>
            <p className="text-[10px] text-zinc-500 font-semibold">© {new Date().getFullYear()} Roxou. Todos os direitos reservados.</p>
            <p className="text-[9px] text-zinc-600 font-medium">Presidente Prudente - SP</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
