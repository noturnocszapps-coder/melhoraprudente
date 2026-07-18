-- ============================================================================
-- PROJETO: Melhora Prudente
-- ARQUIVO: migration_onda_2.sql
-- OBJETIVO: Migração da Segunda Onda - Arquitetura Multi-fontes do Garimpo
-- CARACTERÍSTICAS: Idempotente, RLS ativo, índices otimizados, sem perda de dados
-- ============================================================================

BEGIN;

RAISE NOTICE 'Iniciando migração de colunas para news_candidates...';

-- 1. Adicionar colunas adicionais para rastreamento de fontes e metadados na tabela news_candidates
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'official';
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS source_image_url TEXT;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS image_usage_status TEXT DEFAULT 'unknown';
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS editorial_status TEXT DEFAULT 'coletada';
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS ai_analysis_status TEXT DEFAULT 'Não analisado';
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS ai_model TEXT;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS possible_duplicate_of UUID;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.news_candidates ADD COLUMN IF NOT EXISTS published_news_id UUID;

-- 2. Backfill para itens preexistentes na tabela
UPDATE public.news_candidates 
SET 
  source_id = 'prefeitura-prudente',
  source_type = 'official',
  editorial_status = CASE 
    WHEN status = 'published' THEN 'publicada'
    WHEN status = 'approved' THEN 'aprovada'
    WHEN status = 'rejected' THEN 'rejeitada'
    ELSE 'coletada'
  END,
  ai_analysis_status = CASE 
    WHEN ai_title IS NOT NULL THEN 'Analisado'
    ELSE 'Não analisado'
  END
WHERE source_id IS NULL;

-- 3. Adicionar constraints de status e validação para garantir consistência
ALTER TABLE public.news_candidates DROP CONSTRAINT IF EXISTS news_candidates_status_check;
ALTER TABLE public.news_candidates ADD CONSTRAINT news_candidates_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'published'));

ALTER TABLE public.news_candidates DROP CONSTRAINT IF EXISTS news_candidates_image_usage_status_check;
ALTER TABLE public.news_candidates ADD CONSTRAINT news_candidates_image_usage_status_check CHECK (image_usage_status IN ('unknown', 'allowed', 'not_allowed', 'own_image_required'));

ALTER TABLE public.news_candidates DROP CONSTRAINT IF EXISTS news_candidates_editorial_status_check;
ALTER TABLE public.news_candidates ADD CONSTRAINT news_candidates_editorial_status_check CHECK (editorial_status IN ('coletada', 'analisada', 'em_revisao', 'aprovada', 'publicada', 'rejeitada'));

-- 4. Criar índice para performance em filtros de fontes e deduplicação
CREATE INDEX IF NOT EXISTS news_candidates_source_id_idx ON public.news_candidates (source_id);
CREATE INDEX IF NOT EXISTS news_candidates_possible_duplicate_of_idx ON public.news_candidates (possible_duplicate_of);

-- 5. Atualizar RLS/Politicas (opcional, já habilitado no original)
-- Recarregar cache de esquemas
NOTIFY pgrst, 'reload schema';

COMMIT;

RAISE NOTICE 'Migração concluída com sucesso!';
