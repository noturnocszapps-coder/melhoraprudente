import { supabase } from '../../lib/supabase';
import { aiService } from '../ai';
import {
  G1NewsSource,
  PrefeituraNewsSource,
  InovaNewsSource,
  ProcessedNewsArticle,
  NewsCandidate,
  NewsCandidateStatus,
  AIContentPayload,
  SourceMetadata,
} from '../news-sources';

export interface GarimpoPipelineResult {
  sourceId: string;
  processedCount: number;
  candidates: NewsCandidate[];
  errors: string[];
}

export class GarimpoPipeline {
  private g1 = new G1NewsSource();
  private prefeitura = new PrefeituraNewsSource();
  private inova = new InovaNewsSource();

  /**
   * Helper to map source ID to source metadata name
   */
  private getSourceName(sourceId: string): string {
    switch (sourceId.toLowerCase()) {
      case 'g1':
        return 'G1 Presidente Prudente e Região';
      case 'prefeitura':
        return 'Prefeitura de Presidente Prudente';
      case 'inova':
        return 'Inova Prudente';
      default:
        return sourceId;
    }
  }

  /**
   * 1. Ingests a clean scraped article into news_candidates with status 'pending_ai'
   */
  async ingestArticle(article: ProcessedNewsArticle): Promise<NewsCandidate> {
    const sourceName = this.getSourceName(article.sourceId);

    const sourceMetadata: SourceMetadata = {
      source_name: sourceName,
      original_url: article.originalUrl,
      author: article.author || 'Redação',
      published_at: article.publishedAt || new Date().toISOString(),
      image_url: article.imageUrl || '',
      parser_version: '1.0',
      category_hint: article.category || 'Geral',
    };

    const candidateRecord = {
      original_url: article.originalUrl,
      source_id: article.sourceId,
      status: 'pending_ai' as NewsCandidateStatus,
      original_content: article.cleanedContent,
      source_metadata: sourceMetadata as any,
      // Legacy fields for full backward compatibility
      ai_title: article.title,
      ai_summary: article.excerpt || article.title.slice(0, 200),
      ai_category: article.category || 'Geral',
      source_name: sourceName,
      updated_at: new Date().toISOString(),
    };

    // Upsert into Supabase news_candidates by original_url if possible, or insert
    const { data, error } = await supabase
      .from('news_candidates')
      .upsert(candidateRecord, { onConflict: 'original_url' })
      .select()
      .single();

    if (error) {
      console.error('[GarimpoPipeline] Erro ao salvar candidato em news_candidates:', error.message);
      // Fallback: Return in-memory construct if database insert failed due to constraints/RLS
      return {
        id: `local-${Date.now()}`,
        ...candidateRecord,
        created_at: new Date().toISOString(),
      } as NewsCandidate;
    }

    return data as NewsCandidate;
  }

  /**
   * 2. Processes a candidate through AI Service and updates its status to 'ai_processed'
   */
  async processCandidateWithAI(candidate: NewsCandidate): Promise<NewsCandidate> {
    const title = candidate.ai_title || (candidate.source_metadata?.source_name ? `Notícia ${candidate.source_metadata.source_name}` : 'Notícia');
    const cleanedText = candidate.original_content || candidate.ai_summary || '';

    try {
      console.log(`[GarimpoPipeline] Enviando candidato '${candidate.id}' (${candidate.original_url}) para o AI Service...`);
      
      const aiOutput = await aiService.processArticle({
        title,
        cleanedText,
        sourceId: candidate.source_id,
        metadata: candidate.source_metadata,
      });

      const aiContentPayload: AIContentPayload = {
        title: aiOutput.title,
        excerpt: aiOutput.excerpt,
        content: aiOutput.content,
        category: aiOutput.category,
        tags: aiOutput.tags,
        processed_at: new Date().toISOString(),
      };

      const updateData = {
        ai_content: aiContentPayload as any,
        status: 'ai_processed' as NewsCandidateStatus,
        // Sync legacy fields
        ai_title: aiOutput.title,
        ai_summary: aiOutput.excerpt,
        ai_category: aiOutput.category,
        updated_at: new Date().toISOString(),
      };

      if (candidate.id && !candidate.id.startsWith('local-')) {
        const { data, error } = await supabase
          .from('news_candidates')
          .update(updateData)
          .eq('id', candidate.id)
          .select()
          .single();

        if (!error && data) {
          return data as NewsCandidate;
        }
      }

      return {
        ...candidate,
        ...updateData,
      } as NewsCandidate;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[GarimpoPipeline] Erro de processamento IA no candidato ${candidate.id}:`, errorMsg);
      // Keep original_content saved, log error, leave status as pending_ai
      return candidate;
    }
  }

  /**
   * 3. Runs complete pipeline for a single article (Scrapes -> Ingests -> AI Processing -> Updated Candidate)
   */
  async processSingleArticle(article: ProcessedNewsArticle): Promise<NewsCandidate> {
    const ingestedCandidate = await this.ingestArticle(article);
    const aiProcessedCandidate = await this.processCandidateWithAI(ingestedCandidate);
    return aiProcessedCandidate;
  }

  /**
   * 4. Runs full Garimpo pipeline for a news source ('g1', 'prefeitura', 'inova')
   */
  async runSourcePipeline(sourceId: 'g1' | 'prefeitura' | 'inova', limit = 3): Promise<GarimpoPipelineResult> {
    const errors: string[] = [];
    const candidates: NewsCandidate[] = [];

    console.log(`[GarimpoPipeline] Iniciando pipeline para fonte '${sourceId}'...`);

    let articles: ProcessedNewsArticle[] = [];

    try {
      if (sourceId === 'g1') {
        const fetchResult = await this.g1.fetchNews();
        for (const raw of fetchResult.articles.slice(0, limit)) {
          const rawContent = await this.g1.fetchArticleContent(raw.originalUrl);
          const cleaned = this.g1.clean(rawContent);
          articles.push(cleaned);
        }
      } else if (sourceId === 'prefeitura') {
        const fetchResult = await this.prefeitura.fetchNews();
        for (const raw of fetchResult.articles.slice(0, limit)) {
          const rawContent = await this.prefeitura.fetchArticleContent(raw.originalUrl);
          const cleaned = this.prefeitura.clean(rawContent);
          articles.push(cleaned);
        }
      } else if (sourceId === 'inova') {
        const fetchResult = await this.inova.fetchNews();
        for (const raw of fetchResult.articles.slice(0, limit)) {
          const rawContent = await this.inova.fetchArticleContent(raw.originalUrl);
          const cleaned = this.inova.clean(rawContent);
          articles.push(cleaned);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Erro na raspagem da fonte ${sourceId}: ${msg}`);
      console.error(msg);
    }

    for (const article of articles) {
      try {
        const candidate = await this.processSingleArticle(article);
        candidates.push(candidate);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Erro no processamento da matéria ${article.originalUrl}: ${msg}`);
      }
    }

    return {
      sourceId,
      processedCount: candidates.length,
      candidates,
      errors,
    };
  }
}

export const garimpoPipeline = new GarimpoPipeline();
