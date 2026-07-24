import { RawNewsArticle } from '../core/types';
import { G1_CONFIG } from './config';

/**
 * Extracts items from G1 RSS XML feed
 */
export function parseG1RssFeed(xmlText: string): RawNewsArticle[] {
  const articles: RawNewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i.exec(itemXml);
    const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();

    const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemXml);
    const link = (linkMatch?.[1] || '').trim();

    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemXml);
    const pubDate = (pubDateMatch?.[1] || '').trim();

    const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i.exec(itemXml);
    const descriptionRaw = descMatch?.[1] || descMatch?.[2] || '';

    // Extract image enclosure or img src inside description
    const imgMatch = /<media:content[^>]+url=["']([^"']+)["']|<enclosure[^>]+url=["']([^"']+)["']|<img[^>]+src=["']([^"']+)["']/i.exec(itemXml + descriptionRaw);
    const imageUrl = imgMatch?.[1] || imgMatch?.[2] || imgMatch?.[3] || undefined;

    if (link && title) {
      articles.push({
        sourceId: G1_CONFIG.id,
        originalUrl: link,
        title,
        rawContent: descriptionRaw,
        excerpt: descriptionRaw.replace(/<[^>]+>/g, '').trim().slice(0, 200),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        imageUrl,
      });
    }
  }

  return articles;
}

/**
 * Parses full HTML page of a G1 article
 */
export function parseG1Article(html: string, url: string): RawNewsArticle {
  // Title extraction
  const titleMatch =
    /<h1[^>]*itemprop=["']headline["'][^>]*>([\s\S]*?)<\/h1>|<h1[^>]*class=["'][^"']*content-head__title[^"']*["'][^>]*>([\s\S]*?)<\/h1>|<title>([\s\S]*?)<\/title>/i.exec(
      html
    );
  const titleRaw = titleMatch?.[1] || titleMatch?.[2] || titleMatch?.[3] || '';
  const title = titleRaw.replace(/<[^>]+>/g, '').replace(/\| g1.*$/i, '').trim();

  // Image extraction
  const ogImgMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html);
  const imageUrl = ogImgMatch?.[1] || undefined;

  // Date published
  const dateMatch =
    /<time[^>]*datetime=["']([^"']+)["']|<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i.exec(
      html
    );
  const publishedAt = dateMatch?.[1] || dateMatch?.[2] || new Date().toISOString();

  // Author
  const authorMatch = /<p[^>]*class=["'][^"']*content-publication-data__author[^"']*["'][^>]*>([\s\S]*?)<\/p>|<span[^>]*itemprop=["']author["'][^>]*>([\s\S]*?)<\/span>/i.exec(
    html
  );
  const author = (authorMatch?.[1] || authorMatch?.[2] || '').replace(/<[^>]+>/g, '').trim() || 'g1 Presidente Prudente';

  // Extract body paragraphs
  const pRegex = /<p[^>]*class=["'][^"']*content-text__container[^"']*["'][^>]*>([\s\S]*?)<\/p>|<p>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let pMatch;

  while ((pMatch = pRegex.exec(html)) !== null) {
    const pContent = pMatch[1] || pMatch[2];
    if (pContent) {
      paragraphs.push(pContent);
    }
  }

  const rawContent = paragraphs.length > 0 ? paragraphs.join('\n\n') : html;

  return {
    sourceId: G1_CONFIG.id,
    originalUrl: url,
    title,
    rawContent,
    author,
    publishedAt,
    imageUrl,
  };
}

