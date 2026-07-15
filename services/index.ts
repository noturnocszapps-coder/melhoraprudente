import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Post, Category, Ad, Settings, Comment, News, NewsLike, NewsComment } from '../types';

// Helper to interact with LocalStorage for browser-side persistence of fallback data
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
    return defaultValue;
  }
}

function setStoredData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Error writing to localStorage:', error);
  }
}

// Rich Mock Data in Portuguese about Presidente Prudente
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Cidade', slug: 'cidade', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Política', slug: 'politica', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Polícia', slug: 'policia', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Esportes', slug: 'esportes', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Região', slug: 'regiao', description: null, is_active: true, created_at: new Date().toISOString() }
];

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'Grêmio Prudente intensifica preparação tática para a disputa da Série A3 do Campeonato Paulista',
    subtitle: 'Comandada pela comissão técnica regional, equipe realiza treinos em dois períodos no Estádio Prudentão.',
    slug: 'gremio-prudente-preparacao-campeonato-paulista-serie-a3',
    excerpt: 'Elenco carcará foca no aprimoramento físico e organização tática coletiva visando a estreia oficial na competição paulista.',
    content: 'O Grêmio Prudente segue em ritmo acelerado em sua preparação de pré-temporada para a disputa do Campeonato Paulista da Série A3. Os treinamentos ocorrem diariamente no Estádio Municipal Paulo Constantino, o Prudentão, com sessões em dois períodos dedicadas ao aprimoramento tático, técnico e de condicionamento de força.\n\nA diretoria do clube confirmou a chegada de novos reforços pontuais para compor o grupo de atletas, incluindo peças de meio-campo experientes do interior de São Paulo. A comissão técnica ressalta que o foco inicial está em consolidar os padrões de jogo ofensivos e a solidez defensiva coletiva.\n\n"Nosso objetivo é colocar o Grêmio Prudente em condições plenas de disputar a liderança e buscar o acesso. Sabemos que a Série A3 é uma competição extremamente competitiva e física, por isso cada sessão de treino no Prudentão é decisiva", afirmou o treinador em entrevista coletiva.',
    cover_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-4',
    status: 'published',
    is_featured: true,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Grêmio Prudente preparação Série A3 Paulista',
    seo_description: 'Grêmio Prudente realiza pré-temporada tática e física no Estádio Prudentão.',
    published_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[3],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-2',
    title: 'Prefeitura inicia obras de recapeamento e sinalização na Avenida Manoel Goulart',
    subtitle: 'Intervenções na principal via comercial de Presidente Prudente exigem desvios e atenção dos motoristas.',
    slug: 'prefeitura-inicia-obras-recapeamento-avenida-manoel-goulart',
    excerpt: 'Serviços de fresagem do asfalto antigo começaram pelo trecho próximo ao pórtico de entrada e avançam em direção ao centro comercial.',
    content: 'A Secretaria de Planejamento, Desenvolvimento Urbano e Habitação de Presidente Prudente iniciou nesta semana as obras de recapeamento asfáltico e readequação da sinalização de trânsito em trechos degradados da Avenida Manoel Goulart, a principal artéria comercial do município.\n\nO cronograma de obras abrange a fresagem mecânica da antiga camada asfáltica, a aplicação do novo pavimento asfáltico e, posteriormente, a sinalização de solo sob a supervisão da Secretaria Municipal de Mobilidade Urbana e Cooperação em Segurança Pública (Semob). Os motoristas que trafegam na entrada da cidade devem utilizar rotas alternativas recomendadas para evitar congestionamentos nos horários de pico.\n\nSegundo a administração pública municipal, a revitalização do pavimento asfáltico é parte de um programa abrangente de manutenção de corredores de transporte coletivo e vias de grande circulação regional, visando dar mais segurança e fluidez ao trânsito prudentino.',
    cover_image_url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200',
    author_id: 'auth-1',
    category_id: 'cat-1',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Obras recapeamento Avenida Manoel Goulart Prudente',
    seo_description: 'Prefeitura de Presidente Prudente inicia recapeamento na Avenida Manoel Goulart.',
    published_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[0],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-3',
    title: 'Polícia Militar deflagra \'Operação Impacto\' contra furtos e roubos em Presidente Prudente',
    subtitle: 'Ações contam com bloqueios viários e intensificação do patrulhamento preventivo em pontos estratégicos.',
    slug: 'policia-militar-operacao-impacto-presidente-prudente',
    excerpt: 'Comando de Policiamento do Interior (CPI-8) mobiliza equipes do 18º BPM/I, Força Tática e Rocam para reforçar segurança local.',
    content: 'O Comando de Policiamento do Interior (CPI-8) deflagrou a "Operação Impacto" em Presidente Prudente e demais municípios da região metropolitana. A iniciativa visa intensificar as ações de policiamento preventivo e repressivo para coibir delitos patrimoniais, como furtos e roubos em áreas residenciais e comerciais.\n\nAs ações concentram-se em pontos de grande movimentação e rotas de escape identificadas pelo setor de inteligência da Polícia Militar. Estão sendo realizados bloqueios de trânsito para fiscalização de veículos e indivíduos em atitudes suspeitas, além do emprego de equipes especializadas da Força Tática e Rondas Ostensivas com Apoio de Motocicletas (Rocam).\n\n"Esta operação demonstra o nosso compromisso com a redução contínua dos índices criminais na região e o aumento da percepção de segurança de toda a população de Presidente Prudente e arredores", explicou o porta-voz da corporação.',
    cover_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-2',
    category_id: 'cat-3',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'PM Operação Impacto Presidente Prudente segurança',
    seo_description: 'Polícia Militar intensifica patrulhamento contra roubos e furtos in Prudente.',
    published_at: new Date(Date.now() - 14400000).toISOString(),
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[2],
    author: { id: 'auth-2', full_name: 'Fernanda Lima', email: 'fernanda@melhoraprudente.com.br', role: 'editor', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-4',
    title: 'Fentepp reúne dezenas de apresentações de teatro gratuitas em Presidente Prudente',
    subtitle: 'Festival Nacional de Teatro traz espetáculos de companhias de vários estados para praças e teatros.',
    slug: 'fentepp-festival-nacional-teatro-presidente-prudente',
    excerpt: 'Evento de destaque no cenário cultural do Oeste Paulista promove o acesso gratuito à arte cênica em diversos espaços públicos.',
    content: 'Tem início em Presidente Prudente uma nova edição do tradicional Festival Nacional de Teatro (Fentepp), consagrado como um dos mais importantes eventos culturais do interior do estado de São Paulo.\n\nA programação oficial reúne companhias de teatro vindas de diferentes regiões do país, apresentando espetáculos de variados gêneros, incluindo produções infantis, dramas e intervenções de teatro de rua de acesso livre. As encenações ocorrem no Teatro de Arena da Praça Nove de Julho, no Centro Cultural Matarazzo e em praças periféricas de forma descentralizada.\n\nDe acordo com a Secretaria Municipal de Cultura, o principal pilar do Fentepp é democratizar a arte e aproximar a produção cênica contemporânea nacional de toda a comunidade prudentina. A expectativa de público para as apresentações é excelente.',
    cover_image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-1',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Fentepp Festival Teatro Presidente Prudente gratis',
    seo_description: 'Festival Nacional de Teatro promove programação gratuita de espetáculos em Prudente.',
    published_at: new Date(Date.now() - 28800000).toISOString(),
    created_at: new Date(Date.now() - 28800000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[0],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-5',
    title: 'Câmara de Presidente Prudente aprova orçamento municipal para o próximo ano legislativo',
    subtitle: 'Proposta orçamentária fixa as prioridades de repasses para saúde, educação e obras públicas urbanas.',
    slug: 'camara-presidente-prudente-aprova-orcamento-municipal',
    excerpt: 'Projeto de diretrizes orçamentárias foi votado em sessão extraordinária na Câmara de Vereadores com emendas aprovadas.',
    content: 'A Câmara Municipal de Presidente Prudente aprovou em votação definitiva, em sessão extraordinária, a Lei Orçamentária Anual (LOA) que define a estimativa de receitas e a fixação de despesas do município para o próximo ano financeiro.\n\nO orçamento garante a destinação de verbas substanciais para a melhoria dos serviços públicos básicos. A Secretaria de Saúde municipal receberá a maior parcela orçamentária, seguida pela Secretaria de Educação. Os vereadores aprovaram também emendas impositivas destinadas a pequenas intervenções viárias e recapeamento asfáltico em bairros periféricos.\n\nOs debates em plenário reforçaram a necessidade de monitoramento rigoroso da responsabilidade fiscal diante do cenário macroeconômico atual. O projeto aprovado segue agora para sanção e publicação oficial no diário municipal.',
    cover_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-2',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Câmara Presidente Prudente orçamento aprovado',
    seo_description: 'Câmara Municipal aprova diretrizes orçamentárias e LOA para o município de Prudente.',
    published_at: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[1],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-6',
    title: 'Chuva forte com queda de granizo atinge bairros e mobiliza Defesa Civil em Presidente Prudente',
    subtitle: 'Coordenadoria municipal emite orientações de segurança e atua na remoção preventiva de galhos e limpeza.',
    slug: 'chuva-forte-granizo-bairros-presidente-prudente-defesa-civil',
    excerpt: 'Pancadas rápidas de chuva provocaram pontos isolados de alagamento em avenidas marginais, sem feridos ou desabrigados.',
    content: 'Um temporal acompanhado de fortes rajadas de vento e queda localizada de granizo atingiu alguns bairros de Presidente Prudente no final da tarde de ontem. A instabilidade climática mobilizou equipes da Defesa Civil e do Corpo de Bombeiros para monitoramento de áreas vulneráveis.\n\nForam registrados pequenos pontos de acúmulo de água em trechos baixos das marginais das avenidas Manoel Goulart e Joaquim Constantino, bem como quedas de galhos de árvores em vias da zona leste. Segundo as informações oficiais, não houve feridos ou desabrigados decorrentes do evento meteorológico.\n\nAs secretarias municipais competentes iniciaram de forma ágil os trabalhos de desobstrução das bocas de lobo e limpeza geral do lixo arrastado pelas enxurradas. A Defesa Civil alerta para que os condutores não tentem cruzar vias inundadas e busquem abrigos seguros.',
    cover_image_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-1',
    status: 'published',
    is_featured: true,
    is_breaking: true,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Chuva granizo Presidente Prudente Defesa Civil',
    seo_description: 'Chuva de granizo atinge Presidente Prudente e mobiliza equipes da prefeitura.',
    published_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 600000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[0],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-7',
    title: 'Expo Prudente projeta movimentação expressiva em negócios agropecuários e leilões',
    subtitle: 'Feira agropecuária atrai produtores e investidores do Oeste Paulista ao Recinto Jacob Tosello.',
    slug: 'expo-prudente-leiloes-negocios-jacob-tosello',
    excerpt: 'Evento tradicional da pecuária e tecnologia de campo reúne dezenas de estandes de maquinários e leilões de alta linhagem.',
    content: 'A comissão organizadora da tradicional Expo Prudente confirmou as projeções de movimentação financeira que podem atingir cerca de R$ 50 milhões em transações agropecuárias nesta edição.\n\nRealizada no Recinto de Exposições Jacob Tosello, em Presidente Prudente, a feira atrai pecuaristas e agricultores interessados em leilões de alta qualidade genética bovina, novas soluções em maquinário de lavoura e palestras sobre sustentabilidade nas propriedades rurais. Há também parcerias de crédito facilitado com instituições financeiras estaduais.\n\n"A Expo Prudente é um motor fundamental do agronegócio do Oeste Paulista, pois expõe o potencial genético de nossa pecuária e gera conexões econômicas sólidas para pequenos e grandes produtores", ressaltou o comitê técnico organizador.',
    cover_image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-2',
    category_id: 'cat-5',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Expo Prudente leilões agronegócio Jacob Tosello',
    seo_description: 'Expo Prudente reúne pecuaristas e projeta negócios expressivos na região de Prudente.',
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[4],
    author: { id: 'auth-2', full_name: 'Fernanda Lima', email: 'fernanda@melhoraprudente.com.br', role: 'editor', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-8',
    title: 'Inova Prudente abre inscrições para novos cursos gratuitos na área de tecnologia e programação',
    subtitle: 'Fundação municipal oferece qualificação profissional presencial voltada para o mercado digital de software.',
    slug: 'inova-prudente-inscricoes-cursos-gratuitos-tecnologia',
    excerpt: 'Vagas são voltadas prioritariamente para estudantes de escolas públicas interessados em lógica de computação e banco de dados.',
    content: 'A Fundação Inova Prudente anunciou a abertura oficial do período de inscrições para uma série de cursos gratuitos voltados para o setor de tecnologia da informação.\n\nA capacitação abordará temas práticos, incluindo introdução ao desenvolvimento de páginas web, lógica de programação em linguagem Python e noções de estruturação de banco de dados SQL. As aulas presenciais ocorrerão nos laboratórios equipados do polo tecnológico da fundação, que oferece computadores de alta velocidade e mentores especializados de startups locais.\n\nO principal objetivo é fortalecer a qualificação de mão de obra para preencher demandas no crescente ecossistema tecnológico do Oeste Paulista. "Esta é uma grande porta de entrada para que os jovens prudentinos desenvolvam as competências mais valorizadas do mercado", comentou o diretor.',
    cover_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-1',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Inova Prudente cursos TI gratis programacao',
    seo_description: 'Inova Prudente oferece capacitações em desenvolvimento e banco de dados para estudantes.',
    published_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[0],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-9',
    title: 'Região do Oeste Paulista aponta crescimento de 5% nas exportações agropecuárias',
    subtitle: 'Desempenho favorável do setor de carnes ressalta força das cidades no comércio regional internacional.',
    slug: 'oeste-paulista-crescimento-exportacoes-agronegocio',
    excerpt: 'Cidades vizinhas a Presidente Prudente registram alta sustentada por frigoríficos e produção sucroenergética regional.',
    content: 'As exportações do agronegócio nos municípios do Oeste Paulista registraram uma variação positiva acumulada de 5% nos últimos meses, sustentando a força da economia regional.\n\nO bom resultado foi impulsionado pelo expressivo volume de envios internacionais promovido pelos frigoríficos exportadores de carne bovina instalados na microrregião de Presidente Prudente, além da comercialização do setor sucroalcooleiro. Municípios vizinhos como Álvares Machado, Regente Feijó e Rancharia desempenharam papel central nas balanças comerciais regionais.\n\nEspecialistas apontam que o contínuo ganho de eficiência técnica nas lavouras e a implementação de controles sanitários rígidos qualificam os produtores locais para atender os principais mercados globais exigentes. A tendência de alta das exportações deve se manter estável.',
    cover_image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-2',
    category_id: 'cat-5',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Oeste Paulista exportações agronegócio crescimento',
    seo_description: 'Crescimento de exportações do agronegócio reforça economia no Oeste Paulista.',
    published_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[4],
    author: { id: 'auth-2', full_name: 'Fernanda Lima', email: 'fernanda@melhoraprudente.com.br', role: 'editor', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-10',
    title: 'Equipe de atletismo de Presidente Prudente conquista pódio no Campeonato Paulista Juvenil',
    subtitle: 'Atletas locais que treinam na pista do Centro Olímpico se destacaram em provas de velocidade e campo.',
    slug: 'equipe-atletismo-presidente-prudente-conquista-medalhas',
    excerpt: 'Destaques individuais garantiram medalhas e credenciaram a delegação para disputas de nível nacional em SP.',
    content: 'Os jovens talentos do atletismo de Presidente Prudente obtiveram um resultado histórico na fase estadual do Campeonato de Atletismo Juvenil, trazendo importantes medalhas de ouro e prata na bagagem.\n\nOs atletas prudentinos, com treinamentos contínuos na pista de atletismo de nível internacional do Centro Olímpico municipal, conquistaram resultados admiráveis em provas tradicionais, incluindo os 100m rasos masculinos, salto triplo e arremesso de dardo. Os índices obtidos consolidam posições confortáveis para os representantes disputarem as finais da liga nacional.\n\n"Nosso município sempre teve enorme tradição formadora no atletismo brasileiro. Ver esses jovens no pódio paulista coroa o empenho diário de treinamento e a estrutura oferecida", celebrou o técnico e coordenador da delegação regional.',
    cover_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-4',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    region: 'SP',
    city_slug: 'presidente-prudente',
    city_name: 'Presidente Prudente',
    seo_title: 'Delegação atletismo Presidente Prudente medalhas',
    seo_description: 'Atletas de Presidente Prudente conquistam medalhas no estadual juvenil.',
    published_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[3],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  }
];

const DEFAULT_ADS: Ad[] = [
  {
    id: 'ad-1',
    name: 'Unimed Presidente Prudente',
    image_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
    target_url: 'https://www.unimed.coop.br/site/',
    slot: 'home_top',
    is_active: true,
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-2',
    name: 'Supermercados Muffato',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    target_url: 'https://www.supermuffato.com.br/',
    slot: 'home_middle',
    is_active: true,
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-3',
    name: 'Prudenshopping',
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=600',
    target_url: 'https://www.prudenshopping.com.br/',
    slot: 'home_sidebar',
    is_active: true,
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'ad-4',
    name: 'Unoeste - Universidade do Oeste Paulista',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800',
    target_url: 'https://www.unoeste.br/',
    slot: 'home_footer',
    is_active: true,
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: Settings = {
  id: 'sett-1',
  site_name: 'Melhora Prudente',
  logo_url: null,
  favicon_url: null,
  whatsapp: '(18) 3221-0000',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  adsense_code: null,
  primary_color: '#dc2626',
  secondary_color: '#18181b'
};

// Functions to get local storage state seamlessly
function getLocalPosts(): Post[] {
  return getStoredData<Post[]>('mp_fallback_posts', DEFAULT_POSTS);
}

function getLocalCategories(): Category[] {
  return getStoredData<Category[]>('mp_fallback_categories', DEFAULT_CATEGORIES);
}

function getLocalAds(): Ad[] {
  return getStoredData<Ad[]>('mp_fallback_ads', DEFAULT_ADS);
}

function getLocalSettings(): Settings {
  return getStoredData<Settings>('mp_fallback_settings', DEFAULT_SETTINGS);
}

function mapNewsRowToPost(row: any): Post {
  if (!row) return row;
  const catSlug = row.category
    ? row.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    : 'geral';

  let coverImage = row.cover_image;
  if (coverImage && (coverImage.includes('1482517967863-00e15c9b447c') || coverImage.includes('photo-1482517967863-00e15c9b447c'))) {
    coverImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200';
  }

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || null,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    cover_image_url: coverImage,
    author_id: row.author_id || 'system',
    category_id: catSlug,
    status: row.status === 'published' ? 'published' : 'draft',
    is_featured: row.is_featured || false,
    is_breaking: row.is_breaking || false,
    region: row.region || 'SP',
    city_slug: row.city_slug || 'presidente-prudente',
    city_name: row.city_name || 'Presidente Prudente',
    ai_classification: row.ai_classification || null,
    ai_relevance_score: row.ai_relevance_score ?? 50,
    ai_viral_potential_score: row.ai_viral_potential_score ?? 50,
    ai_regional_impact_score: row.ai_regional_impact_score ?? 50,
    ai_summary: row.ai_summary || null,
    ai_seo_title: row.ai_seo_title || null,
    ai_seo_description: row.ai_seo_description || null,
    seo_title: row.title,
    seo_description: row.excerpt,
    published_at: row.created_at,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    category: {
      id: catSlug,
      name: row.category || 'Geral',
      slug: catSlug,
      description: null,
      is_active: true,
      created_at: row.created_at
    },
    author: {
      id: row.author_id || 'system',
      full_name: 'Redação',
      email: 'contato@melhoraprudente.com.br',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      created_at: row.created_at,
      updated_at: row.created_at
    }
  };
}

function mapPostToNews(post: any): News {
  if (!post) return post;
  
  // Clean string helper
  const cleanTitle = post.title || '';
  const catName = post.category?.name || post.category_name || (typeof post.category === 'string' ? post.category : 'Geral');
  
  // Heuristic: Auto-detect breaking news
  let detectedBreaking = post.is_breaking || false;
  if (!detectedBreaking && (cleanTitle.toUpperCase().includes('PLANTÃO') || cleanTitle.toUpperCase().includes('URGENTE') || cleanTitle.toUpperCase().includes('BREAKING'))) {
    detectedBreaking = true;
  }

  let coverImage = post.cover_image_url || post.cover_image;
  if (coverImage && (coverImage.includes('1482517967863-00e15c9b447c') || coverImage.includes('photo-1482517967863-00e15c9b447c'))) {
    coverImage = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200';
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    cover_image: coverImage,
    category: catName,
    status: post.status === 'published' ? 'published' : 'draft',
    author_id: post.author_id || 'system',
    created_at: post.created_at,
    updated_at: post.updated_at || post.created_at,
    author: post.author,
    
    // Set advanced features
    is_breaking: detectedBreaking,
    is_featured: post.is_featured || false,
    region: post.region || 'SP',
    subtitle: post.subtitle || null,
    city_slug: post.city_slug || 'presidente-prudente',
    city_name: post.city_name || 'Presidente Prudente',
    ai_classification: post.ai_classification || null,
    ai_relevance_score: post.ai_relevance_score ?? 50,
    ai_viral_potential_score: post.ai_viral_potential_score ?? 50,
    ai_regional_impact_score: post.ai_regional_impact_score ?? 50,
    ai_summary: post.ai_summary || null,
    ai_seo_title: post.ai_seo_title || null,
    ai_seo_description: post.ai_seo_description || null
  };
}

export const newsPortalService = {
  async getLatestNews(limit = 10) {
    try {
      // Auto seed desativado para evitar manipulações não intencionais do banco de dados em fluxos de leitura.

      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Supabase error in getLatestNews:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return data.map(mapPostToNews);
      }

      const local = getLocalPosts().filter(p => p.status === 'published');
      return local.slice(0, limit).map(mapPostToNews);
    } catch (err: any) {
      const local = getLocalPosts().filter(p => p.status === 'published');
      return local.slice(0, limit).map(mapPostToNews);
    }
  },

  async getNewsBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.warn('Supabase error in getNewsBySlug:', error);
        throw error;
      }

      if (data) {
        return mapPostToNews(data);
      }

      const found = getLocalPosts().find(p => p.slug === slug);
      return found ? mapPostToNews(found) : null;
    } catch (err) {
      const found = getLocalPosts().find(p => p.slug === slug);
      return found ? mapPostToNews(found) : null;
    }
  },

  async getRelatedNews(category: string, excludeId: string, limit = 3) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .neq('id', excludeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase error in getRelatedNews:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return data
          .map(mapPostToNews)
          .filter(item => item.category?.toLowerCase() === category?.toLowerCase())
          .slice(0, limit);
      }

      return getLocalPosts()
        .filter(p => p.id !== excludeId && p.status === 'published')
        .map(mapPostToNews)
        .filter(item => item.category?.toLowerCase() === category?.toLowerCase())
        .slice(0, limit);
    } catch (err) {
      return getLocalPosts()
        .filter(p => p.id !== excludeId && p.status === 'published')
        .map(mapPostToNews)
        .filter(item => item.category?.toLowerCase() === category?.toLowerCase())
        .slice(0, limit);
    }
  }
};

export const newsService = {
  async getLatestPosts(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.warn('Supabase error in getLatestPosts:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return data.map(mapNewsRowToPost);
      }

      return getLocalPosts().filter(p => p.status === 'published').slice(0, limit);
    } catch (err) {
      return getLocalPosts().filter(p => p.status === 'published').slice(0, limit);
    }
  },

  async getFeaturedPosts() {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.warn('Supabase error in getFeaturedPosts:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return data.map(mapNewsRowToPost);
      }

      return getLocalPosts().filter(p => p.status === 'published' && p.is_featured);
    } catch (err) {
      return getLocalPosts().filter(p => p.status === 'published' && p.is_featured);
    }
  },

  async getBreakingNews(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.warn('Supabase error in getBreakingNews:', error);
        throw error;
      }

      if (data && data.length > 0) {
        return data.map(mapNewsRowToPost);
      }

      return getLocalPosts().filter(p => p.status === 'published' && p.is_breaking).slice(0, limit);
    } catch (err) {
      return getLocalPosts().filter(p => p.status === 'published' && p.is_breaking).slice(0, limit);
    }
  },

  async getMostRead(limit = 5) {
    return this.getLatestPosts(limit);
  },

  async getPostsByCategory(categorySlug: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase error in getPostsByCategory:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map(mapNewsRowToPost);
        return mapped
          .filter(p => p.category?.slug === categorySlug)
          .slice(0, limit);
      }

      return getLocalPosts()
        .filter(p => p.status === 'published' && p.category?.slug === categorySlug)
        .slice(0, limit);
    } catch (err) {
      return getLocalPosts()
        .filter(p => p.status === 'published' && p.category?.slug === categorySlug)
        .slice(0, limit);
    }
  },

  async getPostBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) {
        console.warn('Supabase error in getPostBySlug:', error);
        throw error;
      }

      if (data) {
        return mapNewsRowToPost(data);
      }

      const found = getLocalPosts().find(p => p.slug === slug);
      if (!found) throw new Error('Not found');
      return found;
    } catch (err) {
      const found = getLocalPosts().find(p => p.slug === slug);
      if (!found) throw new Error('Not found');
      return found;
    }
  },

  async getRelatedPosts(categoryId: string, excludePostId: string, limit = 4) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .neq('id', excludePostId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Supabase error in getRelatedPosts:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const mapped = data.map(mapNewsRowToPost);
        return mapped
          .filter(p => p.category_id === categoryId)
          .slice(0, limit);
      }

      return getLocalPosts()
        .filter(p => p.status === 'published' && p.category_id === categoryId && p.id !== excludePostId)
        .slice(0, limit);
    } catch (err) {
      return getLocalPosts()
        .filter(p => p.status === 'published' && p.category_id === categoryId && p.id !== excludePostId)
        .slice(0, limit);
    }
  }
};

export const categoryService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    } catch (err) {
      console.warn('Local fallback for categoryService.getAll:', err);
      return getLocalCategories().filter(c => c.is_active);
    }
  },

  async getBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Category;
    } catch (err) {
      console.warn('Local fallback for categoryService.getBySlug:', err);
      const found = getLocalCategories().find(c => c.slug === slug);
      if (!found) throw new Error('Not found');
      return found;
    }
  }
};

export const commentService = {
  async getByPost(postId: string) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(comment => ({
        ...comment,
        user: comment.user || {
          id: comment.user_id || 'guest',
          full_name: 'Usuário Leitor',
          email: 'leitor@melhoraprudente.com.br',
          role: 'user',
          status: 'active',
          avatar_url: null,
          created_at: comment.created_at,
          updated_at: comment.created_at
        }
      })) as Comment[];
    } catch (err) {
      console.warn('Local fallback for commentService.getByPost:', err);
      const localComments = getStoredData<Comment[]>('mp_fallback_comments', []);
      return localComments.filter(c => c.post_id === postId && c.status === 'approved');
    }
  },

  async create(comment: Partial<Comment>) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([comment])
        .select()
        .single();
      
      if (error) throw error;
      return data as Comment;
    } catch (err) {
      console.warn('Local fallback for commentService.create:', err);
      const localComments = getStoredData<Comment[]>('mp_fallback_comments', []);
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        post_id: comment.post_id || '',
        user_id: comment.user_id || '',
        content: comment.content || '',
        status: comment.status || 'approved',
        created_at: new Date().toISOString(),
        user: { id: comment.user_id || 'guest', full_name: 'Usuário Leitor', email: 'leitor@melhoraprudente.com.br', role: 'user', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
      };
      localComments.push(newComment);
      setStoredData('mp_fallback_comments', localComments);
      return newComment;
    }
  }
};

export const adService = {
  async getActiveAdsBySlot(slot: string) {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('slot', slot)
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString());
      
      if (error) throw error;
      return data as Ad[];
    } catch (err) {
      console.warn('Local fallback for adService.getActiveAdsBySlot:', err);
      return getLocalAds().filter(ad => ad.slot === slot && ad.is_active);
    }
  }
};

export const settingsService = {
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as Settings;
    } catch (err) {
      console.warn('Local fallback for settingsService.getSettings:', err);
      return getLocalSettings();
    }
  }
};

function getLocalProfile(userId: string): any {
  if (typeof window !== 'undefined') {
    const cachedProfile = window.localStorage.getItem('mp_user_profile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.id === userId || parsed.user_id === userId) return parsed;
      } catch (e) {}
    }
  }
  
  if (userId === 'auth-1') {
    return { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' };
  }
  if (userId === 'auth-2') {
    return { id: 'auth-2', full_name: 'Fernanda Lima', email: 'fernanda@melhoraprudente.com.br', role: 'editor', status: 'active', avatar_url: null, created_at: '', updated_at: '' };
  }
  return { id: userId, full_name: 'Usuário Leitor', email: 'leitor@melhoraprudente.com.br', role: 'user', status: 'active', avatar_url: null, created_at: '', updated_at: '' };
}

export const engagementService = {
  // --- LIKES ---
  async toggleLike(newsId: string, userId: string) {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('news_likes')
        .select('*')
        .eq('news_id', newsId)
        .eq('user_id', userId)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        const { error: deleteError } = await supabase
          .from('news_likes')
          .delete()
          .eq('news_id', newsId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
        return { liked: false, count: await this.getLikesCount(newsId) };
      } else {
        const { error: insertError } = await supabase
          .from('news_likes')
          .insert({ news_id: newsId, user_id: userId });

        if (insertError) throw insertError;
        return { liked: true, count: await this.getLikesCount(newsId) };
      }
    } catch (err) {
      console.warn('Local fallback for toggleLike:', err);
      const likes = getStoredData<NewsLike[]>('mp_fallback_likes', []);
      const existingIndex = likes.findIndex(l => l.news_id === newsId && l.user_id === userId);
      let liked = false;
      if (existingIndex > -1) {
        likes.splice(existingIndex, 1);
      } else {
        likes.push({
          id: `like-${Date.now()}`,
          news_id: newsId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
        liked = true;
      }
      setStoredData('mp_fallback_likes', likes);
      const count = likes.filter(l => l.news_id === newsId).length;
      return { liked, count };
    }
  },

  async getLikesCount(newsId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('news_likes')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.warn('Local fallback for getLikesCount:', err);
      const likes = getStoredData<NewsLike[]>('mp_fallback_likes', []);
      return likes.filter(l => l.news_id === newsId).length;
    }
  },

  async hasUserLiked(newsId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from('news_likes')
        .select('id')
        .eq('news_id', newsId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.warn('Local fallback for hasUserLiked:', err);
      const likes = getStoredData<NewsLike[]>('mp_fallback_likes', []);
      return likes.some(l => l.news_id === newsId && l.user_id === userId);
    }
  },

  // --- COMMENTS ---
  async getComments(newsId: string, currentUserId?: string): Promise<NewsComment[]> {
    try {
      // Buscar comentários com o perfil do usuário para saber a role do autor
      const { data, error } = await supabase
        .from('news_comments')
        .select('*, user:profiles(full_name, avatar_url, role)')
        .eq('news_id', newsId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Determinar a role do usuário logado se houver currentUserId
      let currentUserRole = 'user';
      if (currentUserId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUserId)
          .maybeSingle();
        if (profileData) {
          currentUserRole = profileData.role;
        }
      }

      // Filtrar os comentários:
      // - Admins e Editores veem tudo
      // - Comentários aprovados são visíveis para todos
      // - Comentários pendentes são visíveis apenas para o próprio autor
      const filteredComments = (data || []).filter(comment => {
        if (currentUserRole === 'admin' || currentUserRole === 'editor') return true;
        if (comment.status === 'approved') return true;
        if (currentUserId && comment.user_id === currentUserId) return true;
        return false;
      });

      const flatComments = filteredComments.map(comment => ({
        ...comment,
        user: comment.user || getLocalProfile(comment.user_id)
      })) as NewsComment[];
      return this.buildCommentTree(flatComments);
    } catch (err) {
      console.warn('Local fallback for getComments:', err);
      const localComments = getStoredData<any[]>('mp_fallback_news_comments', []);
      const filtered = localComments
        .filter(c => c.news_id === newsId && (c.status === 'approved' || (currentUserId && c.user_id === currentUserId)))
        .map(c => ({
          ...c,
          user: c.user || getLocalProfile(c.user_id)
        }));
      return this.buildCommentTree(filtered);
    }
  },

  buildCommentTree(flatComments: NewsComment[]): NewsComment[] {
    const commentMap: { [key: string]: NewsComment } = {};
    const roots: NewsComment[] = [];

    // Map all comments
    flatComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Resolve hierarchy
    flatComments.forEach(comment => {
      const mappedComment = commentMap[comment.id];
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies = commentMap[comment.parent_id].replies || [];
        commentMap[comment.parent_id].replies!.push(mappedComment);
      } else if (!comment.parent_id) {
        roots.push(mappedComment);
      }
    });

    return roots;
  },

  async createComment(newsId: string, userId: string, content: string, parentId: string | null = null): Promise<NewsComment> {
    try {
      // 1. Verificar se o usuário está suspenso ou bloqueado
      const { data: userProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileErr) throw profileErr;
      if (userProfile && (userProfile.status === 'suspended' || userProfile.status === 'blocked')) {
        throw new Error('Sua conta está suspensa ou bloqueada. Você não tem permissão para enviar comentários.');
      }

      // 2. Se for resposta, verificar se o comentário pai existe e se não está rejeitado
      if (parentId) {
        const { data: parentComment, error: parentErr } = await supabase
          .from('news_comments')
          .select('status')
          .eq('id', parentId)
          .maybeSingle();

        if (parentErr) throw parentErr;
        if (!parentComment) {
          throw new Error('O comentário original não foi encontrado.');
        }
        if (parentComment.status === 'rejected') {
          throw new Error('Não é possível responder a um comentário rejeitado.');
        }
      }

      // 3. Inserir comentário com status 'pending'
      const { data, error } = await supabase
        .from('news_comments')
        .insert({
          news_id: newsId,
          user_id: userId,
          parent_id: parentId,
          content: content.trim(),
          status: 'pending' // Forçar status pendente para moderação administrativa
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        ...data,
        user: getLocalProfile(userId)
      } as NewsComment;
    } catch (err: any) {
      console.warn('Error in createComment:', err);
      throw err; // Propagar erro real para exibição controlada na UI
    }
  },

  // --- VIEWS ---
  async recordView(newsId: string, sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('news_views')
        .insert({ news_id: newsId, session_id: sessionId });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Local fallback for recordView:', err);
      const views = getStoredData<any[]>('mp_fallback_views', []);
      const alreadyViewed = views.some(v => v.news_id === newsId && v.session_id === sessionId);
      if (!alreadyViewed) {
        views.push({
          id: `view-${Date.now()}`,
          news_id: newsId,
          session_id: sessionId,
          created_at: new Date().toISOString()
        });
        setStoredData('mp_fallback_views', views);
      }
      return true;
    }
  },

  async getViewsCount(newsId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('news_views')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.warn('Local fallback for getViewsCount:', err);
      const views = getStoredData<any[]>('mp_fallback_views', []);
      return views.filter(v => v.news_id === newsId).length;
    }
  },

  // --- SHARES ---
  async recordShare(newsId: string, platform: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('news_shares')
        .insert({ news_id: newsId, platform });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Local fallback for recordShare:', err);
      const shares = getStoredData<any[]>('mp_fallback_shares', []);
      shares.push({
        id: `share-${Date.now()}`,
        news_id: newsId,
        platform,
        created_at: new Date().toISOString()
      });
      setStoredData('mp_fallback_shares', shares);
      return true;
    }
  },

  async getSharesCount(newsId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('news_shares')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.warn('Local fallback for getSharesCount:', err);
      const shares = getStoredData<any[]>('mp_fallback_shares', []);
      return shares.filter(s => s.news_id === newsId).length;
    }
  },

  // --- STATS & METRICS (Section 6 & 7) ---
  async getEngagementMetrics() {
    let likesCount = 0;
    let commentsCount = 0;
    let viewsCount = 0;
    let sharesCount = 0;
    let loadedFromDb = false;

    if (isSupabaseConfigured) {
      try {
        const [likesRes, commentsRes, viewsRes, sharesRes] = await Promise.all([
          supabase.from('news_likes').select('*', { count: 'exact', head: true }),
          supabase.from('news_comments').select('*', { count: 'exact', head: true }),
          supabase.from('news_views').select('*', { count: 'exact', head: true }),
          supabase.from('news_shares').select('*', { count: 'exact', head: true }),
        ]);

        if (!likesRes.error) likesCount = likesRes.count || 0;
        if (!commentsRes.error) commentsCount = commentsRes.count || 0;
        if (!viewsRes.error) viewsCount = viewsRes.count || 0;
        if (!sharesRes.error) sharesCount = sharesRes.count || 0;
        loadedFromDb = true;
      } catch (err) {
        console.warn('Error fetching engagement metrics from Supabase:', err);
      }
    }

    if (!loadedFromDb) {
      const likes = getStoredData<NewsLike[]>('mp_fallback_likes', []);
      const comments = getStoredData<NewsComment[]>('mp_fallback_news_comments', []);
      const views = getStoredData<any[]>('mp_fallback_views', []);
      const shares = getStoredData<any[]>('mp_fallback_shares', []);
      
      likesCount = likes.length;
      commentsCount = comments.length;
      viewsCount = views.length;
      sharesCount = shares.length;
    }

    return {
      likesCount,
      commentsCount,
      viewsCount,
      sharesCount
    };
  },

  async getActiveUsersRanking(): Promise<{ profile: any; score: number; likesCount: number; commentsCount: number }[]> {
    try {
      const likes = getStoredData<NewsLike[]>('mp_fallback_likes', []);
      const comments = getStoredData<any[]>('mp_fallback_news_comments', []);

      const userScores: { [userId: string]: { likes: number; comments: number } } = {};

      likes.forEach(like => {
        if (!userScores[like.user_id]) userScores[like.user_id] = { likes: 0, comments: 0 };
        userScores[like.user_id].likes += 1;
      });

      comments.forEach(comment => {
        if (!userScores[comment.user_id]) userScores[comment.user_id] = { likes: 0, comments: 0 };
        userScores[comment.user_id].comments += 1;
      });

      const ranking = Object.keys(userScores).map(userId => {
        const stats = userScores[userId];
        const profile = getLocalProfile(userId);
        return {
          profile,
          likesCount: stats.likes,
          commentsCount: stats.comments,
          score: stats.comments * 3 + stats.likes * 1
        };
      });

      return ranking.sort((a, b) => b.score - a.score);
    } catch (err) {
      console.error('Error calculating active users ranking:', err);
      return [];
    }
  },

  async getTrendingNews(
    limit = 5, 
    filterRegion?: string | null, 
    realTimeOnly = false
  ): Promise<(News & { viewsCount: number; likesCount: number; commentsCount: number; sharesCount: number; score: number })[]> {
    try {
      const newsList = await newsPortalService.getLatestNews(100);
      
      let likesList: any[] = [];
      let commentsList: any[] = [];
      let viewsList: any[] = [];
      let sharesList: any[] = [];
      let loadedFromDb = false;

      if (isSupabaseConfigured) {
        try {
          const [likesRes, commentsRes, viewsRes, sharesRes] = await Promise.all([
            supabase.from('news_likes').select('*'),
            supabase.from('news_comments').select('*'),
            supabase.from('news_views').select('*'),
            supabase.from('news_shares').select('*')
          ]);

          const dbLikes = likesRes.data;
          const likesErr = likesRes.error;
          const dbComments = commentsRes.data;
          const commentsErr = commentsRes.error;
          const dbViews = viewsRes.data;
          const viewsErr = viewsRes.error;
          const dbShares = sharesRes.data;
          const sharesErr = sharesRes.error;
          
          if (!likesErr && dbLikes) {
            likesList = dbLikes;
            loadedFromDb = true;
          }
          if (!commentsErr && dbComments) {
            commentsList = dbComments;
            loadedFromDb = true;
          }
          if (!viewsErr && dbViews) {
            viewsList = dbViews;
            loadedFromDb = true;
          }
          if (!sharesErr && dbShares) {
            sharesList = dbShares;
            loadedFromDb = true;
          }
        } catch (dbErr) {
          console.warn('Error fetching engagement from Supabase for trending:', dbErr);
        }
      }

      if (!loadedFromDb) {
        likesList = getStoredData<NewsLike[]>('mp_fallback_likes', []);
        commentsList = getStoredData<any[]>('mp_fallback_news_comments', []);
        viewsList = getStoredData<any[]>('mp_fallback_views', []);
        sharesList = getStoredData<any[]>('mp_fallback_shares', []);
      }

      const nowTime = Date.now();
      const last15m = 15 * 60 * 1000;

      const newsWithEngagement = newsList.map(news => {
        const newsLikes = likesList.filter(l => l.news_id === news.id);
        const newsComments = commentsList.filter(c => c.news_id === news.id);
        const newsViews = viewsList.filter(v => v.news_id === news.id);
        const newsShares = sharesList.filter(s => s.news_id === news.id);

        const likesCount = newsLikes.length;
        const commentsCount = newsComments.length;
        const viewsCount = newsViews.length;
        const sharesCount = newsShares.length;
        
        // Velocity: interactions in the last 15 minutes
        const likesLast15 = newsLikes.filter(x => (nowTime - new Date(x.created_at || nowTime).getTime()) <= last15m).length;
        const commentsLast15 = newsComments.filter(x => (nowTime - new Date(x.created_at || nowTime).getTime()) <= last15m).length;
        const viewsLast15 = newsViews.filter(x => (nowTime - new Date(x.created_at || nowTime).getTime()) <= last15m).length;
        const sharesLast15 = newsShares.filter(x => (nowTime - new Date(x.created_at || nowTime).getTime()) <= last15m).length;

        // velocity_boost: rate of growth
        const velocity_boost = (viewsLast15 * 5) + (likesLast15 * 15) + (commentsLast15 * 25) + (sharesLast15 * 20);

        const ageInHours = (nowTime - new Date(news.created_at).getTime()) / 3600000;
        
        // recency_boost: linear decay from 48 down to 0 points
        const recency_boost = ageInHours <= 48 ? Math.max(0, 48 - ageInHours) : 0;
        
        // geo_boost: regional relevance (e.g. if requested region matches, add 30 points)
        const geo_boost = (filterRegion && news.region === filterRegion) ? 30 : 0;

        // Complete score: views*1 + likes*4 + comments*6 + shares*5 + recency_boost + geo_boost + velocity_boost
        const score = (viewsCount * 1) + (likesCount * 4) + (commentsCount * 6) + (sharesCount * 5) + recency_boost + geo_boost + velocity_boost;

        return {
          ...news,
          viewsCount,
          likesCount,
          commentsCount,
          sharesCount,
          score,
          velocityScore: velocity_boost
        };
      });

      // Focus EXCLUSIVELY on Presidente Prudente and surroundings
      const filteredNews = newsWithEngagement.filter(news => 
        news.city_slug === 'presidente-prudente' || !news.city_slug
      );

      if (realTimeOnly) {
        // Sort primarily by recent growth rate (velocityScore)
        return filteredNews.sort((a, b) => b.velocityScore - a.velocityScore).slice(0, limit);
      }

      return filteredNews.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (err) {
      console.error('Error fetching trending news:', err);
      return [];
    }
  }

};

