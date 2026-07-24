# Arquitetura do Melhora Prudente

## Visão Geral
O **Melhora Prudente** é uma plataforma de inteligência jornalística local e agregação automatizada de notícias para Presidente Prudente e região. Ele foi desenvolvido em arquitetura modular full-stack para integração com o ecossistema Roxou na VPS.

## Diagrama da Arquitetura do Ecossistema

```
[Fontes Externas: G1, Prefeitura, Inova Prudente]
                       │
                       ▼
            [Scrapers & Cleaners]
        (services/news-sources/*)
                       │
                       ▼
       [news_candidates (original_content)]
            (Supabase / PostgreSQL)
                       │
                       ▼
            [AI Processing Engine]
        (Gemini 2.5 Flash / AI Service)
                       │
                       ▼
        [news_candidates (ai_content)]
             (status: ai_processed)
                       │
                       ▼
         [Painel Garimpo de Notícias]
           (Aprovação / Edição Humana)
                       │
                       ▼
           [Notícias Publicadas]
           (Tabela news em produção)
                       │
                       ▼
       [Interface Pública Next.js 15]
            (App Router / Tailwind)
```

## Componentes do Sistema

1. **Aplicação Web (Next.js 15)**:
   - App Router, React 19, Tailwind CSS v4, Framer Motion.
   - Serve a interface pública e o Painel Administrativo de Garimpo.

2. **Módulo de Scrapers (`services/news-sources/`)**:
   - Módulos isolados por fonte (`g1`, `prefeitura`, `inova`).
   - Implementa `INewsSource`, `Parser` DOM e `Cleaner` de texto integral.

3. **Módulo de IA (`services/ai/`)**:
   - Integração com `@google/genai` (Gemini API).
   - Reescrita jornalística, sumarização, categorização e geração de tags com schemas Zod estritos.

4. **Pipeline Modular (`services/pipeline/`)**:
   - Ingestão limpa de matérias brutas em `news_candidates`.
   - Processamento resiliente com fallback seguro em caso de indisponibilidade de chave.

5. **Garimpo Worker (`workers/`)**:
   - Processo daemon independente orquestrado via PM2.
   - Executa ciclos periódicos de coleta, limpeza e processamento por IA sem bloquear a aplicação web.

6. **Banco de Dados (Supabase / PostgreSQL)**:
   - Tabela `news_candidates`: armazena candidatos com `original_content`, `ai_content` e `source_metadata`.
   - Tabela `news`: armazena matérias aprovadas e publicadas.
