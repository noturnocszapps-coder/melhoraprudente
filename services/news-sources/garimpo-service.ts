import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PrefeituraPrudenteSource } from './prefeitura-prudente';
import { G1PresidentePrudenteSource } from './g1-presidente-prudente';
import { InovaPrudenteSource } from './inova-prudente';
import { NewsSource, ScrapedNewsItem } from './types';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { cleanRawScrapedText, createCleanExcerpt } from './cleaner';

// Initialize Gemini client server-side safely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

export function sanitizeG1Text(text: string): string {
  if (!text) return '';
  let cleaned = cleanRawScrapedText(text);

  return cleaned
    .replace(/Participe do (canal|grupo|comunidade) do g1[^\n.]*/gi, '')
    .replace(/Veja mais notícias [^\n.]*/gi, '')
    .replace(/Leia mais [^\n.]*/gi, '')
    .replace(/Siga o g1[^\n.]*/gi, '')
    .replace(/VÍDEOS:\s*[^\n.]*/gi, '')
    .replace(/Fonte original:\s*[^\n.]*/gi, '')
    .replace(/#\w+/g, '')
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

export function getGarimpoMinimumDate(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '', 10) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '', 10);
  
  // Criar data de hoje 00:00 no fuso de São Paulo (UTC-3)
  const todayInSP = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
  
  // Ontem às 00:00 no fuso de São Paulo
  const yesterdayInSP = new Date(todayInSP.getTime() - 24 * 60 * 60 * 1000);
  return yesterdayInSP;
}

export interface SourceBreakdown {
  id: string;
  name: string;
  status: 'Operacional' | 'Indisponível';
  scraped: number;
  newCandidates: number;
  old: number;
  duplicates: number;
  ignored: number;
  saved: number;
  error?: string;
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
  sourcesBreakdown?: SourceBreakdown[];
}

export class GarimpoService {
  private sources: NewsSource[] = [
    new PrefeituraPrudenteSource(),
    new G1PresidentePrudenteSource(),
    new InovaPrudenteSource()
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
   * Limpa candidatas pendentes antigas marcando-as como 'rejected' (rejeitadas por antiguidade).
   */
  public async limparCandidatasAntigas(supabaseClient = supabase) {
    if (!isSupabaseConfigured) return;
    try {
      const minDate = getGarimpoMinimumDate();
      
      const { error } = await supabaseClient
        .from('news_candidates')
        .update({ 
          status: 'rejected', 
          editorial_status: 'rejeitada',
          updated_at: new Date().toISOString() 
        })
        .eq('status', 'pending')
        .lt('original_published_at', minDate.toISOString());

      if (error) {
        console.warn('[GarimpoService] Erro ao limpar candidatas antigas, tentando sem editorial_status:', error);
        // Fallback para quando as colunas novas ainda não estiverem migradas
        await supabaseClient
          .from('news_candidates')
          .update({ 
            status: 'rejected', 
            updated_at: new Date().toISOString() 
          })
          .eq('status', 'pending')
          .lt('original_published_at', minDate.toISOString());
      }
    } catch (err) {
      console.error('[GarimpoService] Erro ao limpar candidatas antigas:', err);
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
      // Limpar as pendentes antigas automaticamente antes de listar
      if (status === 'pending') {
        await this.limparCandidatasAntigas(supabaseClient);
      }

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
  public async analyzeWithGemini(title: string, content: string, sourceName: string, isG1: boolean) {
    const defaultFallback = {
      contentType: "regional_news",
      isLocallyRelevant: true,
      ai_title: title.toUpperCase(),
      ai_summary: content || title,
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
Para fontes de terceiros (como G1), você deve obrigatoriamente gerar um TEXTO EDITORIAL ÚNICO, FLUIDO E COESO.
- NUNCA comece com um resumo/lead e depois reinicie ou repita a história. O texto inteiro deve ser composto de 2 a 4 parágrafos contínuos de narrativa jornalística.
- NUNCA repita fatos, frases ou parágrafos no mesmo texto.
- NUNCA anexe nem misture o texto bruto original da fonte.
- NUNCA inclua chamadas promocionais, links de redes sociais, canais de WhatsApp ou frases como 'veja mais'.
- NUNCA inclua linhas de 'Fonte original:' ou atribuições de rodapé no campo ai_summary (a atribuição oficial em HTML é inserida automaticamente pelo sistema na publicação).

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
      newCandidates: 0, // Recentes
      saved: 0,
      skipped: 0,
      duplicates: 0,
      old: 0, // Antigas
      ignored: 0,
      errors: [],
      sourcesBreakdown: []
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

      // 2. Limpar candidatas antigas da fila ativa antes de qualquer nova varredura
      await this.limparCandidatasAntigas(supabaseClient);

      // 3. Buscar candidatos recentes (últimos 7 dias) para cruzar e detectar deduplicações
      const recentLimitDate = new Date();
      recentLimitDate.setDate(recentLimitDate.getDate() - 7);
      const { data: recentCandidates, error: recentError } = await supabaseClient
        .from('news_candidates')
        .select('id, original_title, original_url, source_name')
        .gte('collected_at', recentLimitDate.toISOString());

      const recentList = recentCandidates || [];

      // 4. Obter a janela temporal estrita (Início de Ontem America/Sao_Paulo)
      const limitDate = getGarimpoMinimumDate();
      console.log(`[GarimpoService] Janela Temporal Global - Data Mínima de Publicação: ${limitDate.toISOString()} (${limitDate.toLocaleDateString('pt-BR')} America/Sao_Paulo)`);

      // 5. Iterar sobre todas as fontes registradas de forma isolada
      for (const source of this.sources) {
        const srcBreakdown: SourceBreakdown = {
          id: source.id,
          name: source.name,
          status: 'Operacional',
          scraped: 0,
          newCandidates: 0,
          old: 0,
          duplicates: 0,
          ignored: 0,
          saved: 0
        };

        try {
          console.log(`[GarimpoService] Iniciando coleta da fonte: ${source.name} (${source.url})`);
          
          const scrapedItems = await source.fetchLatestItems(limit);
          srcBreakdown.scraped = scrapedItems.length;
          stats.scraped += scrapedItems.length;

          if (scrapedItems.length === 0) {
            console.log(`[GarimpoService] Nenhum item retornado pela fonte ${source.name}.`);
            stats.sourcesBreakdown?.push(srcBreakdown);
            continue;
          }

          const isG1 = source.id === 'g1-presidente-prudente';

          // Processar e salvar cada candidato novo
          for (const item of scrapedItems) {
            try {
              // A. FILTRO TEMPORAL GLOBAL: ontem em diante
              let isOld = false;
              if (!item.publishedAt || item.publishedAt === 'unknown') {
                isOld = true;
                console.log(`[GarimpoService] Filtro Temporal: Descartado por data ausente/desconhecida. Matéria: "${item.title}"`);
              } else {
                const pubDate = new Date(item.publishedAt);
                if (isNaN(pubDate.getTime())) {
                  isOld = true;
                  console.log(`[GarimpoService] Filtro Temporal: Descartado por data inválida (${item.publishedAt}). Matéria: "${item.title}"`);
                } else if (pubDate < limitDate) {
                  isOld = true;
                  console.log(`[GarimpoService] Filtro Temporal: Descartado por ser ANTIGA. Publicada: ${pubDate.toISOString()} < Limite: ${limitDate.toISOString()}. Matéria: "${item.title}"`);
                }
              }

              if (isOld) {
                srcBreakdown.old++;
                stats.old++;
                continue;
              }

              // Se passou pelo filtro temporal, é considerada RECENTE (Identificada)
              srcBreakdown.newCandidates++;
              stats.newCandidates++;

              // B. DEDUPLICAÇÃO EXATA por URL ou ID Externo no banco de dados antes da chamada da IA
              const { data: exactDuplicateByUrl } = await supabaseClient
                .from('news_candidates')
                .select('id')
                .eq('original_url', item.url)
                .limit(1)
                .maybeSingle();

              let isDuplicate = !!exactDuplicateByUrl;

              if (!isDuplicate) {
                const { data: exactDuplicateById } = await supabaseClient
                  .from('news_candidates')
                  .select('id')
                  .eq('source_id', source.id)
                  .eq('external_id', item.externalId)
                  .limit(1)
                  .maybeSingle();
                
                isDuplicate = !!exactDuplicateById;
              }

              if (isDuplicate) {
                console.log(`[GarimpoService] Deduplicação Exata: Item já processado anteriormente: ${item.url}`);
                srcBreakdown.duplicates++;
                stats.duplicates++;
                continue;
              }

              // C. DETALHAMENTO E SANITIZAÇÃO
              const detailedItem = source.fetchItemDetails 
                ? await source.fetchItemDetails(item)
                : item;

              const cleanTitle = isG1 ? sanitizeG1Title(detailedItem.title) : detailedItem.title;
              const cleanContent = isG1 ? sanitizeG1Text(detailedItem.content || '') : cleanRawScrapedText(detailedItem.content || '');

              // D. ANÁLISE COM O GEMINI
              let aiAnalysis;
              try {
                aiAnalysis = await this.analyzeWithGemini(
                  cleanTitle,
                  cleanContent || cleanTitle,
                  source.name,
                  isG1
                );
              } catch (geminiErr: any) {
                console.error(`[GarimpoService] Erro na análise Gemini do item ${item.externalId}:`, geminiErr);
                stats.errors.push(`Erro na IA do item "${cleanTitle}" de ${source.name}: ${geminiErr.message || geminiErr}`);
                continue; // Conta como erro de processamento
              }

              if (isG1 && aiAnalysis.ai_summary) {
                aiAnalysis.ai_summary = sanitizeG1Text(aiAnalysis.ai_summary);
              }

              const aiContentClean = aiAnalysis.ai_summary || cleanContent;
              const safeShortExcerpt = createCleanExcerpt(aiContentClean || cleanContent, 200);

              // E. FILTRAGEM EDITORIAL INTELIGENTE POR IA
              const isIgnoredType = aiAnalysis.contentType === 'recipe' || aiAnalysis.contentType === 'generic_content';
              if (!aiAnalysis.isLocallyRelevant || isIgnoredType) {
                console.log(`[GarimpoService] Filtragem IA: Item descartado por irrelevância regional: "${cleanTitle}"`);
                srcBreakdown.ignored++;
                stats.ignored++;
                continue;
              }

              // F. DEDUPLICAÇÃO SEMÂNTICA DE COBERTURA DE PAUTA
              let possibleDuplicateOf: string | null = null;
              for (const recent of recentList) {
                if (recent.source_name !== source.name) {
                  const similarity = this.checkTitleSimilarityValue(cleanTitle, recent.original_title);
                  if (similarity >= 0.45) {
                    possibleDuplicateOf = recent.id;
                    console.log(`[GarimpoService] Deduplicação Semântica: Similaridade de ${Math.round(similarity * 100)}% entre "${cleanTitle}" e "${recent.original_title}"`);
                    break;
                  }
                }
              }

              // G. PERSISTÊNCIA DOS CANDIDATOS FILTRADOS
              const imageUsageStatus = isG1 ? 'unknown' : 'allowed';
              const candStatus = 'pending';
              const editorialStatusVal = 'coletada';
              const aiAnalysisStatusVal = 'Analisado';

              const insertObj: any = {
                source_name: source.name,
                source_url: source.url,
                external_id: detailedItem.externalId,
                original_url: detailedItem.url,
                original_title: cleanTitle,
                original_excerpt: safeShortExcerpt,
                original_image_url: detailedItem.imageUrl || null,
                original_published_at: detailedItem.publishedAt,
                status: candStatus,
                ai_title: (aiAnalysis.ai_title || cleanTitle).toUpperCase(),
                ai_summary: aiContentClean,
                ai_category: aiAnalysis.ai_category || 'CIDADE',
                ai_relevance_score: aiAnalysis.ai_relevance_score ?? 70,
                ai_regional_impact_score: aiAnalysis.ai_regional_impact_score ?? 70,
                ai_viral_potential_score: aiAnalysis.ai_viral_potential_score ?? 60,
                
                source_id: source.id,
                source_type: source.sourceType,
                source_image_url: detailedItem.imageUrl || null,
                image_usage_status: imageUsageStatus,
                editorial_status: editorialStatusVal,
                ai_analysis_status: aiAnalysisStatusVal,
                ai_analyzed_at: new Date().toISOString(),
                ai_model: 'gemini-3.5-flash',
                original_content: cleanContent || null,
                ai_content: aiContentClean || null
              };

              if (possibleDuplicateOf) {
                insertObj.possible_duplicate_of = possibleDuplicateOf;
              }

              const { data: insertedCandidate, error: insertError } = await supabaseClient
                .from('news_candidates')
                .insert(insertObj)
                .select('id')
                .maybeSingle();

              if (insertError) {
                console.warn(`[GarimpoService] Erro ao inserir com novos campos, tentando fallback tradicional...`);
                
                const fallbackObj: any = {
                  source_name: source.name,
                  source_url: source.url,
                  external_id: detailedItem.externalId,
                  original_url: detailedItem.url,
                  original_title: cleanTitle,
                  original_excerpt: safeShortExcerpt,
                  original_image_url: detailedItem.imageUrl || null,
                  original_published_at: detailedItem.publishedAt,
                  status: candStatus,
                  ai_title: (aiAnalysis.ai_title || cleanTitle).toUpperCase(),
                  ai_summary: aiContentClean,
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
                  stats.errors.push(`Erro ao salvar notícia "${cleanTitle}" no Supabase: ${fallbackError.message}`);
                } else {
                  srcBreakdown.saved++;
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
                srcBreakdown.saved++;
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
              console.error(`[GarimpoService] Falha no item individual ${item.externalId}:`, itemErr);
              stats.errors.push(`Falha ao processar item "${item.title}" de ${source.name}: ${itemErr.message || itemErr}`);
            }
          }
        } catch (sourceErr: any) {
          console.error(`[GarimpoService] Erro crítico na fonte ${source.name}:`, sourceErr);
          srcBreakdown.status = 'Indisponível';
          srcBreakdown.error = sourceErr.message || String(sourceErr);
          stats.errors.push(`Falha crítica na fonte ${source.name}: ${sourceErr.message || sourceErr}`);
        }

        stats.sourcesBreakdown?.push(srcBreakdown);
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

      // 3. Adicionar Atribuição Obrigatória única em HTML para respeitar autoria de conteúdo de terceiros
      let cleanContentBody = sanitizeG1Text(finalData.content)
        .replace(/Fonte original:\s*G1[^\n.]*/gi, '')
        .replace(/Fonte original:\s*[^\n.]*/gi, '')
        .trim();

      const linkFonte = `<p class="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500"><strong>Fonte original:</strong> <a href="${candidate.original_url}" target="_blank" rel="noopener noreferrer" class="text-red-600 hover:underline hover:text-red-800 font-medium">${candidate.source_name}</a></p>`;
      
      let finalContent = cleanRawScrapedText(cleanContentBody);
      if (!finalContent.includes(candidate.original_url)) {
        finalContent += `\n\n${linkFonte}`;
      }

      // Garantir que o excerpt seja estritamente um resumo limpo e curto
      const cleanExcerpt = createCleanExcerpt(finalData.excerpt || finalContent, 200);

      // 4. Copiar para a tabela oficial 'news'
      const { data: newsData, error: newsError } = await supabaseClient
        .from('news')
        .insert({
          title: finalData.title.toUpperCase(), // Garantir título em maiúsculo
          slug,
          content: finalContent,
          excerpt: cleanExcerpt,
          cover_image: finalData.cover_image || candidate.original_image_url || null,
          category: finalData.category,
          status: finalData.status, // published ou draft
          city_slug: finalData.city_slug || 'presidente-prudente',
          city_name: finalData.city_name || 'Presidente Prudente',
          region: 'SP',
          is_breaking: false,
          ai_classification: 'Garimpo IA',
          ai_summary: candidate.ai_summary || cleanExcerpt,
          ai_relevance_score: candidate.ai_relevance_score || 50,
          ai_viral_potential_score: candidate.ai_viral_potential_score || 50,
          ai_regional_impact_score: candidate.ai_regional_impact_score || 50,
          ai_seo_title: finalData.title.substring(0, 55),
          ai_seo_description: cleanExcerpt.substring(0, 150)
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

  /**
   * Reprocessa individualmente um candidato a notícia usando o pipeline atualizado:
   * 1. Recupera o candidato no banco de dados
   * 2. Re-executa o scraper da fonte correspondente
   * 3. Limpa o conteúdo original recuperado com cleanRawScrapedText
   * 4. Submete o texto limpo ao Gemini AI para re-síntese
   * 5. Gera um excerpt limpo e curto
   * 6. Atualiza o registro em news_candidates sem alterar o status do candidato
   */
  public async reprocessCandidate(id: string, supabaseClient = supabase) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data: candidate, error: fetchErr } = await supabaseClient
      .from('news_candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !candidate) {
      throw new Error(`Candidato não encontrado: ${id}`);
    }

    const url = candidate.original_url || '';
    const sourceName = candidate.source_name || '';
    let matchedSource = this.sources.find(s => url.includes(s.url) || sourceName.toLowerCase().includes(s.name.toLowerCase()));

    if (!matchedSource) {
      if (url.includes('presidenteprudente.sp.gov.br')) {
        matchedSource = this.sources.find(s => s.id === 'prefeitura-presidente-prudente');
      } else if (url.includes('globo.com') || url.includes('g1')) {
        matchedSource = this.sources.find(s => s.id === 'g1-presidente-prudente');
      } else if (url.includes('inovaprudente')) {
        matchedSource = this.sources.find(s => s.id === 'inova-prudente');
      }
    }

    if (!matchedSource) {
      matchedSource = this.sources[1]; // Fallback para G1
    }

    const isG1 = matchedSource.id === 'g1-presidente-prudente';

    let detailedContent = candidate.original_content || '';
    let imageUrl = candidate.original_image_url || '';

    try {
      if (matchedSource.fetchItemDetails) {
        const scrapedItem = await matchedSource.fetchItemDetails({
          externalId: candidate.external_id || candidate.id,
          title: candidate.original_title,
          url: candidate.original_url,
          publishedAt: candidate.original_published_at || new Date().toISOString()
        });

        if (scrapedItem.content && scrapedItem.content.length > 50) {
          detailedContent = scrapedItem.content;
        }
        if (scrapedItem.imageUrl) {
          imageUrl = scrapedItem.imageUrl;
        }
      }
    } catch (scrapeErr) {
      console.warn(`[reprocessCandidate] Aviso ao re-raspar fonte para ${id}:`, scrapeErr);
    }

    const cleanContent = isG1 ? sanitizeG1Text(detailedContent) : cleanRawScrapedText(detailedContent);
    const cleanTitle = isG1 ? sanitizeG1Title(candidate.original_title) : candidate.original_title;
    const aiAnalysis = await this.analyzeWithGemini(cleanTitle, cleanContent, matchedSource.name, isG1);

    if (isG1) {
      if (aiAnalysis.ai_summary) {
        aiAnalysis.ai_summary = sanitizeG1Text(aiAnalysis.ai_summary);
      }
      if (aiAnalysis.ai_title) {
        aiAnalysis.ai_title = sanitizeG1Title(aiAnalysis.ai_title);
      }
    }

    const aiContentClean = aiAnalysis.ai_summary || cleanContent;
    const cleanExcerpt = createCleanExcerpt(aiContentClean, 200);

    // Validação de Qualidade Estrita para G1
    if (isG1) {
      const validationErrors: string[] = [];

      if (!cleanExcerpt || cleanExcerpt.length > 220) {
        validationErrors.push(`Excerpt excede 220 caracteres (${cleanExcerpt ? cleanExcerpt.length : 0} chars)`);
      }
      if (cleanExcerpt.includes('\n')) {
        validationErrors.push('Excerpt contém quebras de linha/múltiplos parágrafos');
      }

      const checkText = (aiContentClean || '') + ' ' + (cleanContent || '') + ' ' + cleanExcerpt;
      const lowerCheck = checkText.toLowerCase();

      if (lowerCheck.includes('whatsapp')) {
        validationErrors.push('Conteúdo contém menção a WhatsApp');
      }
      if (lowerCheck.includes('assista às reportagens') || lowerCheck.includes('assista as reportagens')) {
        validationErrors.push('Conteúdo contém "assista às reportagens"');
      }
      if (lowerCheck.includes('notícias no g1') || lowerCheck.includes('noticias no g1')) {
        validationErrors.push('Conteúdo contém "notícias no g1"');
      }
      if (lowerCheck.includes('leia também') || lowerCheck.includes('veja também')) {
        validationErrors.push('Conteúdo contém chamadas promocionais (LEIA TAMBÉM / VEJA TAMBÉM)');
      }
      if (checkText.includes(']]>')) {
        validationErrors.push('Conteúdo contém marcador XML ]]>');
      }
      if (checkText.includes('📲')) {
        validationErrors.push('Conteúdo contém emoji promocional 📲');
      }

      if (validationErrors.length > 0) {
        console.error(`[reprocessCandidate] Validação G1 falhou para o candidato ${id}:`, validationErrors);
        throw new Error(`Validação G1 falhou: ${validationErrors.join('; ')}`);
      }
    }

    const updatePayload: any = {
      original_content: cleanContent,
      ai_content: aiContentClean,
      ai_summary: aiContentClean,
      ai_title: (aiAnalysis.ai_title || cleanTitle).toUpperCase(),
      original_excerpt: cleanExcerpt,
      ai_category: aiAnalysis.ai_category || candidate.ai_category || 'CIDADE',
      ai_relevance_score: aiAnalysis.ai_relevance_score ?? candidate.ai_relevance_score ?? 70,
      ai_regional_impact_score: aiAnalysis.ai_regional_impact_score ?? candidate.ai_regional_impact_score ?? 70,
      ai_viral_potential_score: aiAnalysis.ai_viral_potential_score ?? candidate.ai_viral_potential_score ?? 60,
      ai_analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (imageUrl) {
      updatePayload.original_image_url = imageUrl;
      updatePayload.source_image_url = imageUrl;
    }

    const { data: updated, error: updateErr } = await supabaseClient
      .from('news_candidates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error(`[reprocessCandidate] Erro ao atualizar candidato ${id}:`, updateErr);
      throw updateErr;
    }

    return updated;
  }
}

export const garimpoService = new GarimpoService();

