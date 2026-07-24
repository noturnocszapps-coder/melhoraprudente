# Documentação do Banco de Dados — Supabase / PostgreSQL

## Visão Geral
O banco de dados utiliza a plataforma Supabase (PostgreSQL) para armazenamento persistente das notícias brutas, processadas pela IA e publicadas no portal.

## Estrutura das Tabelas Principais

### Tabela: `news_candidates`

Armazena o histórico de raspagem e reescrita de notícias coletadas pelos scrapers.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Identificador único da matéria candidata |
| `original_url` | `TEXT` (Unique) | URL de origem no portal parceiro/fonte |
| `source_id` | `TEXT` | Identificador da fonte (`g1`, `prefeitura`, `inova`) |
| `status` | `TEXT` | Estado do candidato (`pending`, `pending_ai`, `ai_processed`, `approved`, `rejected`) |
| `original_content` | `TEXT` | Texto integral limpo extraído pelo scraper |
| `ai_content` | `JSONB` | Resposta JSON da IA (`title`, `excerpt`, `content`, `category`, `tags`) |
| `source_metadata` | `JSONB` | Metadados da fonte (`source_name`, `author`, `published_at`, `image_url`) |
| `ai_title` | `TEXT` | Campo legado mantido para compatibilidade retroativa |
| `ai_summary` | `TEXT` | Campo legado mantido para compatibilidade retroativa |
| `ai_category` | `TEXT` | Campo legado mantido para compatibilidade retroativa |
| `created_at` | `TIMESTAMPTZ` | Data e hora de criação do registro |
| `updated_at` | `TIMESTAMPTZ` | Data e hora da última atualização |

### Tabela: `news`

Armazena as notícias ativas e aprovadas publicadas no portal público Melhora Prudente.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Identificador da notícia publicada |
| `title` | `TEXT` | Título final editado e publicado |
| `slug` | `TEXT` (Unique) | Slug amigável para URL |
| `excerpt` | `TEXT` | Resumo da matéria |
| `content` | `TEXT` | Conteúdo integral formatado em HTML/Markdown |
| `category` | `TEXT` | Categoria de publicação |
| `tags` | `TEXT[]` | Lista de tags de assunto |
| `image_url` | `TEXT` | Imagem destacada principal |
| `original_url` | `TEXT` | Link de referência da fonte original |
| `source_name` | `TEXT` | Nome da fonte original |
| `status` | `TEXT` | Status de publicação (`published`, `archived`, `draft`) |
| `published_at` | `TIMESTAMPTZ` | Data de publicação oficial |

## Migrations SQL
As alterações incrementais e seguras são mantidas no diretório `supabase/migrations/`:
- `supabase/migrations/20260723_update_news_candidates.sql`
