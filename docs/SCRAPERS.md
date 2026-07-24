# Documentação de Scrapers & Fontes de Notícias

## Estrutura Modular por Fonte
Cada fonte de notícias possui sua própria pasta isolada sob `services/news-sources/[source_id]/`:

- `config.ts`: Definição de URL base, seletores CSS, categoria padrão e timeout.
- `scraper.ts`: Classe que implementa a interface `INewsSource` (`fetchNews`, `fetchArticleContent`, `clean`).
- `parser.ts`: Função de extração de título, autor, data, imagem principal e parágrafos do HTML bruto.
- `cleaner.ts`: Sanitização do texto integral, remoção de scripts, anúncios e quebras de linha indesejadas.
- `index.ts`: Ponto de entrada exportador da fonte.

## Fontes Atualizadas no Sistema

1. **G1 Presidente Prudente e Região (`g1`)**:
   - URL Base: `https://g1.globo.com/sp/presidente-prudente-regiao/`
   - Parser: Extrai conteúdo de matérias do G1/Globo.com.

2. **Prefeitura Municipal de Presidente Prudente (`prefeitura`)**:
   - URL Base: `https://www.presidenteprudente.sp.gov.br/site/noticia/`
   - Parser: Extrai notas oficiais da assessoria de imprensa municipal.

3. **Inova Prudente (`inova`)**:
   - URL Base: `https://inovaprudente.com.br/noticias/`
   - Parser: Extrai notícias de inovação, tecnologia e eventos do ecossistema local.

## Adicionando uma Nova Fonte
1. Criar diretório `services/news-sources/[source_id]/`.
2. Implementar `config.ts`, `parser.ts`, `cleaner.ts`, e `scraper.ts` conforme a interface `INewsSource`.
3. Registrar a nova classe em `services/news-sources/index.ts`.
4. Adicionar a chave da fonte em `workers/config.ts` (`enabledSources`).
