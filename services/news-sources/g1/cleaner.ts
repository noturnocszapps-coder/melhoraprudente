import { RawNewsArticle, ProcessedNewsArticle } from '../core/types';
import { G1_SCRAPER_CONFIG } from './config';

/**
 * Cleans G1 raw article content by removing promotional fluff, WhatsApp invitations,
 * script tags, XML CDATA residues, and formatting cleanly.
 */
export function cleanG1Article(raw: RawNewsArticle): ProcessedNewsArticle {
  let content = raw.rawContent || '';

  // 1. Remove CDATA wrappers
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // 2. Remove script and style blocks
  content = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // 3. Remove G1 promo patterns line by line or paragraph by paragraph
  for (const pattern of G1_SCRAPER_CONFIG.promoPatterns) {
    content = content.replace(pattern, '');
  }

  // Additional specific G1 phrase removals
  content = content
    .replace(/Participe do canal do g1.*$/gim, '')
    .replace(/Receba as notícias do g1.*$/gim, '')
    .replace(/Veja mais notícias da região no g1.*$/gim, '')
    .replace(/Veja mais notícias no g1.*$/gim, '')
    .replace(/VÍDEOS: veja tudo sobre.*$/gim, '')
    .replace(/VÍDEOS: Tudo sobre a região.*$/gim, '');

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

  // 6. Generate clean excerpt (first 200 chars or first paragraph)
  const paragraphs = cleanedText.split('\n\n');
  const excerptCandidate = paragraphs[0] || '';
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
    author: raw.author || 'g1 Presidente Prudente',
    publishedAt: raw.publishedAt || new Date().toISOString(),
    imageUrl: raw.imageUrl,
    category: 'Geral',
    tags: ['G1', 'Presidente Prudente', 'Notícias Locais'],
  };
}

