# Fluxo Editorial e Curadoria do Garimpo de Notícias

## Visão Geral
O fluxo editorial do **Melhora Prudente** foi desenhado para combinar automação de captura e síntese por IA com controle rigoroso de qualidade e aprovação humana.

## Etapas do Fluxo Editorial

```
[1. Coleta e Limpeza]
   - Scrapers capturam o texto bruto e removem sujeiras do DOM HTML.
   - Salva em news_candidates (original_content) com status 'pending_ai'.

[2. Processamento IA]
   - Gemini reescreve a notícia com tom jornalístico local e objetivo.
   - Salva em news_candidates (ai_content) com status 'ai_processed'.

[3. Curadoria e Revisão Humana]
   - O editor acessa o Painel de Garimpo no admin do Melhora Prudente.
   - Revisa o texto original (original_content) e a sugestão da IA (ai_content).
   - Pode realizar edições manuais no título, resumo, categoria ou corpo.

[4. Aprovação e Publicação]
   - Ao aprovar, o registro em news_candidates é atualizado para status 'approved'.
   - A matéria final formatada é inserida na tabela pública 'news'.
   - A notícia fica visível instantaneamente no portal Melhora Prudente.

[5. Rejeição ou Arquivamento]
   - Caso a matéria seja irrelevante para Prudente e região, o editor clica em 'Rejeitar'.
   - O status é alterado para 'rejected' e a matéria não é publicada.
```
