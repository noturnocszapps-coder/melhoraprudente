'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { settingsService } from '@/services';
import { Settings } from '@/types';

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

export default function ContatoPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'reportagem',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data && active) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching settings on contact page:', err);
      }
    };
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.message) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'reportagem',
        message: ''
      });
    }, 1500);
  };

  const rawWhatsapp = settings?.whatsapp;
  const formattedPhone = rawWhatsapp ? formatBrazilianPhone(rawWhatsapp) : '';
  const whatsappLink = rawWhatsapp ? getWhatsAppLink(rawWhatsapp) : '';

  return (
    <div className="bg-zinc-50 min-h-screen py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        
        {/* Header */}
        <div className="space-y-4 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            <Mail size={14} /> Fale Conosco
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900">
            Fale com a nossa <span className="text-red-600">Redação</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Tem alguma sugestão de pauta, flagrou um acontecimento importante ou quer anunciar conosco? Envie uma mensagem diretamente para nossa equipe editorial.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Sidebar contact info */}
          <div className="lg:col-span-5 bg-zinc-900 text-white p-8 md:p-10 rounded-3xl flex flex-col justify-between space-y-12 relative overflow-hidden shadow-md">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-8 relative z-10">
              <h2 className="text-xl font-black tracking-tight uppercase tracking-wider">Informações Institucionais</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-red-500">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">E-mail Editorial</h3>
                    <p className="text-sm font-bold text-zinc-100 break-all">contato@melhoraprudente.com.br</p>
                  </div>
                </div>

                {formattedPhone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-red-500">
                      <Phone size={18} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Telefone / WhatsApp</h3>
                      <a 
                        href={whatsappLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-bold text-zinc-100 hover:text-red-500 transition-colors break-all"
                      >
                        {formattedPhone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-red-500">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Sede Administrativa</h3>
                    <p className="text-sm font-medium text-zinc-300">
                      Av. Coronel José Soares Marcondes, 2024<br />
                      Presidente Prudente - SP<br />
                      CEP: 19010-082
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-800 relative z-10">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Atendimento de Segunda a Sexta: 8h às 18h.<br />
                Plantão de Jornalismo: 24 horas via WhatsApp.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-zinc-150 shadow-sm flex flex-col justify-center">
            
            {sent ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">Mensagem Enviada!</h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  Agradecemos seu contato. Sua sugestão ou denúncia foi encaminhada para a nossa mesa de redação e será avaliada com prioridade.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-6 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Enviar Nova Mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-lg font-black text-zinc-900 tracking-tight mb-2">Envie sua Mensagem</h2>
                
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: João Silva"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Seu E-mail *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="joao@exemplo.com"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">WhatsApp / Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(18) 99999-9999"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Assunto</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                    >
                      <option value="reportagem">Sugestão de Reportagem / Pauta</option>
                      <option value="denuncia">Denúncia de Bairro</option>
                      <option value="comercial">Publicidade / Anúncios</option>
                      <option value="reclamacao">Dúvidas ou Críticas</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Mensagem *</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Descreva aqui sua denúncia, sugestão de pauta ou dúvida..."
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-500 rounded-xl py-3.5 px-4 text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-red-100 transition-all min-h-[120px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-55 text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando para a Redação...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
