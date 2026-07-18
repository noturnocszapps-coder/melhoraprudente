import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PrefeituraPrudenteSource } from './prefeitura-prudente';
import { ScrapedNewsItem } from './types';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini client server-side safely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

export interface GarimpoStats {
  scraped: number;
  newCandidates: number;
  saved: number;
  skipped: number;
  errors: string[];
}

export class GarimpoService {
  private prefeituraSource = new PrefeituraPrudenteSource();

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
   * Executa a análise inteligente do Gemini para o candidato a notícia
   */
  private async analyzeWithGemini(title: string, content: string) {
    const defaultFallback = {
      ai_title: title.toUpperCase(),
      ai_summary: content.substring(0, 180) + '...',
      ai_category: 'Cidade',
      ai_relevance_score: 75,
      ai_regional_impact_score: 80,
      ai_viral_potential_score: 60
    };

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[GarimpoService] GEMINI_API_KEY não configurada. Usando heurística padrão.');
      return defaultFallback;
    }

    try {
      const systemInstruction = `Você é uma Inteligência Editorial do portal jornalístico "Melhora Prudente".
Sua tarefa é analisar a notícia oficial fornecida e retornar obrigatoriamente um objeto JSON com:
1. "ai_title": Um título cativante, atraente para as redes sociais e jornalismo local. IMPORTANTE: O TÍTULO DEVE SER CONVERTIDO INTEIRAMENTE PARA MAIÚSCULO.
2. "ai_summary": Um resumo curto e elegante em português com no máximo 3 frases, destacando o impacto regional.
3. "ai_category": A melhor categoria correspondente para o portal, obrigatoriamente uma destas: "Cidade", "Política", "Segurança", "Esportes", "Cultura", "Geral", "Economia", "Tecnologia", "Mundo".
4. "ai_relevance_score": Um número inteiro de 0 a 100 medindo a importância jornalística geral.
5. "ai_regional_impact_score": Um número inteiro de 0 a 100 medindo o impacto específico para os moradores de Presidente Prudente (se a notícia afeta serviços municipais, editais públicos, vias locais ou lazer da cidade, deve ser alto: 80-100).
6. "ai_viral_potential_score": Um número inteiro de 0 a 100 medindo o potencial de viralização em redes sociais.

A resposta deve ser exclusivamente o JSON formatado. Não adicione textos adicionais antes ou depois.`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          ai_title: {
            type: Type.STRING,
            description: "Título alternativo cativante jornalístico EM LETRAS MAIÚSCULAS"
          },
          ai_summary: {
            type: Type.STRING,
            description: "Resumo jornalístico de 2 a 3 frases em português formal"
          },
          ai_category: {
            type: Type.STRING,
            enum: ["Cidade", "Política", "Segurança", "Esportes", "Cultura", "Geral", "Economia", "Tecnologia", "Mundo"],
            description: "Categoria editorial principal"
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
          "ai_title",
          "ai_summary",
          "ai_category",
          "ai_relevance_score",
          "ai_regional_impact_score",
          "ai_viral_potential_score"
        ]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analise a seguinte notícia:\nTítulo: ${title}\nConteúdo:\n${content}`,
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
   * Varre o portal oficial e busca novas notícias que ainda não foram coletadas.
   */
  public async buscarNovasNoticias(limit = 10, supabaseClient = supabase): Promise<GarimpoStats> {
    const stats: GarimpoStats = {
      scraped: 0,
      newCandidates: 0,
      saved: 0,
      skipped: 0,
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

      // 2. Coleta itens da listagem principal (Prefeitura)
      const scrapedItems = await this.prefeituraSource.fetchLatestItems(limit);
      stats.scraped = scrapedItems.length;

      if (scrapedItems.length === 0) {
        return stats;
      }

      // 3. Buscar os IDs externos já existentes para não duplicar
      const externalIds = scrapedItems.map(item => item.externalId);
      const { data: existingCandidates, error: queryError } = await supabaseClient
        .from('news_candidates')
        .select('external_id')
        .in('external_id', externalIds);

      if (queryError) {
        throw queryError;
      }

      const existingIdsSet = new Set(existingCandidates?.map(row => row.external_id) || []);

      // 4. Filtrar notícias novas
      const newItems = scrapedItems.filter(item => !existingIdsSet.has(item.externalId));
      stats.newCandidates = newItems.length;

      // 5. Para cada notícia nova, buscar detalhes e analisar com IA
      for (const item of newItems) {
        try {
          // Coleta detalhes da notícia (conteúdo principal e imagem de capa)
          const detailedItem = await this.prefeituraSource.fetchItemDetails(item);

          // Análise Inteligente com o Gemini
          const aiAnalysis = await this.analyzeWithGemini(
              detailedItem.title,
              detailedItem.content || ''
          );

          // Salvar como candidato no banco de dados com status 'pending'
          const { error: insertError } = await supabaseClient
            .from('news_candidates')
            .insert({
              source_name: this.prefeituraSource.name,
              source_url: this.prefeituraSource.url,
              external_id: detailedItem.externalId,
              original_url: detailedItem.url,
              original_title: detailedItem.title,
              original_excerpt: detailedItem.excerpt,
              original_image_url: detailedItem.imageUrl || null,
              original_published_at: detailedItem.publishedAt,
              status: 'pending',
              ai_title: aiAnalysis.ai_title || detailedItem.title.toUpperCase(),
              ai_summary: aiAnalysis.ai_summary || detailedItem.excerpt,
              ai_category: aiAnalysis.ai_category || 'Cidade',
              ai_relevance_score: aiAnalysis.ai_relevance_score ?? 70,
              ai_regional_impact_score: aiAnalysis.ai_regional_impact_score ?? 70,
              ai_viral_potential_score: aiAnalysis.ai_viral_potential_score ?? 60
            });

          if (insertError) {
            console.error(`[GarimpoService] Erro ao inserir candidato ${item.externalId}:`, insertError);
            stats.errors.push(`Erro ao salvar notícia ID ${item.externalId}: ${insertError.message}`);
          } else {
            stats.saved++;
          }
        } catch (detailErr: any) {
          console.error(`[GarimpoService] Falha ao processar item individual ${item.externalId}:`, detailErr);
          stats.errors.push(`Falha ao processar item ${item.externalId}: ${detailErr.message || detailErr}`);
        }
      }

      stats.skipped = stats.scraped - stats.saved;
      return stats;
    } catch (err: any) {
      console.error('[GarimpoService] Erro geral na varredura:', err);
      stats.errors.push(`Erro geral de varredura: ${err.message || err}`);
      return stats;
    }
  }

  /**
   * Rejeita um candidato a notícia
   */
  public async rejectCandidate(id: string, supabaseClient = supabase) {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabaseClient
        .from('news_candidates')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[GarimpoService] Erro ao rejeitar candidato:', err);
      throw err;
    }
  }

  /**
   * Aprova e publica um candidato a notícia no feed principal do portal Melhora Prudente.
   * Copia os dados do candidato revisados para a tabela oficial 'news'.
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
  }, supabaseClient = supabase) {
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

      // 3. Adicionar Atribuição Obrigatória (Fonte: Prefeitura de Presidente Prudente)
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
      const { error: updateError } = await supabaseClient
        .from('news_candidates')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.warn('[GarimpoService] Erro ao atualizar status do candidato, mas a notícia foi publicada:', updateError);
      }

      return newsData;
    } catch (err: any) {
      console.error('[GarimpoService] Erro no processo de aprovação/publicação:', err);
      throw err;
    }
  }
}

export const garimpoService = new GarimpoService();
