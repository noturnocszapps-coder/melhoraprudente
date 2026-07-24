import { GoogleGenAI } from '@google/genai';
import { EDITORIAL_SYSTEM_PROMPT, buildSummarizePrompt } from './prompts';
import { AIEditorialResponseSchema } from './schemas';
import { AIInput, AIOutput } from './types';

export class GeminiAIService {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI | null {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('[GeminiAIService] GEMINI_API_KEY não configurada no ambiente.');
        return null;
      }
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Processes clean article text using Gemini API and returns structured editorial output
   */
  async processArticle(input: AIInput): Promise<AIOutput> {
    const { title, cleanedText, sourceId } = input;

    // Fallback if cleaned text is missing or extremely short
    if (!cleanedText || cleanedText.trim().length < 15) {
      return {
        title: title || 'Notícia sem título',
        excerpt: title || 'Conteúdo insuficiente para síntese.',
        content: cleanedText || title || '',
        category: 'Geral',
        tags: sourceId ? [sourceId] : ['Notícia'],
      };
    }

    const ai = this.getClient();

    if (!ai) {
      console.warn('[GeminiAIService] Usando fallback sem IA por ausência de chave de API.');
      return this.buildFallbackOutput(title, cleanedText, sourceId);
    }

    try {
      const prompt = buildSummarizePrompt(cleanedText, title);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: EDITORIAL_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const rawJson = JSON.parse(text);

      const parsed = AIEditorialResponseSchema.parse(rawJson);

      return {
        title: parsed.title,
        excerpt: parsed.excerpt,
        content: parsed.content,
        category: parsed.category || 'Geral',
        tags: parsed.tags || [],
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[GeminiAIService] Erro no processamento Gemini AI:', errorMsg);

      // Return structured fallback so raw content is preserved and reprocessing remains possible
      return this.buildFallbackOutput(title, cleanedText, sourceId);
    }
  }

  private buildFallbackOutput(title: string | undefined, cleanedText: string, sourceId?: string): AIOutput {
    const paragraphs = cleanedText.split('\n\n').filter((p) => p.trim().length > 0);
    const fallbackTitle = title || paragraphs[0]?.slice(0, 80) || 'Notícia Local';
    const fallbackExcerpt = paragraphs[0]?.slice(0, 200) || fallbackTitle;

    return {
      title: fallbackTitle.trim(),
      excerpt: fallbackExcerpt.trim(),
      content: cleanedText.trim(),
      category: 'Geral',
      tags: sourceId ? ['Presidente Prudente', sourceId] : ['Presidente Prudente'],
    };
  }
}

export const aiService = new GeminiAIService();
