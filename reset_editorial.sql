-- =====================================================================
-- MELHORA PRUDENTE - SCRIPT DE RESET EDITORIAL LIMPO
-- =====================================================================
-- Instruções: Copie e execute este script no Editor SQL do seu painel Supabase.
-- ATENÇÃO: Este script apaga permanentemente dados editoriais. Ele NÃO apaga
-- configurações de CMS, perfis de usuários ou categorias.
-- =====================================================================

BEGIN;

-- 1. Desativar triggers temporariamente se necessário para evitar efeitos colaterais
SET CONSTRAINTS ALL DEFERRED;

-- 2. Limpar Comentários de Notícias (Dependem de News)
TRUNCATE TABLE public.news_comments RESTART IDENTITY CASCADE;

-- 3. Limpar Curtidas de Notícias (Dependem de News)
TRUNCATE TABLE public.news_likes RESTART IDENTITY CASCADE;

-- 4. Limpar Visualizações de Notícias (Dependem de News)
TRUNCATE TABLE public.news_views RESTART IDENTITY CASCADE;

-- 5. Limpar Compartilhamentos de Notícias (Dependem de News)
TRUNCATE TABLE public.news_shares RESTART IDENTITY CASCADE;

-- 6. Limpar Notícias (Tabela Central Editorial)
TRUNCATE TABLE public.news RESTART IDENTITY CASCADE;

-- Nota: Categorias, Perfis de Usuários (profiles) e Configurações (settings) são PRESERVADOS.

COMMIT;

-- Mensagem de confirmação conceitual: Reset Editorial concluído com sucesso!
