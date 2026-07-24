/**
 * Types for AI Processing Layer
 */

export interface AIInput {
  title?: string;
  cleanedText: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface AIOutput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
}

export interface StructuredAIContent {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  processedAt?: string;
  model?: string;
}

