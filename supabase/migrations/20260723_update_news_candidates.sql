-- ==============================================================================
-- MIGRATION: 20260723_update_news_candidates.sql
-- PROJETO: Melhora Prudente
-- OBJETIVO: Evolução incremental da tabela news_candidates para suporte ao
--           pipeline modular de Scrapers + AI Service + Worker VPS.
-- REGRAS: Incremental, não-destrutivo, reversível, sem perda de dados.
-- ==============================================================================

-- 1. Adicionar novos campos para o novo pipeline (se não existirem)
ALTER TABLE public.news_candidates
  ADD COLUMN IF NOT EXISTS original_content TEXT,
  ADD COLUMN IF NOT EXISTS ai_content JSONB,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- COMENTÁRIOS DAS COLUNAS PARA AUDITORIA/DOCUMENTAÇÃO POSTGRES
COMMENT ON COLUMN public.news_candidates.original_content IS 'Texto integral limpo extraído pelos módulos de Scrapers (Cleaner G1, Prefeitura, Inova)';
COMMENT ON COLUMN public.news_candidates.ai_content IS 'Resposta estruturada em formato JSONB gerada pela IA (title, excerpt, content, category, tags)';
COMMENT ON COLUMN public.news_candidates.source_metadata IS 'Metadados da fonte em JSONB (source_name, original_url, author, published_at, image_url, parser_version)';

-- 2. Atualizar/Remover e recriar constraint de status para permitir a evolução de status:
--    pending | pending_ai | ai_processed | approved | rejected
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'news_candidates_status_check'
           OR conname = 'check_news_candidates_status'
    ) THEN
        ALTER TABLE public.news_candidates DROP CONSTRAINT IF EXISTS news_candidates_status_check;
        ALTER TABLE public.news_candidates DROP CONSTRAINT IF EXISTS check_news_candidates_status;
    END IF;
END $$;

ALTER TABLE public.news_candidates
  ADD CONSTRAINT news_candidates_status_check 
  CHECK (status IN ('pending', 'pending_ai', 'ai_processed', 'approved', 'rejected'));

-- Valor padrão do status mantido como 'pending'
ALTER TABLE public.news_candidates 
  ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Criar índices para otimização de consultas do Garimpo e Workers
CREATE INDEX IF NOT EXISTS idx_news_candidates_original_url 
  ON public.news_candidates (original_url);

CREATE INDEX IF NOT EXISTS idx_news_candidates_source_id 
  ON public.news_candidates (source_id);

CREATE INDEX IF NOT EXISTS idx_news_candidates_status 
  ON public.news_candidates (status);

CREATE INDEX IF NOT EXISTS idx_news_candidates_created_at 
  ON public.news_candidates (created_at DESC);
