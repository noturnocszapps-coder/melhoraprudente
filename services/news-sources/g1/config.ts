import { NewsSourceMetadata } from '../core/types';

export const G1_CONFIG: NewsSourceMetadata = {
  id: 'g1',
  name: 'G1 Presidente Prudente e Região',
  baseUrl: 'https://g1.globo.com/sp/presidente-prudente-regiao/',
  category: 'Geral',
  isActive: true,
  crawlIntervalMinutes: 30,
};

export const G1_SCRAPER_CONFIG = {
  rssFeedUrl: 'https://g1.globo.com/rss/g1/sp/presidente-prudente-regiao/',
  sectionUrl: 'https://g1.globo.com/sp/presidente-prudente-regiao/',
  timeoutMs: 10000,
  maxArticlesPerCrawl: 15,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  },
  selectors: {
    title: 'h1.content-head__title, h1[itemprop="headline"], title',
    subtitle: 'h2.content-head__subtitle, h2[itemprop="description"]',
    bodyParagraphs: 'p.content-text__container, .mc-article-body p',
    author: 'p.content-publication-data__author, span[itemprop="author"]',
    datePublished: 'time[itemprop="datePublished"], meta[property="article:published_time"]',
    image: 'meta[property="og:image"], img.content-media__image',
  },
  promoPatterns: [
    /Participe do canal do g1 Presidente Prudente e Região no WhatsApp/gi,
    /Receba as notícias do g1 Prudente e Região no seu WhatsApp/gi,
    /Siga o canal do g1 Presidente Prudente/gi,
    /Veja mais notícias no g1 Presidente Prudente e Região/gi,
    /Veja mais notícias da região no g1/gi,
    /Veja mais notícias no g1/gi,
    /assista às reportagens/gi,
    /VÍDEOS: veja tudo sobre/gi,
    /VÍDEOS: Tudo sobre a região/gi,
    /VÍDEOS: Veja as reportagens/gi,
  ],
};

