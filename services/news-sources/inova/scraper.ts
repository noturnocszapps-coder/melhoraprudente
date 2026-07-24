import { INewsSource } from '../core/interface';
import {
  NewsSourceMetadata,
  RawNewsArticle,
  ProcessedNewsArticle,
  ScraperResult,
} from '../core/types';
import { validateProcessedArticle } from '../core/validators';
import { INOVA_CONFIG, INOVA_SCRAPER_CONFIG } from './config';
import { parseInovaNoticiasList, parseInovaArticle } from './parser';
import { cleanInovaArticle } from './cleaner';

export class InovaNewsSource implements INewsSource {
  metadata: NewsSourceMetadata = INOVA_CONFIG;

  /**
   * Fetches latest news items from Inova Prudente news list page
   */
  async fetchNews(): Promise<ScraperResult> {
    const scrapedAt = new Date().toISOString();
    const errors: string[] = [];
    let articles: RawNewsArticle[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        INOVA_SCRAPER_CONFIG.timeoutMs
      );

      const response = await fetch(INOVA_SCRAPER_CONFIG.noticiasUrl, {
        headers: INOVA_SCRAPER_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao acessar portal da Inova Prudente: ${response.statusText}`
        );
      }

      const html = await response.text();
      articles = parseInovaNoticiasList(html).slice(
        0,
        INOVA_SCRAPER_CONFIG.maxArticlesPerCrawl
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Falha desconhecida ao buscar notícias da Inova Prudente';
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
        INOVA_SCRAPER_CONFIG.timeoutMs
      );

      const response = await fetch(url, {
        headers: INOVA_SCRAPER_CONFIG.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao carregar artigo da Inova Prudente`
        );
      }

      const html = await response.text();
      return parseInovaArticle(html, url);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Erro no download do artigo da Inova Prudente';
      return {
        sourceId: this.metadata.id,
        originalUrl: url,
        title: 'Artigo Inova Indisponível',
        rawContent: `[Erro na captura: ${errorMsg}]`,
        publishedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleans raw Inova article content
   */
  clean(rawArticle: RawNewsArticle): ProcessedNewsArticle {
    return cleanInovaArticle(rawArticle);
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
      category: article.category || 'Inovação & Tecnologia',
      tags: Array.from(
        new Set([
          ...(article.tags || []),
          'Inova Prudente',
          'Tecnologia',
          'Inovação',
          'Presidente Prudente',
        ])
      ),
    };

    if (!validateProcessedArticle(normalized)) {
      console.warn(
        `[Inova Scraper] Artigo pré-processado pode estar incompleto: ${article.originalUrl}`
      );
    }

    return normalized;
  }
}

