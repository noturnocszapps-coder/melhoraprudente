import { RawNewsArticle, ProcessedNewsArticle } from '../core/types';
import { INOVA_SCRAPER_CONFIG } from './config';

/**
 * Decodes common HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&oacute;/gi, 'ó')
    .replace(/&Oacute;/gi, 'Ó')
    .replace(/&aacute;/gi, 'á')
    .replace(/&Aacute;/gi, 'Á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/gi, 'É')
    .replace(/&iacute;/gi, 'í')
    .replace(/&Iacute;/gi, 'Í')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&Uacute;/gi, 'Ú')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Ccedil;/gi, 'Ç')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&Atilde;/gi, 'Ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&Otilde;/gi, 'Õ')
    .replace(/&acirc;/gi, 'â')
    .replace(/&Acirc;/gi, 'Â')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&Ecirc;/gi, 'Ê')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&Ocirc;/gi, 'Ô')
    .replace(/&agrave;/gi, 'à')
    .replace(/&Agrave;/gi, 'À')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'");
}

/**
 * Cleans raw article content from Inova Prudente
 */
export function cleanInovaArticle(raw: RawNewsArticle): ProcessedNewsArticle {
  let content = raw.rawContent || '';

  // 1. Remove CDATA wrappers
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');

  // 2. Remove script, style, and iframe tags
  content = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // 3. Remove promo patterns
  for (const pattern of INOVA_SCRAPER_CONFIG.promoPatterns) {
    content = content.replace(pattern, '');
  }

  // 4. Strip HTML tags and decode HTML entities
  let cleanedText = content
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  cleanedText = decodeHtmlEntities(cleanedText);

  // 5. Clean up multiple empty lines and leading/trailing spaces
  cleanedText = cleanedText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n')
    .trim();

  // 6. Title cleaning and entity decoding
  const cleanTitle = decodeHtmlEntities(raw.title || '').trim();

  // 7. Generate clean excerpt
  const paragraphs = cleanedText.split('\n\n');
  const excerptCandidate = paragraphs.find((p) => p.length > 30) || paragraphs[0] || '';
  const excerpt =
    raw.excerpt && raw.excerpt.length > 10
      ? decodeHtmlEntities(raw.excerpt.replace(/<[^>]+>/g, '')).trim()
      : excerptCandidate.length > 220
      ? excerptCandidate.slice(0, 217) + '...'
      : excerptCandidate;

  return {
    sourceId: raw.sourceId,
    originalUrl: raw.originalUrl,
    title: cleanTitle,
    cleanedContent: cleanedText,
    excerpt,
    author: raw.author ? decodeHtmlEntities(raw.author) : 'Assessoria de Comunicação Inova Prudente',
    publishedAt: raw.publishedAt || new Date().toISOString(),
    imageUrl: raw.imageUrl,
    category: 'Inovação & Tecnologia',
    tags: ['Inova Prudente', 'Tecnologia', 'Inovação', 'Presidente Prudente'],
  };
}

