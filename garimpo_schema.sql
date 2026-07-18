-- ============================================================================
-- PROJETO: Melhora Prudente
-- ARQUIVO: garimpo_schema.sql
-- OBJETIVO: Criação da tabela de candidatos a notícias (Garimpo de Notícias por IA)
-- CARACTERÍSTICAS: Idempotente, RLS ativo, índices otimizados
-- ============================================================================

-- 1. Criação da tabela de candidatos se não existir
CREATE TABLE IF NOT EXISTS public.news_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  external_id TEXT NOT NULL,
  original_url TEXT UNIQUE NOT NULL,
  original_title TEXT NOT NULL,
  original_excerpt TEXT,
  original_image_url TEXT,
  original_published_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  
  -- Campos gerados por Inteligência Artificial (Gemini)
  ai_title TEXT,
  ai_summary TEXT,
  ai_category TEXT,
  ai_relevance_score INTEGER CHECK (ai_relevance_score BETWEEN 0 AND 100),
  ai_regional_impact_score INTEGER CHECK (ai_regional_impact_score BETWEEN 0 AND 100),
  ai_viral_potential_score INTEGER CHECK (ai_viral_potential_score BETWEEN 0 AND 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Criação de índices para otimização de busca e filtragem na fila editorial
CREATE INDEX IF NOT EXISTS news_candidates_status_collected_at_idx ON public.news_candidates (status, collected_at DESC);
CREATE INDEX IF NOT EXISTS news_candidates_external_id_idx ON public.news_candidates (source_name, external_id);

-- 3. Ativação do Row Level Security (RLS)
ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;

-- 4. Criação de políticas de acesso (segurança de dados)
-- Admins e editores possuem acesso total a tabela
CREATE POLICY "Admins and editors can select news_candidates" ON public.news_candidates
  FOR SELECT USING (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can insert news_candidates" ON public.news_candidates
  FOR INSERT WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update news_candidates" ON public.news_candidates
  FOR UPDATE USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can delete news_candidates" ON public.news_candidates
  FOR DELETE USING (get_role(auth.uid()) IN ('admin', 'editor'));
