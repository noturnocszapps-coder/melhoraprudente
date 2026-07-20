import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini client server-side safely
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

export function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  
  const entities: { [key: string]: string } = {
    '&ordm;': 'º',
    '&Ordm;': 'º',
    '&deg;': '°',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&ccedil;': 'ç',
    '&Ccedil;': 'Ç',
    '&atilde;': 'ã',
    '&Atilde;': 'Ã',
    '&otilde;': 'õ',
    '&Otilde;': 'Õ',
    '&aacute;': 'á',
    '&Aacute;': 'Á',
    '&eacute;': 'é',
    '&Eacute;': 'É',
    '&iacute;': 'í',
    '&Iacute;': 'Í',
    '&oacute;': 'ó',
    '&Oacute;': 'Ó',
    '&uacute;': 'ú',
    '&Uacute;': 'Ú',
    '&acirc;': 'â',
    '&Acirc;': 'Â',
    '&ecirc;': 'ê',
    '&Ecirc;': 'Ê',
    '&ocirc;': 'ô',
    '&Ocirc;': 'Ô',
    '&agrave;': 'à',
    '&Agrave;': 'À',
    '&ordf;': 'ª',
    '&Ordf;': 'ª'
  };

  let decoded = text;
  let prev = '';
  let iter = 0;

  while (decoded !== prev && iter < 3) {
    prev = decoded;
    
    // Replace named entities
    for (const [entity, value] of Object.entries(entities)) {
      const regex = new RegExp(entity, 'gi');
      decoded = decoded.replace(regex, value);
    }

    // Replace decimal numeric entities (e.g. &#186;)
    decoded = decoded.replace(/&#(\d+);/g, (match, numStr) => {
      try {
        return String.fromCharCode(parseInt(numStr, 10));
      } catch {
        return match;
      }
    });

    // Replace hex numeric entities (e.g. &#xba;)
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hexStr) => {
      try {
        return String.fromCharCode(parseInt(hexStr, 16));
      } catch {
        return match;
      }
    });
    
    iter++;
  }

  return decoded;
}

export function normalizeTitle(fullType: string, number: string, year: string): string {
  // 1. Decodificar HTML e normalizar espaços
  let decodedType = decodeHTMLEntities(fullType).replace(/\s+/g, ' ').trim();

  // 2. Limpar marcadores de número duplicados ou redundantes no final ou meio do tipo oficial
  // Ex: "Projeto de Lei N°", "Indicação nº", "Projeto de Decreto Legislativo Nº nº", etc.
  const markerRegex = /\s*(?:N[º°o\.]|n[º°o\.]|No\.?|no\.?|N\.º|n\.º)\s*/gi;
  decodedType = decodedType.replace(markerRegex, ' ').trim();
  
  // Limpar espaços duplicados criados pela remoção
  decodedType = decodedType.replace(/\s+/g, ' ').trim();

  // Garantir primeira letra maiúscula
  if (decodedType.length > 0) {
    decodedType = decodedType.charAt(0).toUpperCase() + decodedType.slice(1);
  }

  // 3. Montar o título final com um único "nº" padronizado
  return `${decodedType} nº ${number}/${year}`;
}

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
              const decodedTrContent = decodeHTMLEntities(trContent);

              // Linha válida de proposição deve conter Data Inicial ou Situação
              if (!decodedTrContent.includes('Data Inicial:') && !decodedTrContent.includes('Situação')) {
                continue;
              }

              // 1. Número, Ano, Tipo do cabeçalho
              const headingMatch = decodedTrContent.match(/<h4>\s*([^<]+?)\s*(?:Nº|No|N\.º|No\.?|nº|n°)?\s*(\d+-\d+|\d+)\s*<\/h4>/i);
              if (!headingMatch) continue;

              let fullType = headingMatch[1].trim();
              fullType = decodeHTMLEntities(fullType).trim();
              // Clean duplicate Nº variations
              fullType = fullType.replace(/\s*(?:N[º°ºo\.]|n[º°ºo\.]|No\.?|no\.?)\s*$/i, '').trim();
              fullType = fullType.replace(/\s+/g, ' ');

              const numYearStr = headingMatch[2].trim();
              const numYearParts = numYearStr.split('-');
              const number = numYearParts[0] || '';
              const year = numYearParts[1] || '';

              if (!number) continue;

              // 2. Data Inicial
              const dateMatch = decodedTrContent.match(/<h4>Data Inicial:<\/h4>\s*([\d\/]+)/i);
              const date = dateMatch ? dateMatch[1].trim() : '';

              // 3. Situação
              const statusMatch = decodedTrContent.match(/<h4>Situação<\/h4>\s*([^<]+)/i);
              const situation = statusMatch ? statusMatch[1].replace(/\s+/g, ' ').trim() : '';

              // 4. Autoria bruta do site
              const authorMatch = decodedTrContent.match(/<h4>Autor:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<ComentarioWebline>|<h4>|$|<!--)/i);
              const rawAuthors = authorMatch ? authorMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

              // 5. Ementa
              const ementaMatch = decodedTrContent.match(/<h4>Ementa:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<hr class='hrListagem'>|<hr class="hrListagem">|$|<div)/i);
              const ementa = ementaMatch ? ementaMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

              // 6. PDF
              const fileMatch = decodedTrContent.match(/name="nome_arquivo"\s+value="([^"]+)"/i);
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

  /**
   * Coleta controlada de atos reais especificamente para o vereador William César Leite (VER-1449).
   * Implementa paginação completa, decodificação robusta e idempotência real de dados factuais.
   */
  public async fetchAndColetarAtosWilliam(supabaseClient = supabase): Promise<{
    paginas_consultadas: number;
    coletados: number;
    inseridos: number;
    atualizados: number;
    vinculos_criados: number;
    vinculos_atualizados: number;
    vinculos_existentes_sem_alteracao: number;
    duplicados_fisicos: number;
    existentes_sem_alteracao: number;
    registros_corrigidos_html: number;
    total_antes: number;
    total_depois: number;
    errors: string[];
    results: any[];
  }> {
    const stats = {
      paginas_consultadas: 0,
      coletados: 0,
      inseridos: 0,
      atualizados: 0,
      vinculos_criados: 0,
      vinculos_atualizados: 0,
      vinculos_existentes_sem_alteracao: 0,
      duplicados_fisicos: 0,
      existentes_sem_alteracao: 0,
      registros_corrigidos_html: 0,
      total_antes: 0,
      total_depois: 0,
      errors: [] as string[],
      results: [] as any[]
    };

    if (!isSupabaseConfigured) {
      stats.errors.push("Supabase não configurado.");
      return stats;
    }

    try {
      // 1. Confirmar que o vereador existe e obter seu UUID real
      const { data: william, error: williamError } = await supabaseClient
        .from('councilors')
        .select('*')
        .eq('external_id', 'VER-1449')
        .single();

      if (williamError || !william) {
        throw new Error("Vereador William César Leite (VER-1449) não foi localizado no banco de dados.");
      }

      console.log(`[CouncilorCrawler] Localizado William César Leite. UUID: ${william.id}`);

      // 2. Contar total de atos vinculados antes da execução
      const { count: countAntes, error: countAntesErr } = await supabaseClient
        .from('councilor_act_authors')
        .select('*', { count: 'exact', head: true })
        .eq('councilor_id', william.id);

      if (!countAntesErr) {
        stats.total_antes = countAntes || 0;
      }

      const searchTypes = [
        { type: 'projeto', actType: 'projeto_lei', defaultCategory: 'LEGISLAÇÃO SUBSTANTIVA' },
        { type: 'indicacao', actType: 'indicacao', defaultCategory: 'DEMANDAS LOCAIS' },
        { type: 'mocao', actType: 'mocao', defaultCategory: 'ATOS SIMBÓLICOS' },
        { type: 'requerimento', actType: 'requerimento', defaultCategory: 'FISCALIZAÇÃO' }
      ];

      // Conjunto para deduplicação em memória durante esta execução
      const seenExternalIdsInSession = new Set<string>();

      for (const st of searchTypes) {
        let pg = 1;
        let hasMore = true;
        const maxPagesSecurity = 50; // limite de segurança contra loop infinito

        while (hasMore && pg <= maxPagesSecurity) {
          // Delay amigável de 300ms entre as requisições a partir da pg 2 para não sobrecarregar a Câmara
          if (pg > 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          const url = `https://www.camarapprudente.sp.gov.br/site/Proposituras/?pag=T1RjPU9EZz1PVFU9T0dFPU9EWT1PR0k9T1RZPU9XST0=&idver=1449&idleg=23&view=&tpBusca=${st.type}&pg=${pg}`;
          console.log(`[CouncilorCrawler] William: buscando tipo "${st.type}" na página ${pg} (URL: ${url})`);
          stats.paginas_consultadas++;

          try {
            const res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              signal: AbortSignal.timeout(15000)
            });

            if (!res.ok) {
              console.warn(`[CouncilorCrawler] HTTP ${res.status} ao buscar tipo ${st.type} na página ${pg}`);
              hasMore = false; // Parar paginação para este tipo se der erro HTTP
              continue;
            }

            const html = await res.text();
            const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            let match;
            let validCountInPage = 0;

            while ((match = trRegex.exec(html)) !== null) {
              const trContent = match[1];
              // Decodificar toda a linha <tr> antes de qualquer regex
              const decodedTrContent = decodeHTMLEntities(trContent);

              // Linha válida de proposição deve conter Data Inicial ou Situação
              if (!decodedTrContent.includes('Data Inicial:') && !decodedTrContent.includes('Situação')) {
                continue;
              }

              // 1. Número, Ano, Tipo do cabeçalho
              const headingMatch = decodedTrContent.match(/<h4>\s*([^<]+?)\s*(?:Nº|No|N\.º|No\.?|nº|n°)?\s*(\d+-\d+|\d+)\s*<\/h4>/i);
              if (!headingMatch) continue;

              let rawFullType = headingMatch[1].trim();
              const numYearStr = headingMatch[2].trim();
              const numYearParts = numYearStr.split('-');
              const number = decodeHTMLEntities(numYearParts[0] || '').trim();
              const year = decodeHTMLEntities(numYearParts[1] || '').trim();

              if (!number) continue;
              validCountInPage++;

              // 2. Data Inicial
              const dateMatch = decodedTrContent.match(/<h4>Data Inicial:<\/h4>\s*([\d\/]+)/i);
              const rawDate = dateMatch ? dateMatch[1].trim() : '';
              const date = decodeHTMLEntities(rawDate).trim();

              // 3. Situação
              const statusMatch = decodedTrContent.match(/<h4>Situação<\/h4>\s*([^<]+)/i);
              const situation = statusMatch ? decodeHTMLEntities(statusMatch[1]).replace(/\s+/g, ' ').trim() : '';

              // 4. Autoria bruta do site
              const authorMatch = decodedTrContent.match(/<h4>Autor:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<ComentarioWebline>|<h4>|$|<!--)/i);
              const rawAuthors = authorMatch ? decodeHTMLEntities(authorMatch[1]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

              // 5. Ementa
              const ementaMatch = decodedTrContent.match(/<h4>Ementa:<\/h4>\s*([\s\S]*?)\s*(?:<\/div>|<hr class='hrListagem'>|<hr class="hrListagem">|$|<div)/i);
              const ementa = ementaMatch ? decodeHTMLEntities(ementaMatch[1]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

              // 6. PDF
              const fileMatch = decodedTrContent.match(/name="nome_arquivo"\s+value="([^"]+)"/i);
              const fileUrl = fileMatch ? `https://www.camarapprudente.sp.gov.br/arquivos/${decodeHTMLEntities(fileMatch[1]).trim()}` : '';

              // Mapeamento preciso de actType
              let finalActType = st.actType;
              const ftLower = rawFullType.toLowerCase();
              if (ftLower.includes('decreto legislativo')) {
                finalActType = 'projeto_decreto_legislativo';
              } else if (ftLower.includes('resolução') || ftLower.includes('resolucao')) {
                finalActType = 'projeto_resolucao';
              } else if (ftLower.includes('emenda')) {
                finalActType = 'emenda';
              } else if (ftLower.includes('projeto de lei')) {
                finalActType = 'projeto_lei';
              }

              // Normalizar Título usando nossa nova função genérica
              const actTitle = normalizeTitle(rawFullType, number, year);

              // Chave única determinística e estável
              const externalId = `${finalActType.toUpperCase()}-${number}-${year}`;

              // Evitar processar o mesmo ato duas vezes na mesma sessão
              if (seenExternalIdsInSession.has(externalId)) {
                continue;
              }
              seenExternalIdsInSession.add(externalId);
              stats.coletados++;

              // Classificação Analítica Fina
              let actCategory = st.defaultCategory;
              const emUpper = ementa.toUpperCase();

              if (finalActType === 'projeto_decreto_legislativo') {
                if (emUpper.includes('TITULO') || emUpper.includes('TÍTULO') || emUpper.includes('CIDADÃO') || emUpper.includes('MEDALHA') || emUpper.includes('HONRARIA') || emUpper.includes('HOMENAGEM') || emUpper.includes('CONCEDE') || emUpper.includes('DIPLOMA') || emUpper.includes('CONGRATULA')) {
                  actCategory = 'ATOS SIMBÓLICOS';
                } else {
                  actCategory = 'LEGISLAÇÃO SUBSTANTIVA';
                }
              }

              if (finalActType === 'projeto_lei') {
                if (emUpper.includes('DENOMINA') || emUpper.includes('DECLARA DE UTILIDADE') || emUpper.includes('UTILIDADE PÚBLICA') || emUpper.includes('RUAS') || emUpper.includes('PRACA') || emUpper.includes('PRAÇA') || emUpper.includes('AVENIDA') || emUpper.includes('ROTATORIA') || emUpper.includes('ROTATÓRIA') || emUpper.includes('ESPAÇO PÚBLICO') || emUpper.includes('NOME') || emUpper.includes('ESTRADA')) {
                  actCategory = 'ATOS SIMBÓLICOS';
                }
              }

              if (finalActType === 'mocao') {
                actCategory = 'ATOS SIMBÓLICOS';
              }

              // Verificar se já existe no banco
              const { data: existingAct, error: selectErr } = await supabaseClient
                .from('legislative_acts')
                .select('*')
                .eq('external_id', externalId)
                .maybeSingle();

              if (selectErr) {
                console.error(`[CouncilorCrawler] Erro ao buscar se existe ${externalId}:`, selectErr);
              }

              let actId: string = '';
              let needsUpdate = false;
              let isHtmlCorrection = false;

              let finalSummary = ementa;
              let finalExplanation = "Este ato legislativo municipal está sob análise pela curadoria do portal Melhora Prudente.";
              let finalRelevance = 50;

              const protocolDateParsed = date ? `${date.split('/')[2]}-${date.split('/')[1]}-${date.split('/')[0]}T12:00:00Z` : new Date().toISOString();
              const isCoauthored = rawAuthors.includes(',') || rawAuthors.toLowerCase().includes(' e ') || rawAuthors.toLowerCase().includes('outros');

              if (existingAct) {
                actId = existingAct.id;
                
                // Detectar se o banco continha entidades HTML codificadas como N&ordm; ou Indica&ccedil;&atilde;o
                const hasHtmlInBank = /&[a-zA-Z]+;|&#[0-9]+;|&#x[0-9a-f]+/i.test(existingAct.title || '') || 
                                      /&[a-zA-Z]+;|&#[0-9]+;|&#x[0-9a-f]+/i.test(existingAct.summary || '');

                // Comparação justa e detalhada para evitar falsos updates (IDEMPOTÊNCIA)
                const dbType = existingAct.act_type || '';
                const dbCategory = existingAct.act_category || '';
                const dbNumber = existingAct.number || '';
                const dbYear = existingAct.year || '';
                const dbTitle = existingAct.title || '';
                const dbSummary = existingAct.summary || '';
                const dbStatus = existingAct.status || '';
                const dbOfficialUrl = existingAct.official_url || '';
                const dbIsCoauthored = !!existingAct.is_coauthored;

                // Se alguma informação real de fato mudou (incluindo decodificação correta de HTML)
                if (dbType !== finalActType ||
                    dbCategory !== actCategory ||
                    dbNumber !== number ||
                    dbYear !== year ||
                    dbTitle !== actTitle ||
                    dbSummary !== finalSummary ||
                    dbStatus !== (situation || 'PROTOCOLO') ||
                    dbOfficialUrl !== (fileUrl || url) ||
                    dbIsCoauthored !== isCoauthored) {
                  
                  needsUpdate = true;
                  if (hasHtmlInBank) {
                    isHtmlCorrection = true;
                  }
                }
              } else {
                needsUpdate = true;
              }

              if (needsUpdate) {
                // Se for um novo registro, ou se houver atualização real de dados
                if (!existingAct && process.env.GEMINI_API_KEY) {
                  try {
                    const analysis = await this.analyzeActWithGemini(`${actTitle}`, ementa);
                    actCategory = analysis.act_category || actCategory;
                    finalSummary = analysis.summary || finalSummary;
                    finalExplanation = analysis.explanation_citizen || finalExplanation;
                    finalRelevance = analysis.relevance_score ?? finalRelevance;
                  } catch (e) {
                    console.warn(`[CouncilorCrawler] Falha ao enriquecer ato ${externalId} com IA:`, e);
                  }
                } else if (existingAct) {
                  // Se for atualização de registro existente, preservar campos de IA já computados para não re-gastar tokens
                  // ou usar a ementa limpa como sumário caso não tenha summary
                  finalSummary = existingAct.summary || finalSummary;
                }

                const actPayload = {
                  external_id: externalId,
                  act_type: finalActType,
                  act_category: actCategory,
                  number: number,
                  year: year,
                  title: actTitle,
                  summary: finalSummary,
                  protocol_date: protocolDateParsed,
                  status: situation || 'PROTOCOLO',
                  official_url: fileUrl || url,
                  is_coauthored: isCoauthored,
                  updated_at: new Date().toISOString()
                };

                const { data: upsertData, error: actError } = await supabaseClient
                  .from('legislative_acts')
                  .upsert(actPayload, { onConflict: 'external_id' })
                  .select('id')
                  .single();

                if (actError) {
                  console.error(`[CouncilorCrawler] Erro ao salvar ato ${externalId}:`, actError);
                  stats.errors.push(`Erro ao salvar ato ${externalId}: ${actError.message}`);
                  continue;
                }

                actId = upsertData.id;
                if (!existingAct) {
                  stats.inseridos++;
                } else {
                  stats.atualizados++;
                  if (isHtmlCorrection) {
                    stats.registros_corrigidos_html++;
                  }
                }
              } else {
                stats.existentes_sem_alteracao++;
                stats.duplicados_fisicos++; // Atos encontrados que não precisaram de alteração física no banco
              }

              // 5. Autoria confirmada pela fonte oficial
              const rawAuthorsNorm = rawAuthors.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              const williamNorm = "WILLIAM CESAR LEITE";
              
              // Verifica se William realmente é autor ou coautor deste ato
              const containsWilliam = rawAuthorsNorm.includes(williamNorm) || rawAuthorsNorm.includes("WILLIAM CESAR") || rawAuthorsNorm.includes("VEREADOR WILLIAM");

              if (containsWilliam) {
                // Calcular se é autor principal (is_primary = true somente se for o primeiro da lista de autores)
                const authorList = rawAuthors.split(/,|\be\b|;/i).map(a => a.trim()).filter(Boolean);
                let isPrimary = false;

                if (!isCoauthored) {
                  isPrimary = true;
                } else if (authorList.length > 0) {
                  const firstAuthor = authorList[0].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  isPrimary = firstAuthor.includes(williamNorm) || williamNorm.includes(firstAuthor);
                }

                // Verificar se o vínculo já existe
                const { data: existingAuthorLink } = await supabaseClient
                  .from('councilor_act_authors')
                  .select('*')
                  .eq('act_id', actId)
                  .eq('councilor_id', william.id)
                  .maybeSingle();

                if (!existingAuthorLink) {
                  const { error: authorErr } = await supabaseClient
                    .from('councilor_act_authors')
                    .insert({
                      act_id: actId,
                      councilor_id: william.id,
                      is_primary: isPrimary
                    });

                  if (authorErr) {
                    console.error(`[CouncilorCrawler] Erro ao vincular autor ao ato ${externalId}:`, authorErr);
                    stats.errors.push(`Erro de vínculo em ${externalId}: ${authorErr.message}`);
                  } else {
                    stats.vinculos_criados++;
                  }
                } else {
                  // Se o vínculo já existe, atualizar is_primary se tiver mudado
                  if (existingAuthorLink.is_primary !== isPrimary) {
                    const { error: updateLinkErr } = await supabaseClient
                      .from('councilor_act_authors')
                      .update({ is_primary: isPrimary })
                      .eq('act_id', actId)
                      .eq('councilor_id', william.id);

                    if (updateLinkErr) {
                      console.error(`[CouncilorCrawler] Erro ao atualizar vínculo em ${externalId}:`, updateLinkErr);
                    } else {
                      stats.vinculos_atualizados++;
                    }
                  } else {
                    stats.vinculos_existentes_sem_alteracao++;
                  }
                }
              } else {
                console.log(`[CouncilorCrawler] Autoria de William NÃO confirmada para o ato ${externalId} (Autores: "${rawAuthors}"). Não vinculado.`);
              }

              stats.results.push({
                id: actId,
                external_id: externalId,
                act_type: finalActType,
                number,
                year,
                title: actTitle,
                status: situation || 'PROTOCOLO',
                is_coauthored: isCoauthored,
                is_primary: containsWilliam ? (rawAuthors.split(/,|\be\b|;/i).map(a => a.trim()).filter(Boolean)[0]?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().includes(williamNorm) ?? true) : false,
                official_url: fileUrl || url
              });
            }

            // Se não encontrou nenhuma proposição válida nesta página, significa que chegamos ao fim da paginação para este tipo
            if (validCountInPage === 0) {
              hasMore = false;
            } else {
              pg++;
            }

          } catch (stErr: any) {
            console.error(`[CouncilorCrawler] Erro na página ${pg} do tipo ${st.type}:`, stErr);
            stats.errors.push(`Erro na página ${pg} do tipo ${st.type}: ${stErr.message}`);
            hasMore = false; // Parar paginação para este tipo se der erro de rede
          }
        }
      }

      // 6. Contar total de atos vinculados após a execução
      const { count: countDepois, error: countDepoisErr } = await supabaseClient
        .from('councilor_act_authors')
        .select('*', { count: 'exact', head: true })
        .eq('councilor_id', william.id);

      if (!countDepoisErr) {
        stats.total_depois = countDepois || 0;
      }

    } catch (e: any) {
      console.error('[CouncilorCrawler] Erro geral na coleta de atos de William:', e);
      stats.errors.push(e.message);
    }

    return stats;
  }
}

export const councilorCrawlerService = new CouncilorCrawlerService();
