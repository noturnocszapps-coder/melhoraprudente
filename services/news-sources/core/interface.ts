/**
 * Contract Interface for Melhora Prudente News Sources
 */

import {
  NewsSourceMetadata,
  RawNewsArticle,
  ProcessedNewsArticle,
  ScraperResult,
} from './types';

export interface INewsSource {
  metadata: NewsSourceMetadata;

  /**
   * Fetches the latest news list/feed from the source
   */
  fetchNews(): Promise<ScraperResult>;

  /**
   * Fetches full article content for a specific URL
   */
  fetchArticleContent(url: string): Promise<RawNewsArticle>;

  /**
   * Cleans raw HTML / raw text content
   */
  clean(rawArticle: RawNewsArticle): ProcessedNewsArticle;

  /**
   * Normalizes fields into standard system format
   */
  normalize(article: ProcessedNewsArticle): ProcessedNewsArticle;
}
