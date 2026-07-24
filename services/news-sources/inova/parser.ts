import { RawNewsArticle } from '../core/types';
import { INOVA_CONFIG, INOVA_SCRAPER_CONFIG } from './config';

/**
 * Parses news items from the Inova Prudente news list page
 */
export function parseInovaNoticiasList(html: string): RawNewsArticle[] {
  const articles: RawNewsArticle[] = [];
  const seenUrls = new Set<string>();

  // Match links like https://inovaprudente.com.br/noticias/slug.html
  const linkRegex = /<a[^>]+href=["']([^"']*(?:noticias\/|\/noticias\/)[^"']+\.html)["'][^>]*title=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1];
    const title = match[2].replace(/<[^>]+>/g, '').trim();

    if (!url.startsWith('http')) {
      if (!url.startsWith('/')) {
        url = '/' + url;
      }
      url = `${INOVA_SCRAPER_CONFIG.siteBaseUrl}${url}`;
    }

    if (!seenUrls.has(url) && title.length > 5 && !title.toLowerCase().includes('saiba mais')) {
      seenUrls.add(url);
      articles.push({
        sourceId: INOVA_CONFIG.id,
        originalUrl: url,
        title,
        rawContent: title,
        publishedAt: new Date().toISOString(),
      });
    }
  }

  // Fallback extraction if title attribute was not present
  if (articles.length === 0) {
    const altRegex = /<a[^>]+href=["'](https?:\/\/(?:www\.)?inovaprudente\.com\.br\/noticias\/[a-z0-9-]+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let altMatch;
    while ((altMatch = altRegex.exec(html)) !== null) {
      const url = altMatch[1];
      const title = altMatch[2].replace(/<[^>]+>/g, '').trim();

      if (!seenUrls.has(url) && title.length > 10 && !title.toLowerCase().includes('saiba mais') && title !== 'Notícias') {
        seenUrls.add(url);
        articles.push({
          sourceId: INOVA_CONFIG.id,
          originalUrl: url,
          title,
          rawContent: title,
          publishedAt: new Date().toISOString(),
        });
      }
    }
  }

  return articles;
}

/**
 * Parses full HTML page of a single Inova Prudente article
 */
export function parseInovaArticle(html: string, url: string): RawNewsArticle {
  // Title extraction from meta og:title or <h1>
  const ogTitleMatch = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(html);
  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);

  const rawTitle = ogTitleMatch?.[1] || h1Match?.[1] || '';
  const title = rawTitle
    .replace(/<[^>]+>/g, '')
    .replace(/\s*-\s*Inova Prudente$/i, '')
    .replace(/\s*\|\s*Inova Prudente$/i, '')
    .trim();

  // Excerpt from og:description
  const ogDescMatch = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i.exec(html);
  const excerpt = ogDescMatch?.[1]?.replace(/<[^>]+>/g, '').trim();

  // Image extraction from og:image
  const ogImgMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
  let imageUrl = ogImgMatch?.[1] || undefined;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${INOVA_SCRAPER_CONFIG.siteBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  // Date published extraction (e.g. DD/MM/YYYY)
  const dateMatch = html.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  let publishedAt = new Date().toISOString();
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const year = Number(dateMatch[3]);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) {
      publishedAt = d.toISOString();
    }
  }

  // Author extraction
  const authorMatch = /Por:\s*([^\n<]+)/i.exec(html);
  const author = authorMatch?.[1]?.trim() || 'Assessoria de Comunicação Inova Prudente';

  // Extract body paragraphs (<p>)
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let pMatch;

  while ((pMatch = pRegex.exec(html)) !== null) {
    const pContent = pMatch[1].trim();
    const cleanP = pContent.replace(/<[^>]+>/g, '').trim();

    // Filter out menu/navigation/footer paragraphs
    if (
      cleanP.length > 15 &&
      !cleanP.includes('Toggle navigation') &&
      !cleanP.includes('INSTITUCIONAL') &&
      !cleanP.includes('Acompanhe as ações') &&
      !cleanP.includes('Inova Prudente Kids') &&
      !cleanP.includes('Transparência') &&
      !cleanP.includes('Conheça a Inova')
    ) {
      paragraphs.push(pContent);
    }
  }

  const rawContent = paragraphs.length > 0 ? paragraphs.join('\n\n') : html;

  return {
    sourceId: INOVA_CONFIG.id,
    originalUrl: url,
    title: title || 'Notícia Inova Prudente',
    rawContent,
    excerpt,
    author,
    publishedAt,
    imageUrl,
  };
}

