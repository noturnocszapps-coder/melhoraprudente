import { NewsSourceMetadata } from '../core/types';

export const PREFEITURA_CONFIG: NewsSourceMetadata = {
  id: 'prefeitura',
  name: 'Prefeitura Municipal de Presidente Prudente',
  baseUrl: 'https://www.presidenteprudente.sp.gov.br/site/noticias.xhtml',
  category: 'Oficial',
  isActive: true,
  crawlIntervalMinutes: 60,
};

export const PREFEITURA_SCRAPER_CONFIG = {
  noticiasUrl: 'https://www.presidenteprudente.sp.gov.br/site/noticias.xhtml',
  siteBaseUrl: 'https://www.presidenteprudente.sp.gov.br',
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
    /Secretaria Municipal de Comunicação/gi,
    /Fonte: Secretaria de Comunicação/gi,
    /Fotos: Secom/gi,
    /Secom - Presidente Prudente/gi,
  ],
};
