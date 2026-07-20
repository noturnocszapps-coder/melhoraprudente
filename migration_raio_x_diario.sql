-- ============================================================================
-- ARQUIVO: migration_raio_x_diario.sql
-- OBJETIVO: Criar tabelas para o Raio-X dos Vereadores e Diário Oficial Inteligente
-- CARACTERÍSTICAS: Idempotente (usando IF NOT EXISTS)
-- ============================================================================

BEGIN;

-- 1. RAIO-X DOS VEREADORES
CREATE TABLE IF NOT EXISTS public.councilors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL, -- ID do vereador na câmara (slug ou número)
  name TEXT NOT NULL,               -- Nome completo
  display_name TEXT NOT NULL,       -- Nome parlamentar
  party TEXT,                       -- Partido político
  photo_url TEXT,                   -- Foto oficial
  official_url TEXT,                -- Página individual no site da câmara
  legislature TEXT DEFAULT '2025-2028', -- Legislatura atual
  is_active BOOLEAN DEFAULT true,   -- Se está ativo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.legislative_acts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL, -- ID do ato na câmara (PL-X-202X ou hash)
  act_type TEXT NOT NULL,           -- 'projeto_lei', 'projeto_resolucao', 'requerimento', etc.
  act_category TEXT NOT NULL,       -- 'LEGISLAÇÃO SUBSTANTIVA', 'FISCALIZAÇÃO', 'DEMANDAS LOCAIS', 'ATOS SIMBÓLICOS', 'OUTROS'
  number TEXT,                      -- Número da proposição (ex: '123')
  year TEXT,                        -- Ano (ex: '2025')
  title TEXT NOT NULL,              -- Ementa resumida/Título oficial
  summary TEXT,                     -- Descrição longa/Ementa completa
  protocol_date TIMESTAMP WITH TIME ZONE, -- Data de protocolo
  status TEXT,                      -- Situação/Tramitação
  official_url TEXT,                -- Link oficial
  is_coauthored BOOLEAN DEFAULT false, -- Se tem múltiplos autores
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.councilor_act_authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  act_id UUID REFERENCES public.legislative_acts(id) ON DELETE CASCADE NOT NULL,
  councilor_id UUID REFERENCES public.councilors(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT true,  -- Se é o autor principal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(act_id, councilor_id)
);

-- Ativar Row Level Security
ALTER TABLE public.councilors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legislative_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.councilor_act_authors ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura
DROP POLICY IF EXISTS "Anyone can view councilors" ON public.councilors;
CREATE POLICY "Anyone can view councilors" ON public.councilors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view legislative_acts" ON public.legislative_acts;
CREATE POLICY "Anyone can view legislative_acts" ON public.legislative_acts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view councilor_act_authors" ON public.councilor_act_authors;
CREATE POLICY "Anyone can view councilor_act_authors" ON public.councilor_act_authors FOR SELECT USING (true);

-- Políticas de acesso para Admins/Editores (inserir, atualizar, deletar)
DROP POLICY IF EXISTS "Admins and editors can manage councilors" ON public.councilors;
CREATE POLICY "Admins and editors can manage councilors" ON public.councilors
  FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

DROP POLICY IF EXISTS "Admins and editors can manage legislative_acts" ON public.legislative_acts;
CREATE POLICY "Admins and editors can manage legislative_acts" ON public.legislative_acts
  FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

DROP POLICY IF EXISTS "Admins and editors can manage councilor_act_authors" ON public.councilor_act_authors;
CREATE POLICY "Admins and editors can manage councilor_act_authors" ON public.councilor_act_authors
  FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));


-- 2. DIÁRIO OFICIAL INTELIGENTE
CREATE TABLE IF NOT EXISTS public.official_gazette_editions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL, -- Identificador único da edição
  edition_number TEXT NOT NULL,     -- Número da edição (ex: '4521')
  publication_date DATE NOT NULL,   -- Data de publicação
  source_url TEXT,                  -- URL da página de indexação
  file_url TEXT,                    -- URL do arquivo PDF/link principal
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.official_gazette_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_id UUID REFERENCES public.official_gazette_editions(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER,              -- Número da página (opcional)
  section TEXT,                     -- Secretaria, órgão, seção (ex: 'Gabinete do Prefeito')
  title TEXT NOT NULL,              -- Assunto/Título resumido
  raw_text TEXT NOT NULL,           -- Texto completo do ato
  summary TEXT,                     -- Resumo gerado por IA
  category TEXT NOT NULL,           -- 'LICITAÇÕES E CONTRATOS', 'NOMEAÇÕES', etc.
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100), -- Relevância (0-100)
  source_reference TEXT,            -- Trecho original de referência
  explanation_citizen TEXT,         -- "O que isso significa para o cidadão?" (IA)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ativar Row Level Security
ALTER TABLE public.official_gazette_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_gazette_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura
DROP POLICY IF EXISTS "Anyone can view official_gazette_editions" ON public.official_gazette_editions;
CREATE POLICY "Anyone can view official_gazette_editions" ON public.official_gazette_editions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view official_gazette_items" ON public.official_gazette_items;
CREATE POLICY "Anyone can view official_gazette_items" ON public.official_gazette_items FOR SELECT USING (true);

-- Políticas de acesso para Admins/Editores (inserir, atualizar, deletar)
DROP POLICY IF EXISTS "Admins and editors can manage official_gazette_editions" ON public.official_gazette_editions;
CREATE POLICY "Admins and editors can manage official_gazette_editions" ON public.official_gazette_editions
  FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

DROP POLICY IF EXISTS "Admins and editors can manage official_gazette_items" ON public.official_gazette_items;
CREATE POLICY "Admins and editors can manage official_gazette_items" ON public.official_gazette_items
  FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

-- Recarregar cache do postgrest
NOTIFY pgrst, 'reload schema';

COMMIT;
