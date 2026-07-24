# Pipeline de Processamento por Inteligência Artificial

## Visão Geral
O serviço de Inteligência Artificial (`services/ai/gemini.ts`) é responsável pela reescrita jornalística, síntese editorial, sumarização e categorização automática das matérias coletadas pelos scrapers.

## Estrutura do Módulo

- `gemini.ts`: Cliente de IA utilizando a SDK oficial `@google/genai` (modelo `gemini-2.5-flash`).
- `prompts.ts`: Sistema de prompts jornalísticos com regras estritas de imparcialidade, síntese e tom de voz local.
- `schemas.ts`: Schemas de validação Zod (`AIEditorialResponseSchema`) que garantem o tipo do retorno JSON.
- `types.ts`: Definição dos tipos TypeScript do pipeline de IA (`AIProcessInput`, `AIProcessOutput`).

## Formato do Payloads no Banco de Dados (`ai_content`)

```json
{
  "title": "Título Reescrito Otimizado para SEO",
  "excerpt": "Resumo jornalístico objetivo em até 200 caracteres",
  "content": "Texto reescrito completo formatado em parágrafos limpos",
  "category": "Economia / Tecnologia / Educação / Cidade",
  "tags": ["Presidente Prudente", "Inovação", "Prefeitura"],
  "processed_at": "2026-07-24T00:00:00.000Z"
}
```

## Tratamento de Falhas e Fallback
Se a chave `GEMINI_API_KEY` não for configurada ou se ocorrer um erro de quota na API do Gemini:
1. O serviço registra o aviso no log.
2. Utiliza um fallback gracioso que preserva o texto limpo original (`original_content`).
3. Permite reprocessamento posterior via painel administrativo sem perder dados.
