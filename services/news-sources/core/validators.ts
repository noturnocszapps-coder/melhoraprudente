/**
 * Reusable Validators for News Sources Core
 */

import { RawNewsArticle, ProcessedNewsArticle } from './types';

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateRawArticle(article: Partial<RawNewsArticle>): boolean {
  if (!article.originalUrl || !isValidUrl(article.originalUrl)) {
    return false;
  }
  if (!article.title || article.title.trim().length === 0) {
    return false;
  }
  if (!article.rawContent || article.rawContent.trim().length === 0) {
    return false;
  }
  return true;
}

export function validateProcessedArticle(
  article: Partial<ProcessedNewsArticle>
): boolean {
  if (!article.originalUrl || !isValidUrl(article.originalUrl)) {
    return false;
  }
  if (!article.title || article.title.trim().length === 0) {
    return false;
  }
  if (!article.cleanedContent || article.cleanedContent.trim().length === 0) {
    return false;
  }
  return true;
}
