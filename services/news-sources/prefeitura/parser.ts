import { RawNewsArticle } from '../core/types';
import { PREFEITURA_CONFIG, PREFEITURA_SCRAPER_CONFIG } from './config';

/**
 * Parses news items from the Prefeitura de Presidente Prudente news list page
 */
export function parsePrefeituraNoticiasList(html: string): RawNewsArticle[] {
  const articles: RawNewsArticle[] = [];
  const seenUrls = new Set<string>();

  // Regex to match links like /site/noticia/67214
  const linkRegex = /<a[^>]+href=["']([^"']*(?:noticia\/|\/noticia\/)[^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let relativeUrl = match[1];
    const title = match[2].replace(/<[^>]+>/g, '').trim();

    if (!relativeUrl.startsWith('http')) {
      if (!relativeUrl.startsWith('/')) {
        relativeUrl = '/' + relativeUrl;
      }
      relativeUrl = `${PREFEITURA_SCRAPER_CONFIG.siteBaseUrl}${relativeUrl}`;
    }

    if (!seenUrls.has(relativeUrl) && title.length > 5) {
      seenUrls.add(relativeUrl);
      articles.push({
        sourceId: PREFEITURA_CONFIG.id,
        originalUrl: relativeUrl,
        title,
        rawContent: title,
        publishedAt: new Date().toISOString(),
      });
    }
  }

  // Fallback link extraction if title attribute was not present
  if (articles.length === 0) {
    const altLinkRegex = /<a[^>]+href=["']([^"']*(?:noticia\/|\/noticia\/)\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let altMatch;
    while ((altMatch = altLinkRegex.exec(html)) !== null) {
      let relativeUrl = altMatch[1];
      const title = altMatch[2].replace(/<[^>]+>/g, '').trim();

      if (!relativeUrl.startsWith('http')) {
        if (!relativeUrl.startsWith('/')) {
          relativeUrl = '/' + relativeUrl;
        }
        relativeUrl = `${PREFEITURA_SCRAPER_CONFIG.siteBaseUrl}${relativeUrl}`;
      }

      if (!seenUrls.has(relativeUrl) && title.length > 5) {
        seenUrls.add(relativeUrl);
        articles.push({
          sourceId: PREFEITURA_CONFIG.id,
          originalUrl: relativeUrl,
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
 * Parses full HTML page of a single Prefeitura news article
 */
export function parsePrefeituraArticle(html: string, url: string): RawNewsArticle {
  // Title extraction from meta og:title or <h1>
  const ogTitleMatch = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(html);
  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);

  const rawTitle = ogTitleMatch?.[1] || h1Match?.[1] || '';
  const title = rawTitle.replace(/<[^>]+>/g, '').replace(/Secretaria.*$/i, '').trim();

  // Image extraction from og:image
  const ogImgMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
  let imageUrl = ogImgMatch?.[1] || undefined;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${PREFEITURA_SCRAPER_CONFIG.siteBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  // Date published extraction (e.g., Quinta-feira, 23 de Julho de 2026 or DD/MM/YYYY)
  const dateTextMatch = html.match(/(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)-feira,\s*\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}/i);
  const dateDigitsMatch = html.match(/\d{2}\/\d{2}\/\d{4}/);

  let publishedAt = new Date().toISOString();
  if (dateDigitsMatch) {
    const [day, month, year] = dateDigitsMatch[0].split('/');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) {
      publishedAt = d.toISOString();
    }
  }

  // Extract body paragraphs (<p>)
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let pMatch;

  while ((pMatch = pRegex.exec(html)) !== null) {
    const pContent = pMatch[1].replace(/<[^>]+>/g, '').trim();
    // Exclude header navigation / footer date / copyright lines
    if (
      pContent.length > 20 &&
      !pContent.includes('Prefeitura Municipal de Presidente Prudente') &&
      !pContent.includes('Todos os direitos reservados') &&
      !pContent.includes('Desenvolvido por')
    ) {
      paragraphs.push(pContent);
    }
  }

  const rawContent = paragraphs.length > 0 ? paragraphs.join('\n\n') : html;

  return {
    sourceId: PREFEITURA_CONFIG.id,
    originalUrl: url,
    title: title || 'Notícia Prefeitura',
    rawContent,
    author: 'Secom Presidente Prudente',
    publishedAt,
    imageUrl,
  };
}

