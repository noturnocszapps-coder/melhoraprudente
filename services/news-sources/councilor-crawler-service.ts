import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini client server-side safely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

export interface Councilor {
  id?: string;
  external_id: string;
  name: string;
  display_name: string;
  party: string;
  photo_url: string;
  official_url: string;
  legislature: string;
  is_active: boolean;
}

export interface LegislativeAct {
  id?: string;
  external_id: string;
  act_type: string;
  act_category: string;
  number?: string;
  year?: string;
  title: string;
  summary?: string;
  protocol_date?: string;
  status?: string;
  official_url?: string;
  is_coauthored: boolean;
}

export const REAL_COUNCILORS: Councilor[] = [
  { external_id: "VER-1449", name: "WILLIAM CÉSAR LEITE", display_name: "WILLIAM CÉSAR LEITE", party: "PP", photo_url: "https://www.camarapprudente.sp.gov.br/temp/547e83dd44f5dc6c8ca91149d45a3ad1layout42_presidente.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Presidente/WILLIAM-CESAR-LEITE/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1449&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1465", name: "ARISTEU SANTOS PENALVA DE OLIVEIRA", display_name: "ARISTEU SANTOS PENALVA DE OLIVEIRA", party: "MDB", photo_url: "https://www.camarapprudente.sp.gov.br/temp/b4ace2dfd3667650852e4db88e901eeclayout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/ARISTEU-SANTOS-PENALVA-DE-OLIVEIRA/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1465&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1434", name: "DEMERSON DIAS", display_name: "DEMERSON DIAS", party: "REPUBLICANOS", photo_url: "https://www.camarapprudente.sp.gov.br/temp/4a3e862b79b37b29ecac794490c9137blayout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/DEMERSON-DIAS-/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1434&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-52", name: "DOUGLAS KATO PAULUZI", display_name: "DOUGLAS KATO PAULUZI", party: "PSD", photo_url: "https://www.camarapprudente.sp.gov.br/temp/394509fb8a538f6abf01a164b061af3dlayout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/DOUGLAS-KATO-PAULUZI/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=52&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1462", name: "EDGAR TERTULIANO CALDEIRA", display_name: "EDGAR TERTULIANO CALDEIRA", party: "UNIÃO BRASIL", photo_url: "https://www.camarapprudente.sp.gov.br/temp/13a13760c494a349ce2ee4189c5f7371layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/EDGAR-TERTULIANO-CALDEIRA/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1462&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1467", name: "EDUARDO CESAR DA SILVA OLIVEIRA", display_name: "EDUARDO CESAR DA SILVA OLIVEIRA", party: "PP", photo_url: "https://www.camarapprudente.sp.gov.br/temp/b7a1b7f7cb7af1f85fe0adf019f18e88layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/EDUARDO-CESAR-DA-SILVA-OLIVEIRA/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1467&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1441", name: "ENIO LUIZ TENÓRIO PERRONE", display_name: "ENIO LUIZ TENÓRIO PERRONE", party: "PSD", photo_url: "https://www.camarapprudente.sp.gov.br/temp/7e3b206c5fe31c682e8a18ff8f308443layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/ENIO-LUIZ-TENORIO-PERRONE/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1441&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1463", name: "GUILHERME DA SILVA ALENCAR", display_name: "GUILHERME DA SILVA ALENCAR", party: "REPUBLICANOS", photo_url: "https://www.camarapprudente.sp.gov.br/temp/47e430f32a106685c69314da7cf9d9c0layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/GUILHERME-DA-SILVA-ALENCAR/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1463&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-82", name: "IZAQUE JOSE DA SILVA", display_name: "IZAQUE JOSE DA SILVA", party: "PL", photo_url: "https://www.camarapprudente.sp.gov.br/temp/6bd24c418d1f1b61cfd8541327dc3fc3layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/IZAQUE-JOSE-DA-SILVA/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=82&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1464", name: "LUIS CESAR SAITO SANTOS", display_name: "LUIS CESAR SAITO SANTOS", party: "PP", photo_url: "https://www.camarapprudente.sp.gov.br/temp/19bf1ca7ca91344a470b42df61585853layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/LUIS-CESAR-SAITO-SANTOS/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1464&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1447", name: "MAURO MARQUES DAS NEVES", display_name: "MAURO MARQUES DAS NEVES", party: "PP", photo_url: "https://www.camarapprudente.sp.gov.br/temp/066cdace794e78909ddbd9143e9bdb8dlayout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/MAURO-MARQUES-DAS-NEVES/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1447&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1461", name: "SARA ELICIA SANTOS LOPES", display_name: "SARA ELICIA SANTOS LOPES", party: "UNIÃO BRASIL", photo_url: "https://www.camarapprudente.sp.gov.br/temp/dff4cd9bedf38bc03a7099e370738a70layout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/SARA-ELICIA-SANTOS-LOPES/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1461&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1452", name: "WELLINGTON DE SOUZA NEVES", display_name: "WELLINGTON DE SOUZA NEVES", party: "REPUBLICANOS", photo_url: "https://www.camarapprudente.sp.gov.br/temp/684404396d2929e7264aec12f9bbd82dlayout42vereador.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/WELLINGTON-DE-SOUZA-NEVES/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1452&idleg=23", legislature: "2025-2028", is_active: true },
  { external_id: "VER-1454", name: "TIAGO SANTOS DE OLIVEIRA", display_name: "TIAGO SANTOS DE OLIVEIRA", party: "PODE", photo_url: "https://www.camarapprudente.sp.gov.br/temp/a0898463c119f44ebdb023d5e1047320__layout42_vereadorafastado.jpg", official_url: "https://www.camarapprudente.sp.gov.br/site/VIGESIMA-TERCEIRA-CÂMARA---19--LEGISLATURA/Parlamentar/TIAGO--SANTOS-DE-OLIVEIRA/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&&idver=1454&idleg=23", legislature: "2025-2028", is_active: true }
];

export class CouncilorCrawlerService {
  /**
   * Verifica se as tabelas do Raio-X existem no banco
   */
  public async checkTablesExist(supabaseClient = supabase): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabaseClient
        .from('councilors')
        .select('id')
        .limit(1);
      
      if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        return false;
      }
      return true;
    } catch (err) {
      console.error('[CouncilorCrawler] Erro ao verificar tabelas:', err);
      return false;
    }
  }

  /**
   * Coletar a lista de vereadores diretamente do site oficial da Câmara
   */
  public async fetchOfficialCouncilorsList(): Promise<Councilor[]> {
    const url = 'https://www.camarapprudente.sp.gov.br/site/Proposituras/';
    try {
      console.log(`[CouncilorCrawler] Buscando vereadores ativos da Câmara em tempo real: ${url}...`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      
      const regex = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      const councilors: Councilor[] = [];
      const seenIds = new Set<string>();

      while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const linkInner = match[2];

        if (href.includes('/Parlamentar/') || href.includes('/Presidente/')) {
          const idverMatch = href.match(/idver=(\d+)/);
          if (!idverMatch) continue;
          const idver = idverMatch[1];

          if (seenIds.has(idver)) continue;
          seenIds.add(idver);

          const altMatch = linkInner.match(/alt="([^"]+)"/i) || linkInner.match(/title="([^"]+)"/i);
          let displayName = '';
          let party = '';
          
          if (altMatch) {
            const altText = altMatch[1].trim();
            const parts = altText.split(/\s*-\s*/);
            displayName = (parts[0] || '').replace(/\s+/g, ' ').trim();
            party = (parts[1] || '').replace(/\s+/g, ' ').trim();
          } else {
            const slugMatch = href.match(/\/(Parlamentar|Presidente)\/([^\/?]+)/);
            displayName = slugMatch ? slugMatch[2].replace(/-/g, ' ').replace(/\s+/g, ' ').trim() : `Vereador ID ${idver}`;
            party = 'Sem Partido';
          }

          const imgMatch = linkInner.match(/background:url\('([^']+)'\)/i) || linkInner.match(/src="([^"]+)"/i);
          const photoUrl = imgMatch ? imgMatch[1] : '';

          const isAfastado = photoUrl.toLowerCase().includes('afastado') || idver === '1454';
          const isActive = !isAfastado;

          let finalParty = party;
          let finalDisplayName = displayName;

          // Merge with static backups if live parsed is missing or sem partido
          const staticBackup = REAL_COUNCILORS.find(c => c.external_id === `VER-${idver}`);
          if (staticBackup) {
            if (!finalParty || finalParty === 'Sem Partido') {
              finalParty = staticBackup.party;
            }
            if (!finalDisplayName) {
              finalDisplayName = staticBackup.display_name;
            }
          }

          councilors.push({
            external_id: `VER-${idver}`,
            name: finalDisplayName || displayName,
            display_name: finalDisplayName || displayName,
            party: finalParty || party,
            photo_url: photoUrl,
            official_url: href,
            legislature: '2025-2028',
            is_active: isActive
          });
        }
      }

      if (councilors.length > 0) {
        console.log(`[CouncilorCrawler] Coletados ${councilors.length} vereadores reais da Câmara via Proposituras!`);
        return councilors;
      }
      throw new Error("Nenhum vereador encontrado no padrão de HTML.");
    } catch (e) {
      console.warn('[CouncilorCrawler] Erro ao buscar vereadores em tempo real, usando dados de backup:', e);
      return REAL_COUNCILORS;
    }
  }

  /**
   * Seedar vereadores reais na tabela caso ela esteja vazia, preferindo a fonte oficial
   */
  public async seedCouncilors(supabaseClient = supabase): Promise<number> {
    if (!isSupabaseConfigured) return 0;
    try {
      const { count, error: countError } = await supabaseClient
        .from('councilors')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      if (count === 0) {
        console.log(`[CouncilorCrawler] Obtendo vereadores ativos da fonte oficial para inicialização...`);
        const listToInsert = await this.fetchOfficialCouncilorsList();
        
        console.log(`[CouncilorCrawler] Semeando ${listToInsert.length} vereadores para a legislatura atual...`);
        const { error: insertError } = await supabaseClient
          .from('councilors')
          .insert(listToInsert);

        if (insertError) throw insertError;
        return listToInsert.length;
      }
      return 0;
    } catch (err) {
      console.error('[CouncilorCrawler] Erro ao seedar vereadores:', err);
      return 0;
    }
  }

  /**
   * Listar vereadores cadastrados
   */
  public async listCouncilors(supabaseClient = supabase): Promise<Councilor[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabaseClient
        .from('councilors')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[CouncilorCrawler] Erro ao listar vereadores:', err);
      return [];
    }
  }

  /**
   * Listar atos legislativos cadastrados com autores relacionados
   */
  public async listActs(supabaseClient = supabase): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabaseClient
        .from('legislative_acts')
        .select(`
          *,
          authors:councilor_act_authors (
            is_primary,
            councilor:councilors (
              id,
              display_name,
              party,
              photo_url
            )
          )
        `)
        .order('protocol_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[CouncilorCrawler] Erro ao listar atos:', err);
      return [];
    }
  }

  /**
   * Analisar um ato legislativo usando o Gemini para determinar a categoria, relevância e explicação para o cidadão
   */
  public async analyzeActWithGemini(title: string, summary: string) {
    const defaultFallback = {
      act_category: "OUTROS",
      summary: summary || title,
      explanation_citizen: "Este ato está sob revisão e análise editorial pela equipe Melhora Prudente.",
      relevance_score: 50
    };

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[CouncilorCrawler] GEMINI_API_KEY ausente.');
      return defaultFallback;
    }

    try {
      const systemInstruction = `Você é um Analista de Políticas Públicas sênior do "Melhora Prudente".
Sua função é ler um ato legislativo da Câmara Municipal e enriquecê-lo editorialmente.

Você deve retornar obrigatoriamente um objeto JSON com:
1. "act_category": Escolha rigorosamente uma das seguintes categorias:
   - "LEGISLAÇÃO SUBSTANTIVA" (projetos de lei que alteram o zoneamento, impostos, regras municipais permanentes)
   - "FISCALIZAÇÃO" (pedidos de informação oficiais, convocação de secretários, auditorias)
   - "DEMANDAS LOCAIS" (indicações para tapar buraco, trocar lâmpada, podar árvore, consertos em bairros)
   - "ATOS SIMBÓLICOS" (títulos de cidadão, nomes de rua, votos de pesar, congratulações)
   - "OUTROS" (quando não se enquadra nas categorias anteriores)

2. "summary": Um resumo simples, direto e de fácil leitura sobre o que o projeto de lei ou requerimento propõe (máximo 3 parágrafos).

3. "explanation_citizen": Uma explicação extremamente amigável, livre de termos jurídicos difíceis ("juridiquês"), que responde diretamente à pergunta: "O que isso muda ou significa para a vida do cidadão prudentino?".

4. "relevance_score": Uma nota de 0 a 100 indicando o quão impactante este ato é para a população em geral (atos substanciais/fiscalizações relevantes ganham pontuação alta; atos simbólicos ou de congratulações ganham pontuação baixa, entre 0 e 15).`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          act_category: {
            type: Type.STRING,
            enum: ["LEGISLAÇÃO SUBSTANTIVA", "FISCALIZAÇÃO", "DEMANDAS LOCAIS", "ATOS SIMBÓLICOS", "OUTROS"],
            description: "Categoria editorial oficial correspondente"
          },
          summary: {
            type: Type.STRING,
            description: "Resumo simples e enxuto do ato"
          },
          explanation_citizen: {
            type: Type.STRING,
            description: "O impacto prático na vida real do cidadão prudentino"
          },
          relevance_score: {
            type: Type.INTEGER,
            description: "Pontuação de relevância e impacto social real (0 a 100)"
          }
        },
        required: ["act_category", "summary", "explanation_citizen", "relevance_score"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Título do Ato: ${title}\nResumo/Descrição Inicial: ${summary}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1
        }
      });

      if (!response.text) throw new Error('Gemini retornou vazio');
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error('[CouncilorCrawler] Erro ao analisar ato com Gemini:', e);
      return defaultFallback;
    }
  }

  /**
   * Buscar atos reais (proposições) coletados do site da Câmara
   */
  public async fetchAndColetarAtos(supabaseClient = supabase): Promise<{ coletados: number, cadastrados: number, errors: string[] }> {
    const stats = { coletados: 0, cadastrados: 0, errors: [] as string[] };
    if (!isSupabaseConfigured) {
      stats.errors.push("Supabase não configurado.");
      return stats;
    }

    try {
      const exists = await this.checkTablesExist(supabaseClient);
      if (!exists) {
        console.warn("[CouncilorCrawler] As tabelas do Raio-X não existem no banco de dados.");
        stats.errors.push("Aviso: Tabelas não provisionadas no banco.");
      }

      // Se as tabelas existirem, semeamos os vereadores ativos e carregamos a lista do banco
      let dbCouncilors: Councilor[] = [];
      if (exists) {
        await this.seedCouncilors(supabaseClient);
        dbCouncilors = await this.listCouncilors(supabaseClient);
      } else {
        dbCouncilors = REAL_COUNCILORS;
      }

      // Tipos de proposituras que vamos coletar do formulário
      const searchTypes = [
        { type: 'projeto', actType: 'projeto_lei', defaultCategory: 'LEGISLAÇÃO SUBSTANTIVA' },
        { type: 'indicacao', actType: 'indicacao', defaultCategory: 'DEMANDAS LOCAIS' },
        { type: 'mocao', actType: 'mocao', defaultCategory: 'ATOS SIMBÓLICOS' },
        { type: 'requerimento', actType: 'requerimento', defaultCategory: 'FISCALIZAÇÃO' }
      ];

      // Para não estourar tempo de limite, coletamos a primeira página (pg=1) para cada vereador e tipo
      for (const councilor of dbCouncilors) {
        const idver = councilor.external_id.replace('VER-', '');
        console.log(`[CouncilorCrawler] Coletando proposições do vereador ${councilor.display_name} (ID: ${idver})...`);

        for (const st of searchTypes) {
          const url = `https://www.camarapprudente.sp.gov.br/site/Proposituras/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&idver=${idver}&idleg=23&view=&tpBusca=${st.type}&pg=1`;
          console.log(`[CouncilorCrawler] Buscando tipo "${st.type}" da URL: ${url}`);

          try {
            const res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) {
              console.warn(`[CouncilorCrawler] HTTP ${res.status} ao buscar proposições do vereador ${idver}`);
              continue;
            }

            const html = await res.text();
            const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            let match;

            while ((match = trRegex.exec(html)) !== null) {
              const trContent = match[1];

              // Linha válida de proposição deve conter Data Inicial ou Situação
              if (!trContent.includes('Data Inicial:') && !trContent.includes('Situação')) {
                continue;
              }

              // 1. Número, Ano, Tipo do cabeçalho
              const headingMatch = trContent.match(/<h4>\s*([^<]+?)\s*(?:N&ordm;|N&ordm;|Nº|No)?\s*(\d+-\d+|\d+)\s*<\/h4>/i);
              if (!headingMatch) continue;

              const fullType = headingMatch[1].trim().replace(/\s+/g, ' ');
              const numYearStr = headingMatch[2].trim();
              const numYearParts = numYearStr.split('-');
              const number = numYearParts[0] || '';
              const year = numYearParts[1] || '';

              if (!number) continue;

              // 2. Data Inicial
              const dateMatch = trContent.match(/<h4>Data Inicial:<\/h4>\s*([\d\/]+)/i);
              const date = dateMatch ? dateMatch[1].trim() : '';

              // 3. Situação
              const statusMatch = trContent.match(/<h4>Situa&ccedil;&atilde;o<\/h4>\s*([^<]+)/i) || trContent.match(/<h4>Situação<\/h4>\s*([^<]+)/i);
              const situation = statusMatch ? statusMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

              // 4. Autoria bruta do site
              const authorMatch = trContent.match(/<h4>Autor:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<ComentarioWebline>|<h4>|$|<!--)/i);
              const rawAuthors = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

              // 5. Ementa
              const ementaMatch = trContent.match(/<h4>Ementa:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<hr class='hrListagem'>|<hr class="hrListagem">|$|<div)/i);
              const ementa = ementaMatch ? ementaMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';

              // 6. PDF
              const fileMatch = trContent.match(/name="nome_arquivo"\s+value="([^"]+)"/i);
              const fileUrl = fileMatch ? `https://www.camarapprudente.sp.gov.br/arquivos/${fileMatch[1]}` : '';

              // Deduplicação forte baseada em chave única (tipo_proposição + número + ano)
              const externalId = `${st.actType.toUpperCase()}-${number}-${year}`;
              stats.coletados++;

              // Persistir no Supabase se as tabelas existirem
              if (exists) {
                // Verificar se o ato já foi cadastrado
                const { data: existingAct } = await supabaseClient
                  .from('legislative_acts')
                  .select('id')
                  .eq('external_id', externalId)
                  .maybeSingle();

                let actId: string;

                if (!existingAct) {
                  // Classificação de Categoria
                  let actCategory = st.defaultCategory;
                  if (ementa.toUpperCase().includes('DENOMINA') || ementa.toUpperCase().includes('DECLARA DE UTILIDADE') || ementa.toUpperCase().includes('CONGRATULA')) {
                    actCategory = 'ATOS SIMBÓLICOS';
                  }

                  // Inteligência artificial opcional com o Gemini
                  let finalSummary = ementa;
                  let finalExplanation = "Este ato legislativo municipal está sob análise pela curadoria do portal Melhora Prudente.";
                  let finalRelevance = 50;

                  if (process.env.GEMINI_API_KEY) {
                    try {
                      const analysis = await this.analyzeActWithGemini(`${fullType} nº ${number}/${year}`, ementa);
                      actCategory = analysis.act_category || actCategory;
                      finalSummary = analysis.summary || finalSummary;
                      finalExplanation = analysis.explanation_citizen || finalExplanation;
                      finalRelevance = analysis.relevance_score ?? finalRelevance;
                    } catch (e) {
                      console.warn(`[CouncilorCrawler] Falha ao enriquecer ato ${externalId} com IA:`, e);
                    }
                  }

                  // Inserir ato legislativo
                  const { data: insertedAct, error: actError } = await supabaseClient
                    .from('legislative_acts')
                    .insert({
                      external_id: externalId,
                      act_type: st.actType,
                      act_category: actCategory,
                      number: number,
                      year: year,
                      title: `${fullType} nº ${number}/${year}`,
                      summary: finalSummary,
                      protocol_date: date ? `${date.split('/')[2]}-${date.split('/')[1]}-${date.split('/')[0]}T12:00:00Z` : new Date().toISOString(),
                      status: situation || 'PROTOCOLO',
                      official_url: fileUrl || url,
                      is_coauthored: rawAuthors.includes(',') || rawAuthors.toLowerCase().includes(' e ') || rawAuthors.toLowerCase().includes('outros')
                    })
                    .select('id')
                    .single();

                  if (actError) {
                    console.error(`[CouncilorCrawler] Erro ao salvar ato ${externalId}:`, actError);
                    stats.errors.push(`Erro ao salvar ato ${externalId}: ${actError.message}`);
                    continue;
                  }
                  
                  actId = insertedAct.id;
                  stats.cadastrados++;
                } else {
                  actId = existingAct.id;
                }

                // VINCULAR AUTORES E COAUTORES DE FORMA INEQUÍVOCA (N:N)
                const normalizedRawAuthors = rawAuthors.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                let matchedAuthorsCount = 0;

                for (const potentialAuthor of dbCouncilors) {
                  const normName = potentialAuthor.display_name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  
                  const nameParts = normName.split(' ').filter(p => p.length > 2);
                  const rawParts = normalizedRawAuthors.split(' ').filter(p => p.length > 2);

                  const matchBySubstrings = nameParts.some(part => normalizedRawAuthors.includes(part)) && 
                                            rawParts.some(part => normName.includes(part));

                  if (matchBySubstrings || normalizedRawAuthors.includes(normName) || normName.includes(normalizedRawAuthors)) {
                    matchedAuthorsCount++;
                    
                    // Vincular este vereador ao ato
                    await supabaseClient
                      .from('councilor_act_authors')
                      .upsert({
                        act_id: actId,
                        councilor_id: potentialAuthor.id,
                        is_primary: matchedAuthorsCount === 1
                      }, { onConflict: 'act_id,councilor_id' });
                  }
                }

                // Tratamento se a Câmara não informar autoria de forma clara (autoria_nao_confirmada)
                if (matchedAuthorsCount === 0 || normalizedRawAuthors.includes("NAO CONFIRMADO") || normalizedRawAuthors.length < 3) {
                  console.log(`[CouncilorCrawler] Autoria não confirmada para o ato ${externalId} (Autores brutos: "${rawAuthors}"). Não contabilizado no perfil individual.`);
                  // Conforme regra, ao não salvar relação em councilor_act_authors, o ato fica sem vínculo ativo e não é somado no perfil.
                }
              }
            }

          } catch (stErr: any) {
            console.error(`[CouncilorCrawler] Erro ao processar tipo ${st.type} para o vereador ${councilor.display_name}:`, stErr);
            stats.errors.push(`Erro no vereador ${councilor.display_name}, tipo ${st.type}: ${stErr.message}`);
          }
        }
      }

    } catch (e: any) {
      console.error('[CouncilorCrawler] Erro geral na coleta de proposições:', e);
      stats.errors.push(e.message);
    }

    return stats;
  }
}

export const councilorCrawlerService = new CouncilorCrawlerService();
