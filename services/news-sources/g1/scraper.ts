import { INewsSource } from '../core/interface';
import {
  NewsSourceMetadata,
  RawNewsArticle,
  ProcessedNewsArticle,
  ScraperResult,
} from '../core/types';
import { validateProcessedArticle } from '../core/validators';
import { G1_CONFIG, G1_SCRAPER_CONFIG } from './config';
import { parseG1RssFeed, parseG1Article } from './parser';
import { cleanG1Article } from './cleaner';

export class G1NewsSource implements INewsSource {
  metadata: NewsSourceMetadata = G1_CONFIG;

  /**
   * Fetches the latest articles from G1 Presidente Prudente RSS feed
   */
  async fetchNews(): Promise<ScraperResult> {
    const scrapedAt = new Date().toISOString();
    const errors: string[] = [];
    let articles: RawNewsArticle[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        G1_SCRAPER_CONFIG.timeoutMs
      );

      const response = await fetch(G1_SCRAPER_CONFIG.rssFeedUrl, {
        headers: G1_SCRAPER_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao acessar RSS do G1: ${response.statusText}`
        );
      }

      const xmlText = await response.text();
      articles = parseG1RssFeed(xmlText).slice(
        0,
        G1_SCRAPER_CONFIG.maxArticlesPerCrawl
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Falha desconhecida na busca do RSS G1';
      errors.push(errorMsg);
    }

    return {
      sourceId: this.metadata.id,
      scrapedAt,
      articlesFound: articles.length,
      articles,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Fetches full HTML article from G1 URL and extracts raw structure
   */
  async fetchArticleContent(url: string): Promise<RawNewsArticle> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        G1_SCRAPER_CONFIG.timeoutMs
      );

      const response = await fetch(url, {
        headers: G1_SCRAPER_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao carregar artigo G1`);
      }

      const html = await response.text();
      return parseG1Article(html, url);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Erro no download do artigo G1';
      return {
        sourceId: this.metadata.id,
        originalUrl: url,
        title: 'Artigo indisponível',
        rawContent: `[Erro na captura: ${errorMsg}]`,
        publishedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleans raw G1 article content removing ads and WhatsApp links
   */
  clean(rawArticle: RawNewsArticle): ProcessedNewsArticle {
    return cleanG1Article(rawArticle);
  }

  /**
   * Normalizes fields into standard system format
   */
  normalize(article: ProcessedNewsArticle): ProcessedNewsArticle {
    let validDate = article.publishedAt;
    try {
      const parsedDate = new Date(article.publishedAt);
      if (!isNaN(parsedDate.getTime())) {
        validDate = parsedDate.toISOString();
      } else {
        validDate = new Date().toISOString();
      }
    } catch {
      validDate = new Date().toISOString();
    }

    const normalized: ProcessedNewsArticle = {
      ...article,
      title: article.title.trim(),
      cleanedContent: article.cleanedContent.trim(),
      excerpt: article.excerpt.trim(),
      publishedAt: validDate,
      category: article.category || 'Geral',
      tags: Array.from(
        new Set([...(article.tags || []), 'G1', 'Presidente Prudente'])
      ),
    };

    if (!validateProcessedArticle(normalized)) {
      console.warn(`[G1 Scraper] Artigo pré-processado pode estar incompleto: ${article.originalUrl}`);
    }

    return normalized;
  }
}

