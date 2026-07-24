import { INewsSource } from '../core/interface';
import {
  NewsSourceMetadata,
  RawNewsArticle,
  ProcessedNewsArticle,
  ScraperResult,
} from '../core/types';
import { validateProcessedArticle } from '../core/validators';
import { PREFEITURA_CONFIG, PREFEITURA_SCRAPER_CONFIG } from './config';
import { parsePrefeituraNoticiasList, parsePrefeituraArticle } from './parser';
import { cleanPrefeituraArticle } from './cleaner';

export class PrefeituraNewsSource implements INewsSource {
  metadata: NewsSourceMetadata = PREFEITURA_CONFIG;

  /**
   * Fetches latest news items from Prefeitura Municipal de Presidente Prudente news page
   */
  async fetchNews(): Promise<ScraperResult> {
    const scrapedAt = new Date().toISOString();
    const errors: string[] = [];
    let articles: RawNewsArticle[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        PREFEITURA_SCRAPER_CONFIG.timeoutMs
      );

      const response = await fetch(PREFEITURA_SCRAPER_CONFIG.noticiasUrl, {
        headers: PREFEITURA_SCRAPER_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao acessar portal da Prefeitura: ${response.statusText}`
        );
      }

      const html = await response.text();
      articles = parsePrefeituraNoticiasList(html).slice(
        0,
        PREFEITURA_SCRAPER_CONFIG.maxArticlesPerCrawl
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Falha desconhecida ao buscar notícias da Prefeitura';
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
   * Fetches full article page and extracts raw structured content
   */
  async fetchArticleContent(url: string): Promise<RawNewsArticle> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        PREFEITURA_SCRAPER_CONFIG.timeoutMs
      );

      const response = await fetch(url, {
        headers: PREFEITURA_SCRAPER_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao carregar artigo da Prefeitura`
        );
      }

      const html = await response.text();
      return parsePrefeituraArticle(html, url);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Erro no download do artigo da Prefeitura';
      return {
        sourceId: this.metadata.id,
        originalUrl: url,
        title: 'Artigo Prefeitura Indisponível',
        rawContent: `[Erro na captura: ${errorMsg}]`,
        publishedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleans raw Prefeitura article content
   */
  clean(rawArticle: RawNewsArticle): ProcessedNewsArticle {
    return cleanPrefeituraArticle(rawArticle);
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
      category: article.category || 'Oficial',
      tags: Array.from(
        new Set([
          ...(article.tags || []),
          'Prefeitura',
          'Presidente Prudente',
          'Governo Municipal',
        ])
      ),
    };

    if (!validateProcessedArticle(normalized)) {
      console.warn(
        `[Prefeitura Scraper] Artigo pré-processado pode estar incompleto: ${article.originalUrl}`
      );
    }

    return normalized;
  }
}

