import { RawNewsArticle, ProcessedNewsArticle } from '../core/types';
import { PREFEITURA_SCRAPER_CONFIG } from './config';

/**
 * Cleans raw article content from Prefeitura Municipal de Presidente Prudente
 */
export function cleanPrefeituraArticle(raw: RawNewsArticle): ProcessedNewsArticle {
  let content = raw.rawContent || '';

  // 1. Remove CDATA wrappers
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // 2. Remove script, style, and iframe tags
  content = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // 3. Remove Secom / promo patterns
  for (const pattern of PREFEITURA_SCRAPER_CONFIG.promoPatterns) {
    content = content.replace(pattern, '');
  }

  // 4. Strip HTML tags except paragraphs or convert <p> to clean lines
  let cleanedText = content
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'");

  // 5. Clean up multiple empty lines and leading/trailing spaces
  cleanedText = cleanedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n')
    .trim();

  // 6. Generate clean excerpt
  const paragraphs = cleanedText.split('\n\n');
  const dateHeaderRegex = /^(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)-feira,?\s*\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}/i;
  let excerptCandidate = paragraphs.find((p) => !dateHeaderRegex.test(p) && p.length > 25) || paragraphs[0] || '';

  const excerpt =
    raw.excerpt && raw.excerpt.length > 10
      ? raw.excerpt.replace(/<[^>]+>/g, '').trim()
      : excerptCandidate.length > 220
      ? excerptCandidate.slice(0, 217) + '...'
      : excerptCandidate;


  return {
    sourceId: raw.sourceId,
    originalUrl: raw.originalUrl,
    title: raw.title.trim(),
    cleanedContent: cleanedText,
    excerpt,
    author: raw.author || 'Secom Presidente Prudente',
    publishedAt: raw.publishedAt || new Date().toISOString(),
    imageUrl: raw.imageUrl,
    category: 'Oficial',
    tags: ['Prefeitura', 'Presidente Prudente', 'Governo Municipal'],
  };
}

