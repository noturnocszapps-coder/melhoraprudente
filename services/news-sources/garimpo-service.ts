import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PrefeituraPrudenteSource } from './prefeitura-prudente';
import { G1PresidentePrudenteSource } from './g1-presidente-prudente';
import { NewsSource, ScrapedNewsItem } from './types';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini client server-side safely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

export function sanitizeG1Text(text: string): string {
  if (!text) return '';
  return text
    // Remover breadcrumbs e chamadas promocionais comuns do G1
    .replace(/Veja mais notícias da região no g1 Presidente Prudente e Região\./gi, '')
    .replace(/Participe do canal do g1 Presidente Prudente e Região no WhatsApp/gi, '')
    .replace(/Participe do grupo do g1 Presidente Prudente e Região no WhatsApp/gi, '')
    .replace(/VÍDEOS: tudo sobre o oeste paulista/gi, '')
    .replace(/VÍDEOS: Tudo sobre a região/gi, '')
    .replace(/Leia mais sobre a região no g1/gi, '')
    .replace(/veja mais/gi, '')
    .replace(/vídeos/gi, '')
    .replace(/#\w+/g, '') // Remover hashtags
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeG1Title(title: string): string {
  if (!title) return '';
  return title
    .replace(/^(VÍDEO|VÍDEOS|FOTOS|FOTO):\s*/gi, '')
    .replace(/\s*-\s*g1\s+.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface GarimpoStats {
  scraped: number;
  newCandidates: number;
  saved: number;
  skipped: number;
  duplicates: number;
  old: number;
  ignored: number;
  errors: string[];
}

export class GarimpoService {
  private sources: NewsSource[] = [
    new PrefeituraPrudenteSource(),
    new G1PresidentePrudenteSource()
  ];

  /**
   * Verifica se a tabela news_candidates existe no banco de dados.
   * Retorna true se a tabela existe, ou false se não existir (erro 42P01).
   */
  public async checkTableExists(supabaseClient = supabase): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabaseClient
        .from('news_candidates')
        .select('id')
        .limit(1);

      if (error) {
        // Código Postgres '42P01' significa "relation does not exist" (tabela não existe)
        // Código PostgREST 'PGRST205' significa que a tabela não existe no cache de esquemas do Supabase
        if (error.code === '42P01' || error.code === 'PGRST205') {
          return false;
        }
        console.warn('[GarimpoService] Erro ao testar tabela news_candidates:', error);
      }
      return true;
    } catch (err) {
      console.error('[GarimpoService] Erro inesperado ao verificar tabela:', err);
      return false;
    }
  }

  /**
   * Lista os candidatos a notícias ordenados pelos mais recentes coletados.
   */
  public async listCandidates(status?: string, supabaseClient = supabase) {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      let query = supabaseClient
        .from('news_candidates')
        .select('*')
        .order('collected_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('[GarimpoService] Erro ao listar candidatos:', err);
      return [];
    }
  }

  /**
   * Retorna o valor de similaridade decimal entre dois títulos (0.0 a 1.0)
   */
  public checkTitleSimilarityValue(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    const clean = (t: string) => t.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['para', 'pelo', 'pela', 'com', 'mais', 'sobre', 'como', 'onde', 'quando', 'tudo', 'presidente', 'prudente'].includes(w));
    
    const w1 = clean(title1);
    const w2 = clean(title2);
    if (w1.length === 0 || w2.length === 0) return 0;

    // Contar quantas palavras significativas se sobrepõem
    const intersect = w1.filter(w => w2.includes(w));
    const ratio = intersect.length / Math.min(w1.length, w2.length);
    return ratio;
  }

  /**
   * Algoritmo de similaridade de títulos para deduplicação leve server-side
   */
  private checkTitleSimilarity(title1: string, title2: string): boolean {
    return this.checkTitleSimilarityValue(title1, title2) >= 0.45;
  }

  /**
   * Executa a análise inteligente do Gemini para o candidato a notícia
   */
  private async analyzeWithGemini(title: string, content: string, sourceName: string, isG1: boolean) {
    const defaultFallback = {
      contentType: "regional_news",
      isLocallyRelevant: true,
      ai_title: title.toUpperCase(),
      ai_summary: content.substring(0, 180) + '...',
      ai_category: 'CIDADE',
      categoryConfidence: 0.9,
      categoryReason: 'Heurística padrão de fallback',
      ai_relevance_score: 75,
      ai_regional_impact_score: 80,
      ai_viral_potential_score: 60
    };

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[GarimpoService] GEMINI_API_KEY não configurada. Usando heurística padrão.');
      return defaultFallback;
    }

    try {
      const systemInstruction = `Você é uma Inteligência Editorial sênior do portal jornalístico "Melhora Prudente".
Sua tarefa é analisar de forma extremamente rigorosa a notícia oficial ou jornalística fornecida da região de Presidente Prudente e retornar obrigatoriamente um objeto JSON com análise editorial qualificada.

Siga rigorosamente os seguintes critérios editoriais:

1. CLASSIFICAÇÃO DE TIPO DE CONTEÚDO (contentType):
Classifique o conteúdo em uma das seguintes categorias:
- "regional_news": Notícias gerais da região de Presidente Prudente.
- "police": Ocorrências policiais, acidentes de trânsito locais, investigações.
- "politics": Decisões da prefeitura, câmara municipal, debates políticos regionais.
- "sports": Campeonatos locais, atletas da região, eventos esportivos regionais.
- "economy": Negócios locais, emprego na região, comércio, agro regional.
- "health": Hospitais, campanhas de vacinação regional, saúde pública local.
- "education": Escolas locais, universidades locais (ex: Unoeste, Unesp), editais de educação.
- "culture": Eventos culturais locais, teatro, música regional, festas da cidade.
- "public_service": Utilidade pública local, horários de ônibus, interdição de vias, previsão do tempo regional.
- "entertainment": Shows na região, cinema local, entretenimento.
- "recipe": Receitas culinárias, dicas de gastronomia geral (NÃO DEVE ENTRAR NO PORTAL).
- "generic_content": Horóscopo, novelas, conteúdo nacional/geral replicado sem qualquer relação com Presidente Prudente (NÃO DEVE ENTRAR NO PORTAL).
- "other": Qualquer outro tipo não listado.

2. AVALIAÇÃO DE RELEVÂNCIA REGIONAL REAL (isLocallyRelevant):
Determine se a notícia possui relação factual REAL com Presidente Prudente, região de Presidente Prudente ou Oeste Paulista (como as cidades do entorno cobertas pelo portal regional).
- Notícias nacionais ou estaduais sem link local explícito devem ter isLocallyRelevant = false.
- Receitas, novelas, fofocas, horóscopo ou conteúdos promocionais genéricos devem ter isLocallyRelevant = false.

3. CATEGORIA EDITORIAL PRINCIPAL (ai_category):
Escolha obrigatoriamente uma das seguintes categorias em maiúsculo para exibição:
"POLÍCIA", "POLÍTICA", "ESPORTES", "ECONOMIA", "SAÚDE", "EDUCAÇÃO", "CULTURA", "CIDADE"
- NUNCA use "CIDADE" como fallback automático se o conteúdo pertencer claramente a Segurança/Polícia, Esportes, Saúde, Educação ou Economia. Use apenas quando se tratar de obras municipais, ações de zeladoria, trânsito ou notícias gerais que não se enquadram nas outras categorias específicas.

4. NOVO TEXTO EDITORIAL SUGERIDO (ai_summary):
Para fontes de terceiros (como G1), você deve obrigatoriamente gerar uma proposta de TEXTO EDITORIAL ORIGINAL.
- NÃO faça paráfrase linha por linha ou simples troca de sinônimos.
- NÃO copie a estrutura da matéria ou repita trechos inteiros.
- Produza um texto autoral estruturado de 2 a 4 parágrafos curtos com base estrita nos fatos fornecidos (nunca invente dados, datas, nomes ou acontecimentos).
- Estrutura sugerida para o texto (separe por quebras de linha duplas):
  * Parágrafo 1 (Lead): O que aconteceu, onde e quando de forma direta.
  * Parágrafo 2 (Contexto): Detalhes confirmados, andamento ou desdobramentos.
  * Parágrafo 3 (Informações complementares): Se houver dados públicos relacionados (como alertas, orientações, etc.).
  * Atribuição Obrigatória ao final (SEMPRE inclua uma linha com: "Fonte original: G1 Presidente Prudente e Região" se a fonte for o G1).

5. TÍTULO EDITORIAL SUGERIDO (ai_title):
Sugira um título atrativo, informativo, readable e direto em LETRAS MAIÚSCULAS.
- Não deve ser idêntico ao título original nem uma simples paráfrase rasa.

Retorne obrigatoriamente um objeto JSON válido no formato do esquema solicitado.`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          contentType: {
            type: Type.STRING,
            enum: [
              "regional_news", "police", "politics", "sports", "economy",
              "health", "education", "culture", "public_service",
              "entertainment", "recipe", "generic_content", "other"
            ],
            description: "Classificação do tipo de conteúdo (ex: recipe, police, public_service)"
          },
          isLocallyRelevant: {
            type: Type.BOOLEAN,
            description: "Se o assunto é factual e relevante regionalmente para Presidente Prudente e região"
          },
          ai_title: {
            type: Type.STRING,
            description: "Título original sugerido EM LETRAS MAIÚSCULAS"
          },
          ai_summary: {
            type: Type.STRING,
            description: "Corpo de texto editorial sugerido (Lead, Contexto, Informações, Atribuição) com 2-4 parágrafos curtos"
          },
          ai_category: {
            type: Type.STRING,
            enum: ["POLÍCIA", "POLÍTICA", "ESPORTES", "ECONOMIA", "SAÚDE", "EDUCAÇÃO", "CULTURA", "CIDADE"],
            description: "Categoria editorial oficial correspondente"
          },
          categoryConfidence: {
            type: Type.NUMBER,
            description: "Grau de confiança na escolha da categoria (0.0 a 1.0)"
          },
          categoryReason: {
            type: Type.STRING,
            description: "Exposição do motivo pelo qual esta categoria foi escolhida"
          },
          ai_relevance_score: {
            type: Type.INTEGER,
            description: "Pontuação de relevância jornalística geral (0-100)"
          },
          ai_regional_impact_score: {
            type: Type.INTEGER,
            description: "Pontuação de impacto regional e utilidade para Presidente Prudente (0-100)"
          },
          ai_viral_potential_score: {
            type: Type.INTEGER,
            description: "Pontuação de potencial de compartilhamento social (0-100)"
          }
        },
        required: [
          "contentType",
          "isLocallyRelevant",
          "ai_title",
          "ai_summary",
          "ai_category",
          "categoryConfidence",
          "categoryReason",
          "ai_relevance_score",
          "ai_regional_impact_score",
          "ai_viral_potential_score"
        ]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analise a seguinte notícia de origem (${sourceName}):\nTítulo: ${title}\nConteúdo:\n${content}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Resposta do Gemini vazia');
      }

      const parsedData = JSON.parse(responseText.trim());
      
      // Forçar que o título da IA esteja sempre em maiúsculo
      if (parsedData.ai_title) {
        parsedData.ai_title = parsedData.ai_title.toUpperCase();
      }

      return parsedData;
    } catch (e) {
      console.error('[GarimpoService] Erro na análise Gemini:', e);
      return defaultFallback;
    }
  }

  /**
   * Varre todos os portais e fontes cadastrados e busca novas notícias com isolamento de falhas e deduplicação leve.
   */
  public async buscarNovasNoticias(limit = 10, supabaseClient = supabase): Promise<GarimpoStats> {
    const stats: GarimpoStats = {
      scraped: 0,
      newCandidates: 0,
      saved: 0,
      skipped: 0,
      duplicates: 0,
      old: 0,
      ignored: 0,
      errors: []
    };

    if (!isSupabaseConfigured) {
      stats.errors.push('Banco de dados Supabase não configurado.');
      return stats;
    }

    try {
      // 1. Verificar se a tabela existe para evitar erros não tratados
      const exists = await this.checkTableExists(supabaseClient);
      if (!exists) {
        stats.errors.push('MISSING_TABLE_ERROR');
        return stats;
      }

      // 2. Buscar candidatos recentes (últimos 7 dias) para cruzar e detectar deduplicações
      const recentLimitDate = new Date();
      recentLimitDate.setDate(recentLimitDate.getDate() - 7);
      const { data: recentCandidates, error: recentError } = await supabaseClient
        .from('news_candidates')
        .select('id, original_title, original_url, source_name')
        .gte('collected_at', recentLimitDate.toISOString());

      const recentList = recentCandidates || [];

      // 3. Iterar sobre todas as fontes registradas de forma isolada (se uma falhar, as outras continuam!)
      for (const source of this.sources) {
        try {
          console.log(`[GarimpoService] Iniciando coleta da fonte: ${source.name} (${source.url})`);
          
          // Verificar se é o primeiro sync para esta fonte
          const { count, error: countError } = await supabaseClient
            .from('news_candidates')
            .select('*', { count: 'exact', head: true })
            .eq('source_id', source.id);
          
          const isFirstSync = !countError && count === 0;
          const isG1 = source.id === 'g1-presidente-prudente';
          const daysLimit = (isG1 && isFirstSync) ? 30 : 7;
          
          const limitDate = new Date();
          limitDate.setDate(limitDate.getDate() - daysLimit);

          const scrapedItems = await source.fetchLatestItems(limit);

          if (scrapedItems.length === 0) {
            console.log(`[GarimpoService] Nenhum item retornado pela fonte ${source.name}.`);
            continue;
          }

          // Filtrar por data da janela limite
          const itemsWithinWindow = scrapedItems.filter(item => {
            const pubDate = new Date(item.publishedAt);
            const isInWindow = pubDate >= limitDate;
            if (!isInWindow) {
              stats.old++;
            }
            return isInWindow;
          });

          stats.scraped += itemsWithinWindow.length;

          if (itemsWithinWindow.length === 0) {
            console.log(`[GarimpoService] Todos os itens da fonte ${source.name} estão fora da janela de ${daysLimit} dias.`);
            continue;
          }

          // Buscar IDs externos já existentes no banco para esta fonte específica para não duplicar
          const externalIds = itemsWithinWindow.map(item => item.externalId);
          const { data: existingCandidates, error: queryError } = await supabaseClient
            .from('news_candidates')
            .select('external_id')
            .eq('source_id', source.id)
            .in('external_id', externalIds);

          if (queryError) {
            console.error(`[GarimpoService] Erro ao buscar itens existentes para ${source.name}:`, queryError);
            stats.errors.push(`Erro ao validar existentes para ${source.name}: ${queryError.message}`);
            continue;
          }

          const existingIdsSet = new Set(existingCandidates?.map(row => row.external_id) || []);

          // Filtrar itens não coletados por ID externo
          const newItems = itemsWithinWindow.filter(item => !existingIdsSet.has(item.externalId));

          // Processar e salvar cada candidato novo
          for (const item of newItems) {
            try {
              // 4. Deduplicação Exata por URL antes de qualquer chamada para a IA (economia de custos)
              const { data: exactDuplicate, error: exactError } = await supabaseClient
                .from('news_candidates')
                .select('id')
                .eq('original_url', item.url)
                .limit(1)
                .maybeSingle();

              if (exactDuplicate) {
                console.log(`[GarimpoService] Deduplicação Exata: URL já processada anteriormente: ${item.url}`);
                stats.duplicates++;
                continue;
              }

              // Obter detalhes completos da notícia
              const detailedItem = source.fetchItemDetails 
                ? await source.fetchItemDetails(item)
                : item;

              // Sanitização prévia de dados para G1
              const cleanTitle = isG1 ? sanitizeG1Title(detailedItem.title) : detailedItem.title;
              const cleanExcerpt = isG1 ? sanitizeG1Text(detailedItem.excerpt || '') : (detailedItem.excerpt || '');
              const cleanContent = isG1 ? sanitizeG1Text(detailedItem.content || '') : (detailedItem.content || '');

              // Análise inteligente com o Gemini
              const aiAnalysis = await this.analyzeWithGemini(
                cleanTitle,
                cleanContent || cleanExcerpt || cleanTitle,
                source.name,
                isG1
              );

              // 5. Filtragem Editorial Inteligente: descartar irrelevantes ou de tipos não jornalísticos (receitas, entretenimento nacional, etc.)
              const isIgnoredType = aiAnalysis.contentType === 'recipe' || aiAnalysis.contentType === 'generic_content';
              if (!aiAnalysis.isLocallyRelevant || isIgnoredType) {
                console.log(`[GarimpoService] Filtragem IA: Item descartado por baixa relevância local ou categoria não jornalística: "${cleanTitle}" (contentType: ${aiAnalysis.contentType}, isLocallyRelevant: ${aiAnalysis.isLocallyRelevant})`);
                stats.ignored++;
                continue;
              }

              // 6. Deduplicação Semântica de Cobertura de Pauta
              let possibleDuplicateOf: string | null = null;
              let isCriticalDuplicate = false;

              for (const recent of recentList) {
                if (recent.source_name !== source.name) {
                  const similarity = this.checkTitleSimilarityValue(cleanTitle, recent.original_title);
                  if (similarity >= 0.45) {
                    possibleDuplicateOf = recent.id;
                    if (similarity >= 0.75) {
                      isCriticalDuplicate = true;
                    }
                    console.log(`[GarimpoService] Deduplicação Semântica: Similaridade de ${Math.round(similarity * 100)}% entre "${cleanTitle}" e "${recent.original_title}" (Crítico: ${isCriticalDuplicate})`);
                    break;
                  }
                }
              }

              stats.newCandidates++;

              // Configurar metadados do provedor e direitos autorais
              const imageUsageStatus = isG1 ? 'unknown' : 'allowed'; // G1 é 'unknown' (necessita de análise ou imagem própria), prefeitura é domínio público

              // NUNCA rejeitar automaticamente por duplicidade semântica (rejeição automática reservada apenas para duplicidade exata de URL)
              const candStatus = 'pending';
              const editorialStatusVal = 'coletada';
              const aiAnalysisStatusVal = 'Analisado';

              // Objeto completo com novos campos
              const insertObj: any = {
                source_name: source.name,
                source_url: source.url,
                external_id: detailedItem.externalId,
                original_url: detailedItem.url,
                original_title: cleanTitle,
                original_excerpt: cleanExcerpt,
                original_image_url: detailedItem.imageUrl || null,
                original_published_at: detailedItem.publishedAt,
                status: candStatus,
                ai_title: aiAnalysis.ai_title || cleanTitle.toUpperCase(),
                ai_summary: aiAnalysis.ai_summary || cleanExcerpt,
                ai_category: aiAnalysis.ai_category || 'CIDADE',
                ai_relevance_score: aiAnalysis.ai_relevance_score ?? 70,
                ai_regional_impact_score: aiAnalysis.ai_regional_impact_score ?? 70,
                ai_viral_potential_score: aiAnalysis.ai_viral_potential_score ?? 60,
                
                // Novos campos estruturados da Segunda Onda
                source_id: source.id,
                source_type: source.sourceType,
                source_image_url: detailedItem.imageUrl || null,
                image_usage_status: imageUsageStatus,
                editorial_status: editorialStatusVal,
                ai_analysis_status: aiAnalysisStatusVal,
                ai_analyzed_at: new Date().toISOString(),
                ai_model: 'gemini-3.5-flash'
              };

              if (possibleDuplicateOf) {
                insertObj.possible_duplicate_of = possibleDuplicateOf;
              }

              // Inserir no banco de dados de forma tolerante a falhas
              const { data: insertedCandidate, error: insertError } = await supabaseClient
                .from('news_candidates')
                .insert(insertObj)
                .select('id')
                .maybeSingle();

              if (insertError) {
                console.warn(`[GarimpoService] Erro ao inserir com novos campos. Tentando fallback tradicional...`, insertError);
                
                // Fallback tradicional caso o usuário ainda não tenha rodado o script de migração SQL
                const fallbackObj: any = {
                  source_name: source.name,
                  source_url: source.url,
                  external_id: detailedItem.externalId,
                  original_url: detailedItem.url,
                  original_title: cleanTitle,
                  original_excerpt: cleanExcerpt,
                  original_image_url: detailedItem.imageUrl || null,
                  original_published_at: detailedItem.publishedAt,
                  status: candStatus,
                  ai_title: aiAnalysis.ai_title || cleanTitle.toUpperCase(),
                  ai_summary: aiAnalysis.ai_summary || cleanExcerpt,
                  ai_category: aiAnalysis.ai_category || 'CIDADE',
                  ai_relevance_score: aiAnalysis.ai_relevance_score ?? 70,
                  ai_regional_impact_score: aiAnalysis.ai_regional_impact_score ?? 70,
                  ai_viral_potential_score: aiAnalysis.ai_viral_potential_score ?? 60
                };

                if (possibleDuplicateOf) {
                  fallbackObj.possible_duplicate_of = possibleDuplicateOf;
                }

                const { data: fallbackInserted, error: fallbackError } = await supabaseClient
                  .from('news_candidates')
                  .insert(fallbackObj)
                  .select('id')
                  .maybeSingle();

                if (fallbackError) {
                  console.error(`[GarimpoService] Falha definitiva ao salvar candidato ${item.externalId}:`, fallbackError);
                  stats.errors.push(`Erro ao salvar notícia ID ${item.externalId}: ${fallbackError.message}`);
                } else {
                  stats.saved++;
                  if (fallbackInserted) {
                    recentList.push({
                      id: fallbackInserted.id,
                      original_title: cleanTitle,
                      original_url: detailedItem.url,
                      source_name: source.name
                    });
                  }
                }
              } else {
                stats.saved++;
                if (insertedCandidate) {
                  recentList.push({
                    id: insertedCandidate.id,
                    original_title: cleanTitle,
                    original_url: detailedItem.url,
                    source_name: source.name
                  });
                }
              }
            } catch (itemErr: any) {
              console.error(`[GarimpoService] Falha ao processar item individual ${item.externalId} da fonte ${source.name}:`, itemErr);
              stats.errors.push(`Falha no item ${item.externalId} de ${source.name}: ${itemErr.message || itemErr}`);
            }
          }
        } catch (sourceErr: any) {
          // ISOLAMENTO DE FALHAS: Se uma fonte falhar ou estiver fora do ar, registramos o erro, mas continuamos processando as outras fontes normalmente!
          console.error(`[GarimpoService] Erro na varredura da fonte ${source.name}:`, sourceErr);
          stats.errors.push(`Falha crítica na fonte ${source.name}: ${sourceErr.message || sourceErr}`);
        }
      }

      stats.skipped = stats.scraped - stats.saved;
      return stats;
    } catch (err: any) {
      console.error('[GarimpoService] Erro geral na varredura multi-fontes:', err);
      stats.errors.push(`Erro geral de varredura: ${err.message || err}`);
      return stats;
    }
  }

  /**
   * Rejeita um candidato a notícia, atualizando também o status editorial se as colunas existirem
   */
  public async rejectCandidate(id: string, supabaseClient = supabase) {
    if (!isSupabaseConfigured) return false;
    try {
      const updatePayload: any = { 
        status: 'rejected', 
        updated_at: new Date().toISOString() 
      };

      // Tenta atualizar colunas novas de forma segura
      updatePayload.editorial_status = 'rejeitada';

      const { error } = await supabaseClient
        .from('news_candidates')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.warn('[GarimpoService] Erro ao rejeitar com novos campos, tentando fallback...', error);
        // Fallback tradicional
        const { error: fallbackError } = await supabaseClient
          .from('news_candidates')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', id);

        if (fallbackError) throw fallbackError;
      }
      return true;
    } catch (err) {
      console.error('[GarimpoService] Erro ao rejeitar candidato:', err);
      throw err;
    }
  }

  /**
   * Aprova e publica um candidato a notícia no feed principal do portal Melhora Prudente.
   * Copia os dados do candidato revisados para a tabela oficial 'news' e registra o histórico editorial.
   */
  public async approveAndPublishCandidate(id: string, finalData: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    cover_image?: string;
    city_slug?: string;
    city_name?: string;
    status: 'published' | 'draft';
  }, supabaseClient = supabase, approvedByUserId?: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    try {
      // 1. Buscar dados originais do candidato
      const { data: candidate, error: fetchError } = await supabaseClient
        .from('news_candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !candidate) {
        throw new Error('Candidato não encontrado ou erro de leitura: ' + fetchError?.message);
      }

      // 2. Gerar Slug seguro em maiúsculas/normalizado
      const slugBase = finalData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Mantém apenas alfanuméricos, espaços e traços
        .trim()
        .replace(/\s+/g, '-'); // Troca espaços por hifens

      const uniqueSuffix = candidate.external_id || Math.floor(Math.random() * 10000);
      const slug = `${slugBase}-${uniqueSuffix}`;

      // 3. Adicionar Atribuição Obrigatória para respeitar autoria de conteúdo de terceiros
      const linkFonte = `<p class="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500"><strong>Fonte original:</strong> <a href="${candidate.original_url}" target="_blank" rel="noopener noreferrer" class="text-red-600 hover:underline hover:text-red-800 font-medium">${candidate.source_name}</a></p>`;
      
      let finalContent = finalData.content;
      if (!finalContent.includes(candidate.original_url)) {
        finalContent += `\n\n${linkFonte}`;
      }

      // 4. Copiar para a tabela oficial 'news'
      const { data: newsData, error: newsError } = await supabaseClient
        .from('news')
        .insert({
          title: finalData.title.toUpperCase(), // Garantir título em maiúsculo
          slug,
          content: finalContent,
          excerpt: finalData.excerpt,
          cover_image: finalData.cover_image || candidate.original_image_url || null,
          category: finalData.category,
          status: finalData.status, // published ou draft
          city_slug: finalData.city_slug || 'presidente-prudente',
          city_name: finalData.city_name || 'Presidente Prudente',
          region: 'SP',
          is_breaking: false,
          ai_classification: 'Garimpo IA',
          ai_summary: candidate.ai_summary || finalData.excerpt,
          ai_relevance_score: candidate.ai_relevance_score || 50,
          ai_viral_potential_score: candidate.ai_viral_potential_score || 50,
          ai_regional_impact_score: candidate.ai_regional_impact_score || 50,
          ai_seo_title: finalData.title.substring(0, 55),
          ai_seo_description: finalData.excerpt.substring(0, 150)
        })
        .select()
        .single();

      if (newsError) {
        throw new Error('Falha ao inserir notícia no feed oficial: ' + newsError.message);
      }

      // 5. Atualizar o status do candidato para 'published' (ou 'approved' se inserido como rascunho)
      const finalStatus = finalData.status === 'published' ? 'published' : 'approved';
      const editorialStatus = finalData.status === 'published' ? 'publicada' : 'aprovada';

      const updatePayload: any = {
        status: finalStatus,
        updated_at: new Date().toISOString()
      };

      // Tenta preencher colunas de histórico editorial da Segunda Onda de forma segura e tolerante a falhas
      updatePayload.editorial_status = editorialStatus;
      if (approvedByUserId) {
        updatePayload.approved_by = approvedByUserId;
        updatePayload.approved_at = new Date().toISOString();
      }
      if (newsData?.id) {
        updatePayload.published_news_id = newsData.id;
      }

      try {
        const { error: updateError } = await supabaseClient
          .from('news_candidates')
          .update(updatePayload)
          .eq('id', id);

        if (updateError) {
          console.warn('[GarimpoService] Erro ao atualizar status completo, tentando fallback...', updateError);
          // Fallback tradicional
          await supabaseClient
            .from('news_candidates')
            .update({
              status: finalStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
        }
      } catch (updateErr) {
        console.warn('[GarimpoService] Exceção ao atualizar status completo, tentando fallback...', updateErr);
        await supabaseClient
          .from('news_candidates')
          .update({
            status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      }

      return newsData;
    } catch (err: any) {
      console.error('[GarimpoService] Erro no processo de aprovação/publicação:', err);
      throw err;
    }
  }
}

export const garimpoService = new GarimpoService();

