import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Councilor, LegislativeAct, REAL_COUNCILORS } from './councilor-crawler-service';

export type GrupoAnalitico = 
  | 'PRODUÇÃO LEGISLATIVA'
  | 'FISCALIZAÇÃO E CONTROLE'
  | 'DEMANDAS E INDICAÇÕES'
  | 'ATOS SIMBÓLICOS'
  | 'OUTROS';

export type SubcategoriaAnalitica =
  | 'legislação municipal'
  | 'organização da Câmara'
  | 'emenda à Lei Orgânica'
  | 'pedido de informação'
  | 'fiscalização'
  | 'convocação'
  | 'zeladoria'
  | 'infraestrutura'
  | 'iluminação'
  | 'trânsito'
  | 'homenagem'
  | 'congratulação'
  | 'pesar'
  | 'denominação de espaço público'
  | 'Outros atos'
  | 'Sem subcategoria';

export interface CouncilorStats {
  projetos_apresentados: number;
  projetos_aprovados_comprovados: number;
  projetos_em_tramitacao: number;
  requerimentos: number;
  indicacoes: number;
  mocoes: number;
  emendas: number;
  outros_atos: number;
  autoria_principal: number;
  coautoria: number;
}

export interface RaioXAct {
  id: string;
  external_id: string;
  tipo_oficial: string;
  grupo_analitico: GrupoAnalitico;
  subcategoria_analitica: SubcategoriaAnalitica;
  number: string;
  year: string;
  title: string;
  summary: string;
  protocol_date: string;
  status: string;
  official_url: string;
  is_coauthored: boolean;
  is_primary_author: boolean;
}

export interface CouncilorRaioXProfile {
  councilor: Councilor;
  stats: CouncilorStats;
  acts_by_group: Record<GrupoAnalitico, number>;
  acts_by_subcategory: Record<SubcategoriaAnalitica, number>;
  acts: RaioXAct[];
}

/**
 * Classifica programaticamente um ato legislativo em um grupo analítico
 */
export function getGrupoAnalitico(actType: string, title: string = '', summary: string = ''): GrupoAnalitico {
  const type = actType.toLowerCase();
  const titleUpper = title.toUpperCase();
  const summaryUpper = (summary || '').toUpperCase();
  const combined = `${titleUpper} ${summaryUpper}`;

  // 1. ATOS SIMBÓLICOS: Denominações de espaço público ou homenagens explícitas
  const isDenomination = combined.includes('DENOMINA');
  const isHonorific = 
    combined.includes('HONRÍFICO') || 
    combined.includes('CIDADÃO') || 
    combined.includes('CIDADÃ') || 
    combined.includes('MEDALHA') || 
    combined.includes('CONGRATULA') || 
    combined.includes('HOMENAGEM') ||
    combined.includes('DECLARA DE UTILIDADE') ||
    combined.includes('UTILIDADE PÚBLICA') ||
    combined.includes('VOTO DE PESAR') ||
    combined.includes('MOÇÃO DE PESAR');

  if (isDenomination || isHonorific) {
    return 'ATOS SIMBÓLICOS';
  }

  // 2. PRODUÇÃO LEGISLATIVA
  if (
    type.includes('projeto de lei') ||
    type.includes('projeto de resolução') ||
    type.includes('projeto de resolucao') ||
    type.includes('projeto de decreto') ||
    type.includes('projeto de emenda') ||
    type.includes('substitutivo') ||
    type.includes('emenda') ||
    type.includes('projeto') ||
    type.includes('project_law') ||
    type.includes('pl')
  ) {
    return 'PRODUÇÃO LEGISLATIVA';
  }

  // 3. REQUERIMENTO
  if (type.includes('requerimento') || type.includes('requirement')) {
    return 'FISCALIZAÇÃO E CONTROLE';
  }

  // 4. INDICAÇÃO
  if (type.includes('indicacao') || type.includes('indicação') || type.includes('demanda')) {
    return 'DEMANDAS E INDICAÇÕES';
  }

  // 5. MOÇÃO
  if (type.includes('mocao') || type.includes('moção') || type.includes('congratulacao')) {
    return 'ATOS SIMBÓLICOS';
  }

  return 'OUTROS';
}

/**
 * Classifica programaticamente um ato legislativo em uma subcategoria analítica específica
 */
export function getSubcategoriaAnalitica(actType: string, title: string = '', summary: string = ''): SubcategoriaAnalitica {
  const type = actType.toLowerCase();
  const titleUpper = title.toUpperCase();
  const summaryUpper = (summary || '').toUpperCase();
  const combined = `${titleUpper} ${summaryUpper}`;

  // 1. ATOS SIMBÓLICOS
  if (combined.includes('DENOMINA')) {
    return 'denominação de espaço público';
  }
  
  if (type.includes('mocao') || type.includes('moção')) {
    if (combined.includes('PESAR') || combined.includes('FALECIMENTO') || combined.includes('ÓBITO') || combined.includes('OBITO')) {
      return 'pesar';
    }
    return 'congratulação';
  }

  if (
    combined.includes('CIDADÃO') || 
    combined.includes('CIDADÃ') || 
    combined.includes('MEDALHA') || 
    combined.includes('HOMENAGEM') || 
    combined.includes('HONRA') ||
    combined.includes('CONGRATULA') ||
    combined.includes('DECLARA DE UTILIDADE') ||
    combined.includes('UTILIDADE PÚBLICA')
  ) {
    return 'homenagem';
  }

  // 2. PRODUÇÃO LEGISLATIVA
  if (type.includes('projeto de resolução') || type.includes('projeto de resolucao')) {
    return 'organização da Câmara';
  }
  if (
    type.includes('projeto de emenda') || 
    combined.includes('LEI ORGÂNICA') || 
    combined.includes(' LOM ') || 
    combined.includes(' LOM,') || 
    combined.includes(' LOM.') || 
    combined.includes('L.O.M.')
  ) {
    return 'emenda à Lei Orgânica';
  }
  if (
    type.includes('projeto de lei') || 
    type.includes('substitutivo') || 
    type.includes('emenda') ||
    type.includes('projeto') ||
    type.includes('project_law') ||
    type.includes('pl')
  ) {
    return 'legislação municipal';
  }

  // 3. FISCALIZAÇÃO E CONTROLE
  if (type.includes('requerimento') || type.includes('requirement')) {
    if (combined.includes('CONVOCACAO') || combined.includes('CONVOCAÇÃO') || combined.includes('CONVOCA')) {
      return 'convocação';
    }
    if (
      combined.includes('INFORMA') || 
      combined.includes('INFORMACAO') || 
      combined.includes('INFORMAÇÃO') || 
      combined.includes('INFORME') || 
      combined.includes('ESCLAREC') ||
      combined.includes('QUESTION')
    ) {
      return 'pedido de informação';
    }
    return 'fiscalização';
  }

  // 4. DEMANDAS E INDICAÇÕES
  if (type.includes('indicacao') || type.includes('indicação') || type.includes('demanda')) {
    if (
      combined.includes('ILUMINA') || 
      combined.includes('LÂMPADA') || 
      combined.includes('LAMPADA') || 
      combined.includes('POSTE') || 
      combined.includes('RELOCO')
    ) {
      return 'iluminação';
    }
    if (
      combined.includes('PODA') || 
      combined.includes('CORTE') || 
      combined.includes('LIMPEZA') || 
      combined.includes('CAPINA') || 
      combined.includes('LIXO') || 
      combined.includes('ZELADORIA') || 
      combined.includes('ENTULHO') || 
      combined.includes('ROÇAGEM') || 
      combined.includes('ROCAGEM') || 
      combined.includes('VARRIÇÃO') || 
      combined.includes('VARRICAO') || 
      combined.includes('MATA') || 
      combined.includes('MATO')
    ) {
      return 'zeladoria';
    }
    if (
      combined.includes('TRÂNSITO') || 
      combined.includes('TRANSITO') || 
      combined.includes('SINALIZAÇÃO') || 
      combined.includes('SINALIZACAO') || 
      combined.includes('LOMBADA') || 
      combined.includes('SEMÁFORO') || 
      combined.includes('SEMAFORO') || 
      combined.includes('PLACA') || 
      combined.includes('MÃO ÚNICA') || 
      combined.includes('MAO UNICA') || 
      combined.includes('MÃO DUPLA') || 
      combined.includes('MAO DUPLA') || 
      combined.includes('ESTACIONAMENTO')
    ) {
      return 'trânsito';
    }
    return 'infraestrutura'; // Default para infraestrutura/zeladoria urbana ampla
  }

  return 'Outros atos';
}

/**
 * Estrutura pública da metodologia para exibição transparente aos cidadãos
 */
export const METODOLOGIA_RAIO_X = {
  titulo: 'METODOLOGIA DO RAIO-X DOS VEREADORES',
  fonte_oficial: 'Câmara Municipal de Presidente Prudente (Portal de Proposituras)',
  periodo_analisado: 'Legislatura Vigente (2025 - 2028)',
  premissas_fundamentais: [
    'Transparência Absoluta: Classificação determinística, objetiva e programática.',
    'Não-Julgamento: O portal NÃO gera rankings, pontuações de eficiência ou prêmios de "melhor vereador".',
    'Foco Informativo: Quantidade bruta de atos não equivale a qualidade; cada cidadão avalia a relevância de acordo com seus valores.',
    'Preservação do Tipo Oficial: O tipo original da Câmara nunca é alterado; o agrupamento analítico serve apenas para fins de visualização organizada.'
  ],
  agrupamentos: [
    {
      grupo: 'PRODUÇÃO LEGISLATIVA',
      descricao: 'Criação ou modificação de normas jurídicas que afetam a cidade ou a Câmara.',
      tipos_incluidos: ['Projeto de Lei (ordinária/complementar)', 'Projeto de Resolução', 'Projeto de Emenda à LOM', 'Substitutivo', 'Emenda'],
      subcategorias: ['legislação municipal', 'organização da Câmara', 'emenda à Lei Orgânica']
    },
    {
      grupo: 'FISCALIZAÇÃO E CONTROLE',
      descricao: 'Atos de acompanhamento, questionamento e supervisão do Poder Executivo.',
      tipos_incluidos: ['Requerimento'],
      subcategorias: ['pedido de informação', 'fiscalização', 'convocação']
    },
    {
      grupo: 'DEMANDAS E INDICAÇÕES',
      descricao: 'Pedidos formais para que a Prefeitura execute serviços públicos locais.',
      tipos_incluidos: ['Indicação'],
      subcategorias: ['zeladoria', 'infraestrutura', 'iluminação', 'trânsito']
    },
    {
      grupo: 'ATOS SIMBÓLICOS',
      descricao: 'Atividades de representação, honrarias, congratulações, luto ou denominações.',
      tipos_incluidos: ['Moção', 'Projeto de Decreto Legislativo (honrarias)', 'Projetos de denominação de vias'],
      subcategorias: ['homenagem', 'congratulação', 'pesar', 'denominação de espaço público']
    }
  ],
  tratamento_autoria: 'A autoria principal e coautoria são rigorosamente diferenciadas para que o cidadão compreenda quem liderou a proposição e quem apenas a apoiou.'
};



export class RaioXDataService {
  /**
   * Obtém o perfil de Raio-X completo para um vereador usando consultas objetivas
   */
  public async getCouncilorProfile(councilorExternalId: string, supabaseClient = supabase): Promise<CouncilorRaioXProfile | null> {
    try {
      // 1. Obter os dados do vereador
      let councilor: Councilor | null = null;

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabaseClient
            .from('councilors')
            .select('*')
            .eq('external_id', councilorExternalId)
            .maybeSingle();

          if (error) {
            console.warn(`[RaioXDataService] Aviso ao carregar vereador ${councilorExternalId} do banco. Usando fallback estático.`, error.message);
          } else {
            councilor = data;
          }
        } catch (dbErr: any) {
          console.warn(`[RaioXDataService] Exceção ao acessar tabela de vereadores para ${councilorExternalId}:`, dbErr.message || dbErr);
        }
      }

      // Fallback para dados estáticos caso o banco não responda ou não esteja configurado
      if (!councilor) {
        const staticVer = REAL_COUNCILORS.find((rc: Councilor) => rc.external_id === councilorExternalId);
        if (!staticVer) return null;
        councilor = staticVer;
      }

      // 2. Obter os vínculos de autoria desse vereador
      let acts: RaioXAct[] = [];

      if (isSupabaseConfigured && councilor.id) {
        try {
          const { data: authorLinks, error: authorError } = await supabaseClient
            .from('councilor_act_authors')
            .select(`
              is_primary,
              act:legislative_acts (
                id,
                external_id,
                act_type,
                act_category,
                number,
                year,
                title,
                summary,
                protocol_date,
                status,
                official_url,
                is_coauthored
              )
            `)
            .eq('councilor_id', councilor.id);

          if (authorError) {
            console.warn(`[RaioXDataService] Aviso ao carregar atos do vereador ${councilorExternalId} do banco. Usando fallback estático.`, authorError.message);
          } else if (authorLinks && authorLinks.length > 0) {
            acts = authorLinks.map((link: any) => {
              const a = link.act;
              return {
                id: a.id,
                external_id: a.external_id,
                tipo_oficial: a.act_type,
                grupo_analitico: getGrupoAnalitico(a.act_type, a.title, a.summary),
                subcategoria_analitica: getSubcategoriaAnalitica(a.act_type, a.title, a.summary),
                number: a.number,
                year: a.year,
                title: a.title,
                summary: a.summary || '',
                protocol_date: a.protocol_date,
                status: a.status || '',
                official_url: a.official_url || '',
                is_coauthored: !!a.is_coauthored,
                is_primary_author: !!link.is_primary
              };
            });
          }
        } catch (dbErr: any) {
          console.warn(`[RaioXDataService] Exceção ao acessar tabela de atos para ${councilorExternalId}:`, dbErr.message || dbErr);
        }
      }

      // Sem fallback fictício - caso o banco esteja vazio ou sem dados cadastrados, retorna array vazio para metrics/stats zero

      // 3. Compilar estatísticas objetivas solicitadas pelo usuário
      const stats: CouncilorStats = {
        projetos_apresentados: 0,
        projetos_aprovados_comprovados: 0,
        projetos_em_tramitacao: 0,
        requerimentos: 0,
        indicacoes: 0,
        mocoes: 0,
        emendas: 0,
        outros_atos: 0,
        autoria_principal: 0,
        coautoria: 0
      };

      const acts_by_group: Record<GrupoAnalitico, number> = {
        'PRODUÇÃO LEGISLATIVA': 0,
        'FISCALIZAÇÃO E CONTROLE': 0,
        'DEMANDAS E INDICAÇÕES': 0,
        'ATOS SIMBÓLICOS': 0,
        'OUTROS': 0
      };

      const acts_by_subcategory: Record<SubcategoriaAnalitica, number> = {
        'legislação municipal': 0,
        'organização da Câmara': 0,
        'emenda à Lei Orgânica': 0,
        'pedido de informação': 0,
        'fiscalização': 0,
        'convocação': 0,
        'zeladoria': 0,
        'infraestrutura': 0,
        'iluminação': 0,
        'trânsito': 0,
        'homenagem': 0,
        'congratulação': 0,
        'pesar': 0,
        'denominação de espaço público': 0,
        'Outros atos': 0,
        'Sem subcategoria': 0
      };

      acts.forEach(act => {
        const typeLower = act.tipo_oficial.toLowerCase();
        const statusUpper = act.status.toUpperCase();

        // Incrementa os contadores analíticos
        acts_by_group[act.grupo_analitico]++;
        acts_by_subcategory[act.subcategoria_analitica]++;

        // Tipo Oficial: Projetos (Lei, Resolução, Decreto Legislativo, etc.)
        const isProject = 
          typeLower.includes('projeto') || 
          typeLower.includes('project_law') || 
          typeLower.includes('pl');

        if (isProject) {
          stats.projetos_apresentados++;

          // Projetos aprovados comprovados
          const isApproved = 
            statusUpper.includes('APROVADO') || 
            statusUpper.includes('DEFERIDO') || 
            statusUpper.includes('PROMULGADO') || 
            statusUpper.includes('LEI');
          
          if (isApproved) {
            stats.projetos_aprovados_comprovados++;
          }

          // Projetos em tramitação
          const isPending = 
            statusUpper.includes('EM TRAMITAÇÃO') || 
            statusUpper.includes('TRAMITAÇÃO') || 
            statusUpper.includes('PROTOCOLO') ||
            statusUpper.includes('AGUARDANDO') ||
            statusUpper === '-' ||
            statusUpper === '';
          
          if (isPending && !isApproved) {
            stats.projetos_em_tramitacao++;
          }
        }

        // Requerimentos
        if (typeLower.includes('requerimento') || typeLower.includes('requirement')) {
          stats.requerimentos++;
        }

        // Indicações
        if (typeLower.includes('indicacao') || typeLower.includes('indicação')) {
          stats.indicacoes++;
        }

        // Moções
        if (typeLower.includes('mocao') || typeLower.includes('moção')) {
          stats.mocoes++;
        }

        // Emendas
        if (typeLower.includes('emenda')) {
          stats.emendas++;
        }

        // Outros atos (que não se enquadram acima)
        if (!isProject && 
            !typeLower.includes('requerimento') && 
            !typeLower.includes('indicacao') && 
            !typeLower.includes('indicação') && 
            !typeLower.includes('mocao') && 
            !typeLower.includes('moção') && 
            !typeLower.includes('emenda')) {
          stats.outros_atos++;
        }

        // Autoria principal vs Coautoria
        if (act.is_primary_author) {
          stats.autoria_principal++;
        } else {
          stats.coautoria++;
        }
      });

      return {
        councilor,
        stats,
        acts_by_group,
        acts_by_subcategory,
        acts
      };
    } catch (err) {
      console.error(`[RaioXDataService] Erro ao obter perfil do vereador ${councilorExternalId}:`, err);
      return null;
    }
  }


}

export const raioXDataService = new RaioXDataService();
