/**
 * Core Types for Melhora Prudente News Sources
 */

export type NewsSourceId = 'g1' | 'prefeitura' | 'inova' | string;

export interface NewsSourceMetadata {
  id: NewsSourceId;
  name: string;
  baseUrl: string;
  category: string;
  isActive: boolean;
  crawlIntervalMinutes?: number;
}

export interface RawNewsArticle {
  sourceId: NewsSourceId;
  originalUrl: string;
  title: string;
  rawContent: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessedNewsArticle {
  sourceId: NewsSourceId;
  originalUrl: string;
  title: string;
  cleanedContent: string;
  excerpt: string;
  author?: string;
  publishedAt: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScraperResult {
  sourceId: NewsSourceId;
  scrapedAt: string;
  articlesFound: number;
  articles: RawNewsArticle[];
  errors?: string[];
}

/**
 * Status de candidatos a notícia no Garimpo / Pipeline
 */
export type NewsCandidateStatus =
  | 'pending'
  | 'pending_ai'
  | 'ai_processed'
  | 'approved'
  | 'rejected';

/**
 * Metadados estendidos da fonte de notícia
 */
export interface SourceMetadata {
  source_name?: string;
  original_url?: string;
  author?: string;
  published_at?: string;
  image_url?: string;
  parser_version?: string;
  [key: string]: unknown;
}

/**
 * Estrutura de conteúdo gerado pela IA no candidato
 */
export interface AIContentPayload {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Modelo completo do Candidato a Notícia (tabela news_candidates)
 */
export interface NewsCandidate {
  id: string;
  original_url: string;
  source_id: string;
  status: NewsCandidateStatus;

  // Campos legados mantidos para 100% de retrocompatibilidade
  ai_title?: string;
  ai_summary?: string;
  ai_category?: string;
  ai_relevance_score?: number;
  ai_viral_potential_score?: number;
  ai_regional_impact_score?: number;
  source_name?: string;

  // Novos campos incrementais da Fase 4.2
  original_content?: string;
  ai_content?: AIContentPayload;
  source_metadata?: SourceMetadata;

  created_at: string;
  updated_at: string;
  approved_at?: string;
}

