import { GrupoAnalitico, SubcategoriaAnalitica } from '../../services/news-sources/raio-x-data-service';

export interface AuditoriaAtoExemplo {
  id: string;
  tipo_oficial: string;
  ementa: string;
  grupo_analitico: GrupoAnalitico;
  subcategoria_analitica: SubcategoriaAnalitica;
  regra_aplicada: string;
}

export const AMOSTRA_AUDITORIA_30_ATOS: AuditoriaAtoExemplo[] = [
  {
    id: "PL-00417-2026",
    tipo_oficial: "Projeto de Lei",
    ementa: "Dispõe sobre a criação do Programa Municipal de Saúde Bucal nas escolas de Presidente Prudente.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Projeto de lei regulatório sem ementa contendo o verbo 'denomina' ou 'utilidade pública'."
  },
  {
    id: "PL-00312-2026",
    tipo_oficial: "Projeto de Lei",
    ementa: "Denomina 'Praça Dr. José Roberto' a área verde localizada no Residencial Damha.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "denominação de espaço público",
    regra_aplicada: "Contém o termo 'DENOMINA' no título ou sumário."
  },
  {
    id: "PR-00012-2026",
    tipo_oficial: "Projeto de Resolução",
    ementa: "Altera o Regimento Interno da Câmara Municipal para modificar o horário das sessões ordinárias.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "organização da Câmara",
    regra_aplicada: "Projeto de Resolução que trata do regimento e regulamento da própria Câmara."
  },
  {
    id: "PDL-00046-2026",
    tipo_oficial: "Projeto de Decreto Legislativo",
    ementa: "Outorga o Título de Cidadão Prudentino ao Ilustríssimo Senhor Diretor do Hospital Regional.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "homenagem",
    regra_aplicada: "Decreto Legislativo que contém os termos honoríficos 'CIDADÃO' ou 'HONRÍFICO'."
  },
  {
    id: "PDL-00021-2026",
    tipo_oficial: "Projeto de Decreto Legislativo",
    ementa: "Aprova as contas do Prefeito Municipal de Presidente Prudente relativas ao exercício financeiro de 2024.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Decreto de efeito institutional administrativo real, sem concessão de honrarias."
  },
  {
    id: "PELOM-00003-2026",
    tipo_oficial: "Projeto de Emenda à Lei Orgânica",
    ementa: "Acrescenta parágrafo único ao art. 45 da Lei Orgânica do Município de Presidente Prudente.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "emenda à Lei Orgânica",
    regra_aplicada: "Trata-se de uma emenda direta à Lei Orgânica Municipal (LOM)."
  },
  {
    id: "SUB-00001-2026",
    tipo_oficial: "Substitutivo",
    ementa: "Substitutivo nº 01 ao Projeto de Lei nº 120/2026 que altera o código de posturas municipais.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Modificação de lei ordinária que altera o código de conduta urbana da cidade."
  },
  {
    id: "REQ-00512-2026",
    tipo_oficial: "Requerimento",
    ementa: "Requer informações do Prefeito Municipal sobre a falta de médicos na UPA do Ana Jacinta.",
    grupo_analitico: "FISCALIZAÇÃO E CONTROLE",
    subcategoria_analitica: "pedido de informação",
    regra_aplicada: "Requerimento oficial contendo os termos 'informações' ou 'esclarecimentos'."
  },
  {
    id: "REQ-00221-2026",
    tipo_oficial: "Requerimento",
    ementa: "Requer a convocação do Secretário Municipal de Obras para prestar esclarecimentos sobre atraso nas obras.",
    grupo_analitico: "FISCALIZAÇÃO E CONTROLE",
    subcategoria_analitica: "convocação",
    regra_aplicada: "Requerimento oficial contendo a palavra-chave 'CONVOCAÇÃO'."
  },
  {
    id: "REQ-00109-2026",
    tipo_oficial: "Requerimento",
    ementa: "Requer constituição de Comissão Especial de Inquérito para apurar irregularidades no transporte escolar.",
    grupo_analitico: "FISCALIZAÇÃO E CONTROLE",
    subcategoria_analitica: "fiscalização",
    regra_aplicada: "Requerimento de ação de fiscalização ou comissões, sem teor de convocação imediata ou pedido de informação simples."
  },
  {
    id: "IND-02721-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica ao Poder Executivo a roçagem e limpeza de mato alto em terreno público no bairro Brasil Novo.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "zeladoria",
    regra_aplicada: "Indicação contendo termos de manutenção urbana como 'limpeza', 'roçagem' ou 'poda'."
  },
  {
    id: "IND-01102-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica operação tapa-buracos na Rua Tenente Nicolau Maffei.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "infraestrutura",
    regra_aplicada: "Indicação de reparos físicos em pavimentação ou galerias."
  },
  {
    id: "IND-01452-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica substituição de lâmpadas queimadas na Praça Nove de Julho por luminárias LED.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "iluminação",
    regra_aplicada: "Indicação contendo termos relacionados à 'iluminação', 'lâmpada' ou 'poste'."
  },
  {
    id: "IND-01992-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica implantação de lombada e pintura de faixa de pedestres na Avenida Manoel Goulart.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "trânsito",
    regra_aplicada: "Indicação contendo termos de 'trânsito', 'lombada' ou 'faixa de pedestres'."
  },
  {
    id: "MOC-00101-2026",
    tipo_oficial: "Moção",
    ementa: "Moção de Congratulações à equipe de robótica da escola municipal pelo primeiro lugar no torneio regional.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "congratulação",
    regra_aplicada: "Moção sem teor de pesar, congratulando ou homenageando conquista."
  },
  {
    id: "MOC-00088-2026",
    tipo_oficial: "Moção",
    ementa: "Moção de Pesar pelo falecimento do pioneiro prudentino Sr. Amaro de Oliveira.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "pesar",
    regra_aplicada: "Moção contendo as palavras-chave 'PESAR' ou 'FALECIMENTO'."
  },
  {
    id: "MOC-00142-2026",
    tipo_oficial: "Moção",
    ementa: "Moção de Repúdio contra o aumento excessivo de tarifas de pedágio na região.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "congratulação",
    regra_aplicada: "Moções de protesto ou repúdio são agrupadas em congratulações/posicionamentos simbólicos externos."
  },
  {
    id: "EM-00003-2026",
    tipo_oficial: "Emenda",
    ementa: "Emenda Modificativa nº 03 ao Projeto de Lei de Diretrizes Orçamentárias (LDO).",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Emenda parlamentar de alteração de projeto de lei em andamento."
  },
  {
    id: "PL-00098-2026",
    tipo_oficial: "Projeto de Lei",
    ementa: "Declara de Utilidade Pública a Associação de Apoio ao Autista de Presidente Prudente.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "homenagem",
    regra_aplicada: "Projeto de lei contendo a frase 'DECLARA DE UTILIDADE' (reconhecimento formal simbólico)."
  },
  {
    id: "PL-00155-2026",
    tipo_oficial: "Projeto de Lei",
    ementa: "Dispõe sobre a proibição de plásticos de uso único nos órgãos públicos municipais.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Projeto de Lei com regulação prática e aplicabilidade pública real."
  },
  {
    id: "REQ-00192-2026",
    tipo_oficial: "Requerimento",
    ementa: "Requer voto de congratulações ao novo comandante do Comando de Policiamento do Interior (CPI-8).",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "homenagem",
    regra_aplicada: "Requerimento que visa expressar homenagem ou congratulação honorífica."
  },
  {
    id: "IND-02551-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica a revitalização completa de calçadas em torno do Hospital Regional.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "infraestrutura",
    regra_aplicada: "Indicação de infraestrutura urbana voltada para calçadas públicas."
  },
  {
    id: "IND-02830-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica a remoção de lixo e entulho acumulados clandestinamente na Avenida Salim Farah Maluf.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "zeladoria",
    regra_aplicada: "Contém palavras-chave de limpeza como 'lixo' ou 'entulho'."
  },
  {
    id: "REQ-00340-2026",
    tipo_oficial: "Requerimento",
    ementa: "Requer informações sobre o cronograma de entrega de uniformes escolares na rede municipal.",
    grupo_analitico: "FISCALIZAÇÃO E CONTROLE",
    subcategoria_analitica: "pedido de informação",
    regra_aplicada: "Requerimento demandando esclarecimentos sobre serviços públicos municipais."
  },
  {
    id: "PDL-00010-2026",
    tipo_oficial: "Projeto de Decreto Legislativo",
    ementa: "Outorga a Medalha de Mérito Fundador Coronel Francisco de Paula Goulart.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "homenagem",
    regra_aplicada: "Decreto Legislativo contendo la outorga da palavra-chave 'MEDALHA'."
  },
  {
    id: "PL-00122-2026",
    tipo_oficial: "Projeto de Lei",
    ementa: "Denomina 'Rua Maria de Lourdes' a via pública conhecida como Rua Projetada C do Residencial Vale do Sol.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "denominação de espaço público",
    regra_aplicada: "Ementa iniciando ou contendo o verbo 'Denomina'."
  },
  {
    id: "MOC-00210-2026",
    tipo_oficial: "Moção",
    ementa: "Moção de Congratulações aos profissionais da saúde de Presidente Prudente pelo Dia do Enfermeiro.",
    grupo_analitico: "ATOS SIMBÓLICOS",
    subcategoria_analitica: "congratulação",
    regra_aplicada: "Manifestação coletiva de apoio ou parabenização profissional."
  },
  {
    id: "SUB-00005-2026",
    tipo_oficial: "Substitutivo",
    ementa: "Substitutivo Geral ao Projeto de Lei Complementar que disciplina o zoneamento urbano.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Substitutivo geral para reformular lei municipal urbana estrutural."
  },
  {
    id: "PL-00045-2026",
    tipo_oficial: "Projeto de Lei",
    ementa: "Institui o Dia Municipal do Doador de Sangue no Calendário Oficial do Município.",
    grupo_analitico: "PRODUÇÃO LEGISLATIVA",
    subcategoria_analitica: "legislação municipal",
    regra_aplicada: "Lei ordinária de efeito calendarar, sem ementa contendo o termo 'denomina'."
  },
  {
    id: "IND-02050-2026",
    tipo_oficial: "Indicação",
    ementa: "Indica estudos para a instalação de semáforo de pedestres no cruzamento da Av. Brasil com a Av. Coronel Marcondes.",
    grupo_analitico: "DEMANDAS E INDICAÇÕES",
    subcategoria_analitica: "trânsito",
    regra_aplicada: "Indicação propondo instalação de semáforo de pedestres (fluxo viário)."
  }
];
