import { NewsSourceMetadata } from '../core/types';

export const INOVA_CONFIG: NewsSourceMetadata = {
  id: 'inova',
  name: 'Inova Prudente',
  baseUrl: 'https://www.inovaprudente.com.br/noticias',
  category: 'Inovação & Tecnologia',
  isActive: true,
  crawlIntervalMinutes: 120,
};

export const INOVA_SCRAPER_CONFIG = {
  noticiasUrl: 'https://www.inovaprudente.com.br/noticias',
  siteBaseUrl: 'https://www.inovaprudente.com.br',
  timeoutMs: 12000,
  maxArticlesPerCrawl: 15,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  },
  selectors: {
    title: 'h1',
    image: 'meta[property="og:image"]',
    paragraphs: 'p',
  },
  promoPatterns: [
    /Fonte:\s*Assessoria de Comunicação Inova Prudente/gi,
    /Por:\s*Assessoria de Comunicação Inova Prudente/gi,
    /Acompanhe as ações/gi,
    /Siga a Inova Prudente nas redes sociais/gi,
  ],
};

