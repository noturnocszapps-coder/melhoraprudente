-- ============================================================================
-- PROJETO: Melhora Prudente
-- ARQUIVO: migration_consolidada.sql
-- OBJETIVO: Migração consolidada final do banco de dados (Supabase/PostgreSQL)
-- CARACTERÍSTICAS: Autossuficiente, idempotente, segura, transacional, RLS ativo.
-- ============================================================================

-- 1. INÍCIO DA TRANSAÇÃO UNIFICADA
BEGIN;

-- ============================================================================
-- ETAPA 2: ADICIONAR COLUNAS À TABELA 'NEWS' E REALIZAR BACKFILL (SE NECESSÁRIO)
-- ============================================================================
RAISE NOTICE 'Etapa 2: Adicionando colunas à tabela news e executando backfill...';

-- Adição segura de colunas usando IF NOT EXISTS
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS city_slug TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS city_name TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_classification TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_relevance_score INTEGER;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_viral_potential_score INTEGER;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_regional_impact_score INTEGER;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_seo_title TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS ai_seo_description TEXT;

-- Backfill dos valores nulos para garantir integridade física
UPDATE public.news SET city_slug = 'presidente-prudente' WHERE city_slug IS NULL;
UPDATE public.news SET city_name = 'Presidente Prudente' WHERE city_name IS NULL;
UPDATE public.news SET region = 'SP' WHERE region IS NULL;
UPDATE public.news SET is_breaking = false WHERE is_breaking IS NULL;
UPDATE public.news SET ai_relevance_score = 50 WHERE ai_relevance_score IS NULL;
UPDATE public.news SET ai_viral_potential_score = 50 WHERE ai_viral_potential_score IS NULL;
UPDATE public.news SET ai_regional_impact_score = 50 WHERE ai_regional_impact_score IS NULL;

-- ============================================================================
-- ETAPA 3: APLICAR PADRÕES, NOT NULL E CONSTRAINTS DE SCORE NA TABELA 'NEWS'
-- ============================================================================
RAISE NOTICE 'Etapa 3: Aplicando padrões, NOT NULL e restrições na tabela news...';

-- Definir padrões e NOT NULL
ALTER TABLE public.news ALTER COLUMN city_slug SET DEFAULT 'presidente-prudente';
ALTER TABLE public.news ALTER COLUMN city_slug SET NOT NULL;

ALTER TABLE public.news ALTER COLUMN city_name SET DEFAULT 'Presidente Prudente';
ALTER TABLE public.news ALTER COLUMN city_name SET NOT NULL;

ALTER TABLE public.news ALTER COLUMN region SET DEFAULT 'SP';
ALTER TABLE public.news ALTER COLUMN region SET NOT NULL;

ALTER TABLE public.news ALTER COLUMN is_breaking SET DEFAULT false;
ALTER TABLE public.news ALTER COLUMN is_breaking SET NOT NULL;

ALTER TABLE public.news ALTER COLUMN ai_relevance_score SET DEFAULT 50;
ALTER TABLE public.news ALTER COLUMN ai_relevance_score SET NOT NULL;

ALTER TABLE public.news ALTER COLUMN ai_viral_potential_score SET DEFAULT 50;
ALTER TABLE public.news ALTER COLUMN ai_viral_potential_score SET NOT NULL;

ALTER TABLE public.news ALTER COLUMN ai_regional_impact_score SET DEFAULT 50;
ALTER TABLE public.news ALTER COLUMN ai_regional_impact_score SET NOT NULL;

-- Adicionar constraints de score de forma idempotente (drop se existir antes)
ALTER TABLE public.news DROP CONSTRAINT IF EXISTS news_ai_relevance_score_check;
ALTER TABLE public.news ADD CONSTRAINT news_ai_relevance_score_check CHECK (ai_relevance_score BETWEEN 0 AND 100);

ALTER TABLE public.news DROP CONSTRAINT IF EXISTS news_ai_viral_potential_score_check;
ALTER TABLE public.news ADD CONSTRAINT news_ai_viral_potential_score_check CHECK (ai_viral_potential_score BETWEEN 0 AND 100);

ALTER TABLE public.news DROP CONSTRAINT IF EXISTS news_ai_regional_impact_score_check;
ALTER TABLE public.news ADD CONSTRAINT news_ai_regional_impact_score_check CHECK (ai_regional_impact_score BETWEEN 0 AND 100);

-- ============================================================================
-- ETAPA 4: ADICIONAR COLUNAS À TABELA 'NEWS_COMMENTS' E EXECUTAR BACKFILL
-- ============================================================================
RAISE NOTICE 'Etapa 4: Adicionando colunas à tabela news_comments e executando backfill...';

-- Adicionar colunas necessárias na tabela news_comments
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS moderated_by UUID;
ALTER TABLE public.news_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Backfill seguro: comentários existentes são considerados 'approved'
UPDATE public.news_comments SET status = 'approved' WHERE status IS NULL;
UPDATE public.news_comments SET updated_at = NOW() WHERE updated_at IS NULL;

-- ============================================================================
-- ETAPA 5: DEFAULTS, NOT NULL E CONSTRAINTS DE STATUS EM 'NEWS_COMMENTS'
-- ============================================================================
RAISE NOTICE 'Etapa 5: Definindo defaults e NOT NULL na tabela news_comments...';

-- Definir padrões e obrigatórios para news_comments
ALTER TABLE public.news_comments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.news_comments ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.news_comments ALTER COLUMN updated_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE public.news_comments ALTER COLUMN updated_at SET NOT NULL;

-- Adicionar constraint CHECK na coluna status de forma idempotente
ALTER TABLE public.news_comments DROP CONSTRAINT IF EXISTS news_comments_status_check;
ALTER TABLE public.news_comments ADD CONSTRAINT news_comments_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- ============================================================================
-- ETAPA 6: REMOVER TRIGGERS CONFLITANTES E CRIAR TRIGGER UNIFICADO
-- ============================================================================
RAISE NOTICE 'Etapa 6: Removendo triggers conflitantes e criando função e trigger unificado...';

-- Remover triggers que pudessem causar conflito de ordem de execução BEFORE UPDATE
DROP TRIGGER IF EXISTS news_comments_set_updated_at ON public.news_comments;
DROP TRIGGER IF EXISTS news_comments_update_rules_trigger ON public.news_comments;

-- Criar a função unificada com SECURITY DEFINER e search_path seguro (Proteção contra hijacking)
CREATE OR REPLACE FUNCTION public.news_comments_before_update_func()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_profile_status TEXT;
BEGIN
  -- A. Aplicar regras de proteção para usuários comuns apenas se a chamada vier de um cliente autenticado (não-sistema)
  IF auth.uid() IS NOT NULL THEN
    -- Obter os dados do perfil do usuário executor de forma segura
    SELECT role, status INTO v_role, v_profile_status 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Bloquear usuários que não estejam ativos
    IF v_profile_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'Apenas usuários ativos podem atualizar comentários.';
    END IF;

    -- Se o executor for um usuário comum ('user')
    IF v_role IS NULL OR v_role = 'user' THEN
      -- 1. Restringir edição apenas aos seus próprios comentários
      IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Você só pode atualizar seus próprios comentários.';
      END IF;

      -- 2. Permitir edição apenas se o comentário ainda estiver pendente de moderação
      IF OLD.status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'Apenas comentários pendentes podem ser editados.';
      END IF;

      -- 3. Impedir que o usuário tente burlar a moderação alterando campos protegidos
      IF NEW.status IS DISTINCT FROM OLD.status OR
         NEW.moderated_at IS DISTINCT FROM OLD.moderated_at OR
         NEW.moderated_by IS DISTINCT FROM OLD.moderated_by OR
         NEW.news_id IS DISTINCT FROM OLD.news_id OR
         NEW.user_id IS DISTINCT FROM OLD.user_id OR
         NEW.parent_id IS DISTINCT FROM OLD.parent_id OR
         NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Você não tem permissão para alterar campos protegidos deste comentário.';
      END IF;
    END IF;
  END IF;

  -- B. Atualizar o carimbo de data (updated_at) somente se o conteúdo do comentário realmente foi alterado
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.updated_at := TIMEZONE('utc'::text, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Associar a função de trigger unificada à tabela
CREATE TRIGGER news_comments_before_update_trigger
  BEFORE UPDATE ON public.news_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.news_comments_before_update_func();

-- Adequar e garantir search_path seguro nas funções SECURITY DEFINER existentes no banco
RAISE NOTICE 'Etapa 6.2: Protegendo funções SECURITY DEFINER existentes com search_path seguro...';

CREATE OR REPLACE FUNCTION public.get_role(user_id UUID) 
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user', 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ETAPA 7: POLÍTICAS DE RLS (ROW LEVEL SECURITY) E PERMISSÕES (GRANTS)
-- ============================================================================
RAISE NOTICE 'Etapa 7: Configurando Row Level Security (RLS) de forma idempotente...';

-- Forçar habilitação do RLS nas tabelas envolvidas
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

-- Remover políticas legadas ou existentes para evitar erro de duplicação
DROP POLICY IF EXISTS "Published news are viewable by everyone" ON public.news;
DROP POLICY IF EXISTS "Admins and Editors have full access to news" ON public.news;

DROP POLICY IF EXISTS "Anyone can select approved comments" ON public.news_comments;
DROP POLICY IF EXISTS "Users can select their own comments" ON public.news_comments;
DROP POLICY IF EXISTS "Admins and editors can select all comments" ON public.news_comments;
DROP POLICY IF EXISTS "Authenticated active users can insert comments" ON public.news_comments;
DROP POLICY IF EXISTS "Users can update their own pending comments" ON public.news_comments;
DROP POLICY IF EXISTS "Users can delete their own pending comments" ON public.news_comments;
DROP POLICY IF EXISTS "Admins and editors can manage any comment" ON public.news_comments;

-- Criar políticas robustas de RLS para a tabela 'news'
CREATE POLICY "Published news are viewable by everyone" ON public.news 
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins and Editors have full access to news" ON public.news 
  FOR ALL USING (public.get_role(auth.uid()) IN ('admin', 'editor'));

-- Criar políticas robustas de RLS para a tabela 'news_comments'
CREATE POLICY "Anyone can select approved comments" ON public.news_comments 
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can select their own comments" ON public.news_comments 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and editors can select all comments" ON public.news_comments 
  FOR SELECT USING (public.get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Authenticated active users can insert comments" ON public.news_comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'active' AND
    status = 'pending' AND
    (parent_id IS NULL OR EXISTS (
      SELECT 1 FROM public.news_comments p WHERE p.id = parent_id AND p.status = 'approved' AND p.news_id = news_id
    ))
  );

CREATE POLICY "Users can update their own pending comments" ON public.news_comments 
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
  ) WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending' AND
    moderated_at IS NULL AND
    moderated_by IS NULL
  );

CREATE POLICY "Users can delete their own pending comments" ON public.news_comments 
  FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
  );

CREATE POLICY "Admins and editors can manage any comment" ON public.news_comments 
  FOR ALL USING (public.get_role(auth.uid()) IN ('admin', 'editor'));

-- Atribuição rigorosa de privilégios (Grants) de banco de dados
RAISE NOTICE 'Etapa 7.2: Concedendo privilégios explicitamente para perfis de acesso...';

GRANT SELECT ON public.news TO anon, authenticated;
GRANT ALL ON public.news TO authenticated;

GRANT SELECT ON public.news_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_comments TO authenticated;

-- ============================================================================
-- ETAPA 8: DIAGNOSTICAR E ATUALIZAR IDEMPOTENTEMENTE CONSTRAINTS DE 'ADS'
-- ============================================================================
RAISE NOTICE 'Etapa 8: Executando rotina de diagnóstico de anúncios e constraints de slots...';

-- Rotina PL/pgSQL para diagnóstico e remoção segura de constraints CHECK legadas na tabela 'ads'
DO $$
DECLARE
  v_invalid_count INTEGER;
  v_invalid_slots TEXT;
  r RECORD;
  v_def TEXT;
BEGIN
  -- A. Validação de slots legados que não possuem equivalência conhecida
  SELECT COUNT(*), string_agg(DISTINCT slot, ', ')
  INTO v_invalid_count, v_invalid_slots
  FROM public.ads
  WHERE slot NOT IN (
    'home_top', 'home_middle', 'home_sidebar', 'home_footer', 
    'sidebar_news_detail', 'sidebar_news_detail_bottom', 'article_inline', 
    'category_top', 'category_footer', 'archive_top', 'archive_footer'
  );

  -- Aborta imediatamente caso existam slots órfãos não autorizados para evitar perda de integridade
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Erro de Integridade: Existem % anúncios associados a slots órfãos sem correspondência comprovada: [%]. A migração foi cancelada para proteger os dados.', 
      v_invalid_count, v_invalid_slots;
  END IF;

  -- B. Busca de restrições CHECK associadas à coluna slot usando pg_get_constraintdef (Compatível com PostgreSQL moderno)
  FOR r IN 
    SELECT c.conname, c.oid
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public'
      AND c.conrelid = 'public.ads'::regclass
      AND c.contype = 'c'
  LOOP
    v_def := pg_get_constraintdef(r.oid);
    -- Se a definição da constraint referenciar explicitamente a coluna 'slot'
    IF v_def ILIKE '%slot%' THEN
      RAISE NOTICE 'Removendo constraint obsoleta de slot encontrada: %', r.conname;
      EXECUTE 'ALTER TABLE public.ads DROP CONSTRAINT ' || quote_ident(r.conname);
    END IF;
  END LOOP;
END $$;

-- C. Aplicar a nova restrição de slots unificada e atualizada
ALTER TABLE public.ads ADD CONSTRAINT ads_slot_check CHECK (slot IN (
  'home_top', 
  'home_middle', 
  'home_sidebar', 
  'home_footer', 
  'sidebar_news_detail', 
  'sidebar_news_detail_bottom', 
  'article_inline', 
  'category_top', 
  'category_footer', 
  'archive_top', 
  'archive_footer'
));

-- ============================================================================
-- ETAPAS 9 E 10: RELOAD CACHE DO POSTGREST E CONCLUSÃO DA TRANSAÇÃO
-- ============================================================================
RAISE NOTICE 'Etapas 9 e 10: Atualizando PostgREST e consolidando transação...';

-- Notificar PostgREST para recarregar o esquema de forma transparente e imediata
NOTIFY pgrst, 'reload schema';

-- Finalização segura da transação
COMMIT;

RAISE NOTICE '============================================================================';
RAISE NOTICE ' MIGRAÇÃO CONSOLIDADA EXECUTADA COM SUCESSO E SEM PERDA DE DADOS!';
RAISE NOTICE '============================================================================';
