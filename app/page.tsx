'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { NewsItem, CategorySlug } from '@/types/news';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { PlantaoTicker } from '@/components/news/PlantaoTicker';
import { HeroBanner } from '@/components/news/HeroBanner';
import { DestaquesSecundarios } from '@/components/news/DestaquesSecundarios';
import { GridNoticias } from '@/components/news/GridNoticias';
import { CategoriasBlocos } from '@/components/news/CategoriasBlocos';
import { MaisLidasRanking } from '@/components/news/MaisLidasRanking';
import { PublicidadeBanner } from '@/components/ads/PublicidadeBanner';
import { Footer } from '@/components/layout/Footer';

// Sample fallback news items to ensure a rich, zero-blank UI at all times
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Inova Prudente encerra semana de imersão tecnológica com workshop de programação e robótica',
    slug: 'inova-prudente-semana-imersao-tecnologica',
    excerpt:
      'Iniciativa reuniu estudantes e profissionais locais em Presidente Prudente para capacitação em desenvolvimento e novas tecnologias.',
    category: 'Inovação',
    image_url: 'https://inovaprudente.com.br/noticias/fotos/2026/07/curso-programacao.jpg',
    source_name: 'Inova Prudente',
    published_at: '2026-07-24T14:00:00.000Z',
    views_count: 840,
    is_featured: true,
  },
  {
    id: '2',
    title: 'Prefeitura de Presidente Prudente anuncia obras de recapeamento e melhoria na iluminação pública',
    slug: 'prefeitura-prudente-obras-recapeamento-iluminacao',
    excerpt:
      'Investimento municipal contempla vias arteriais nos bairros da zona leste e centro com modernização em lâmpadas LED.',
    category: 'Cidade',
    image_url: 'https://picsum.photos/seed/prefeitura-obras/800/500',
    source_name: 'Prefeitura de Prudente',
    published_at: '2026-07-24T12:00:00.000Z',
    views_count: 620,
    is_featured: true,
  },
  {
    id: '3',
    title: 'IFSP abre vagas para cursos técnicos gratuitos em Presidente Prudente e região',
    slug: 'ifsp-vagas-cursos-tecnicos-gratuitos-prudente',
    excerpt:
      'Inscrições estão abertas para áreas de automação industrial, informática e administração no campus local.',
    category: 'Educação',
    image_url: 'https://picsum.photos/seed/ifsp-prudente/800/500',
    source_name: 'G1 Presidente Prudente',
    published_at: '2026-07-24T09:00:00.000Z',
    views_count: 510,
    is_featured: true,
  },
  {
    id: '4',
    title: 'Comércio de Presidente Prudente registra alta nas vendas no setor de serviços no segundo trimestre',
    slug: 'comercio-prudente-alta-vendas-servicos',
    excerpt:
      'Levantamento da Associação Comercial aponta crescimento sustentável impulsionado por novos empreendimentos no ecossistema local.',
    category: 'Economia',
    image_url: 'https://picsum.photos/seed/comercio-prudente/800/500',
    source_name: 'Melhora Prudente',
    published_at: '2026-07-23T18:00:00.000Z',
    views_count: 430,
  },
  {
    id: '5',
    title: 'Polícia Militar intensifica patrulhamento preventivo na área central e corredores comerciais',
    slug: 'policia-militar-patrulhamento-preventivo-prudente',
    excerpt:
      'Operação reforça presença ostensiva de equipes com foco na segurança de pedestres e comerciantes locais.',
    category: 'Segurança',
    image_url: 'https://picsum.photos/seed/policia-prudente/800/500',
    source_name: 'G1 Presidente Prudente',
    published_at: '2026-07-23T12:00:00.000Z',
    views_count: 790,
  },
  {
    id: '6',
    title: 'Workshop na Inova Prudente orienta empreendedores sobre contratação PJ e redução de riscos',
    slug: 'inova-prudente-workshop-contratacao-pj',
    excerpt:
      'Especialistas em direito trabalhista e contabilidade apresentaram boas práticas para startups e empresas de tecnologia.',
    category: 'Inovação',
    image_url: 'https://picsum.photos/seed/inova-workshop/800/500',
    source_name: 'Inova Prudente',
    published_at: '2026-07-23T08:00:00.000Z',
    views_count: 310,
  },
];

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategorySlug>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true);
        // Try to fetch published news from Supabase
        const { data: publishedNews, error: newsErr } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(20);

        if (!newsErr && publishedNews && publishedNews.length > 0) {
          const mapped: NewsItem[] = publishedNews.map((n: any) => ({
            id: n.id,
            title: n.title,
            slug: n.slug || `noticia-${n.id}`,
            excerpt: n.excerpt || n.content?.slice(0, 150) || '',
            content: n.content,
            category: n.category || 'Cidade',
            image_url: n.image_url,
            source_name: n.source_name || 'Melhora Prudente',
            original_url: n.original_url,
            published_at: n.published_at || '2026-07-24T12:00:00.000Z',
            views_count: n.views_count || Math.floor(Math.random() * 300) + 50,
          }));
          setNews(mapped);
          return;
        }

        // Fallback: check candidates if approved or ai_processed exist
        const { data: candidates, error: candErr } = await supabase
          .from('news_candidates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!candErr && candidates && candidates.length > 0) {
          const mappedCand: NewsItem[] = candidates.map((c: any) => {
            const ai = c.ai_content || {};
            const meta = c.source_metadata || {};
            return {
              id: c.id,
              title: ai.title || c.ai_title || meta.title || 'Notícia de Prudente',
              slug: `noticia-${c.id}`,
              excerpt: ai.excerpt || c.ai_summary || meta.excerpt || 'Resumo da notícia local.',
              content: ai.content || c.original_content || '',
              category: ai.category || c.ai_category || 'Cidade',
              image_url: meta.image_url,
              source_name: meta.source_name || c.source_id?.toUpperCase() || 'Melhora Prudente',
              original_url: c.original_url,
              published_at: c.created_at || '2026-07-24T12:00:00.000Z',
              views_count: Math.floor(Math.random() * 400) + 100,
            };
          });
          setNews(mappedCand);
          return;
        }

        // Default fallback if database has no items yet
        setNews(FALLBACK_NEWS);
      } catch (err) {
        console.error('Erro ao carregar notícias:', err);
        setNews(FALLBACK_NEWS);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, []);

  const heroArticle = news[0] || FALLBACK_NEWS[0];
  const secundarias = news.slice(1, 4).length > 0 ? news.slice(1, 4) : FALLBACK_NEWS.slice(1, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Header */}
      <Header onSearch={(q) => setSearchQuery(q)} />

      {/* 2. Menu Navigation */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      {/* 3. Plantão Ticker */}
      <PlantaoTicker newsItems={news} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* 4. Banner Principal (Hero) */}
        {heroArticle && <HeroBanner article={heroArticle} />}

        {/* Ad Banner Top */}
        <PublicidadeBanner
          title="Espaço Especial de Publicidade Regional"
          description="Sua marca visível para a população de Presidente Prudente e região."
        />

        {/* 5. Destaques Secundários */}
        <DestaquesSecundarios articles={secundarias} />

        {/* Grid and Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main News Feed (Grid) */}
          <div className="lg:col-span-8">
            <GridNoticias
              articles={news}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onSelectCategory={(cat) => setActiveCategory(cat)}
            />

            {/* 7. Categorias por Blocos */}
            <CategoriasBlocos articles={news} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8 sticky top-[140px]">
            {/* 8. Mais Lidas */}
            <MaisLidasRanking articles={news} />

            {/* 9. Sidebar Ad */}
            <PublicidadeBanner type="sidebar" />
          </div>
        </div>
      </main>

      {/* 10. Rodapé */}
      <Footer />
    </div>
  );
}
