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
  { id: 'cat-3', name: 'Segurança', slug: 'seguranca', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Esportes', slug: 'esportes', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Cultura', slug: 'cultura', description: null, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Geral', slug: 'geral', description: null, is_active: true, created_at: new Date().toISOString() }
];

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-1',
    title: 'Prefeitura de Presidente Prudente anuncia revitalização completa da Avenida Manoel Goulart',
    subtitle: 'Obras de R$ 15 milhões incluem ciclovia, nova iluminação em LED e recapeamento asfáltico completo.',
    slug: 'prefeitura-anuncia-revitalizacao-avenida-manoel-goulart',
    excerpt: 'Obras começam na próxima segunda-feira e visam modernizar o principal corredor comercial da cidade, com previsão de conclusão em seis meses.',
    content: 'A Prefeitura de Presidente Prudente anunciou hoje um plano abrangente de revitalização para a Avenida Manoel Goulart, a mais importante artéria comercial e de tráfego do município.\n\nCom investimentos previstos de R$ 15 milhões, o projeto contempla o recapeamento asfáltico completo de toda a extensão, a instalação de novas lâmpadas de LED de alta eficiência energética, e a construção de uma ciclovia bidirecional no canteiro central.\n\nSegundo o prefeito, a intervenção visa melhorar a mobilidade urbana, promover a segurança dos pedestres e ciclistas, e impulsionar o comércio varejista local. "É uma obra aguardada há décadas que transformará a entrada da nossa cidade e trará mais qualidade de vida a todos os prudentinos", destacou.',
    cover_image_url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200',
    author_id: 'auth-1',
    category_id: 'cat-1',
    status: 'published',
    is_featured: true,
    is_breaking: true,
    seo_title: 'Revitalização Manoel Goulart Presidente Prudente',
    seo_description: 'Obra de revitalização da Avenida Manoel Goulart em Presidente Prudente.',
    published_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[0],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-2',
    title: 'Prudente Futebol Clube vence partida decisiva por 3x1 e lidera a tabela do torneio regional',
    subtitle: 'Com dois gols de centroavante, o time garantiu a vitória diante de casa cheia no Prudentão.',
    slug: 'prudente-futebol-clube-vence-partida-decisiva',
    excerpt: 'Com dois gols do centroavante Marcos e grande atuação do goleiro Lucas, a equipe manteve o primeiro lugar na tabela e animou os torcedores.',
    content: 'O Prudente FC conquistou uma vitória memorável na noite de ontem, jogando no estádio Prudentão. O placar de 3 a 1 sobre o rival regional garantiu ao clube a manutenção da liderança isolada do torneio.\n\nComandada pelo técnico Roberto, a equipe mostrou entrosamento tático e dominou a partida desde os primeiros minutos. O destaque do jogo foi o atacante Marcos, autor de dois gols de cabeça. A torcida encheu os setores liberados do estádio e comemorou muito a boa campanha que credencia o clube para a fase de mata-mata nacional.',
    cover_image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-2',
    category_id: 'cat-4',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    seo_title: null,
    seo_description: null,
    published_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[3],
    author: { id: 'auth-2', full_name: 'Fernanda Lima', email: 'fernanda@melhoraprudente.com.br', role: 'editor', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-3',
    title: 'Festival de Teatro de Presidente Prudente começa nesta quinta com mais de 20 espetáculos gratuitos',
    subtitle: 'Peças locais e nacionais serão encenadas em palcos públicos e teatros parceiros até o fim do mês.',
    slug: 'festival-de-teatro-presidente-prudente-comeca-nesta-quinta',
    excerpt: 'Abertura oficial ocorre na Praça Nove de Julho com um show de performances circenses e intervenções artísticas abertas ao público.',
    content: 'Tem início hoje um dos maiores eventos culturais do oeste paulista: o Festival Anual de Teatro de Presidente Prudente.\n\nNesta edição, serão apresentados 22 espetáculos de companhias renomadas do estado de São Paulo e de outras partes do Brasil. O festival prioriza a acessibilidade e tem 100% de sua programação gratuita. Além dos teatros municipais, praças e parques da cidade receberão palcos abertos ao ar livre para levar a arte dramática diretamente à população.',
    cover_image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-5',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    seo_title: null,
    seo_description: null,
    published_at: new Date(Date.now() - 14400000).toISOString(),
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[4],
    author: { id: 'auth-1', full_name: 'Antônio Silva', email: 'antonio@melhoraprudente.com.br', role: 'admin', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-4',
    title: 'Centro de Monitoramento Inteligente por câmeras começa a operar nas principais vias comerciais',
    subtitle: 'Iniciativa municipal une inteligência artificial e forças policiais para combater pequenos delitos.',
    slug: 'centro-monitoramento-inteligente-cameras-operacao',
    excerpt: 'Sistema inovador conta com leitura automática de placas e inteligência artificial para detectar padrões suspeitos em tempo real.',
    content: 'O comércio do centro de Presidente Prudente ganhou um importante reforço de segurança hoje. A prefeitura inaugurou o novo Centro de Monitoramento Inteligente (CMI), integrando 120 novas câmeras de ultra definição.\n\nO sistema utiliza algoritmos avançados de reconhecimento que alertam automaticamente a Central de Comando e as patrulhas de rua sobre comportamentos de risco ou veículos cadastrados no sistema de busca por roubos. Representantes das associações comerciais elogiaram a rapidez de implantação da medida.',
    cover_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-2',
    category_id: 'cat-3',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    seo_title: null,
    seo_description: null,
    published_at: new Date(Date.now() - 28800000).toISOString(),
    created_at: new Date(Date.now() - 28800000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[2],
    author: { id: 'auth-2', full_name: 'Fernanda Lima', email: 'fernanda@melhoraprudente.com.br', role: 'editor', status: 'active', avatar_url: null, created_at: '', updated_at: '' }
  },
  {
    id: 'post-5',
    title: 'Parque Tecnológico de Prudente abre 50 vagas de aceleração para novas startups inovadoras',
    subtitle: 'Edital apoiará projetos de tecnologia aplicada ao agronegócio e desenvolvimento sustentável.',
    slug: 'parque-tecnologico-prudente-vagas-aceleracao',
    excerpt: 'As inscrições vão até o próximo dia 20 e oferecem mentoria especializada, infraestrutura compartilhada e fomento inicial.',
    content: 'Excelente oportunidade para empreendedores e desenvolvedores locais. O Parque Tecnológico de Presidente Prudente publicou o edital para a contratação e incubação de até 50 startups inovadoras.\n\nO foco deste ano está em ideias que resolvam gargalos do agronegócio regional e desenvolvam sistemas inteligentes de energia renovável. As equipes selecionadas receberão mentorias semanais de especialistas do ecossistema nacional, espaço de coworking gratuito e conectividade de alta performance para prototipar suas soluções.',
    cover_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
    author_id: 'auth-1',
    category_id: 'cat-6',
    status: 'published',
    is_featured: false,
    is_breaking: false,
    seo_title: null,
    seo_description: null,
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: DEFAULT_CATEGORIES[5],
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

  return {
    id: row.id,
    title: row.title,
    subtitle: null,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    cover_image_url: row.cover_image,
    author_id: row.author_id || 'system',
    category_id: catSlug,
    status: row.status === 'published' ? 'published' : 'draft',
    is_featured: false,
    is_breaking: false,
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
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    cover_image: post.cover_image_url || post.cover_image,
    category: post.category?.name || post.category_name || (typeof post.category === 'string' ? post.category : 'Geral'),
    status: post.status === 'published' ? 'published' : 'draft',
    author_id: post.author_id || 'system',
    created_at: post.created_at,
    updated_at: post.updated_at || post.created_at,
    author: post.author
  };
}

export const newsPortalService = {
  async autoSeedDatabase() {
    if (!isSupabaseConfigured) return;
    try {
      // Seed ONLY 'news' table for compatibility
      const { data: existingNews, error: newsCheckErr } = await supabase
        .from('news')
        .select('id')
        .limit(1);

      if (!newsCheckErr && (!existingNews || existingNews.length === 0)) {
        const newsToInsert = DEFAULT_POSTS.map(post => ({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt || '',
          cover_image: post.cover_image_url || null,
          category: post.category?.name || 'Geral',
          status: 'published',
          created_at: post.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        await supabase.from('news').insert(newsToInsert);
        console.log('Database successfully seeded with initial local news!');
      }
    } catch (err) {
      console.warn('Failed to auto-seed database:', err);
    }
  },

  async getLatestNews(limit = 10) {
    try {
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
  async getComments(newsId: string): Promise<NewsComment[]> {
    try {
      const { data, error } = await supabase
        .from('news_comments')
        .select('*')
        .eq('news_id', newsId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const flatComments = (data || []).map(comment => ({
        ...comment,
        user: comment.user || getLocalProfile(comment.user_id)
      })) as NewsComment[];
      return this.buildCommentTree(flatComments);
    } catch (err) {
      console.warn('Local fallback for getComments:', err);
      const localComments = getStoredData<any[]>('mp_fallback_news_comments', []);
      const filtered = localComments
        .filter(c => c.news_id === newsId)
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
      const { data, error } = await supabase
        .from('news_comments')
        .insert({
          news_id: newsId,
          user_id: userId,
          parent_id: parentId,
          content: content.trim()
        })
        .select('*')
        .single();

      if (error) throw error;
      return {
        ...data,
        user: getLocalProfile(userId)
      } as NewsComment;
    } catch (err) {
      console.warn('Local fallback for createComment:', err);
      const localComments = getStoredData<any[]>('mp_fallback_news_comments', []);
      const userProfile = getLocalProfile(userId);
      const newComment: any = {
        id: `comment-${Date.now()}`,
        news_id: newsId,
        user_id: userId,
        parent_id: parentId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: userProfile
      };
      localComments.push(newComment);
      setStoredData('mp_fallback_news_comments', localComments);
      return newComment;
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

  async getTrendingNews(limit = 5): Promise<(News & { viewsCount: number; likesCount: number; commentsCount: number; sharesCount: number; score: number })[]> {
    try {
      const newsList = await newsPortalService.getLatestNews(100);
      
      let likesList: any[] = [];
      let commentsList: any[] = [];
      let viewsList: any[] = [];
      let sharesList: any[] = [];
      let loadedFromDb = false;

      if (isSupabaseConfigured) {
        try {
          const { data: dbLikes, error: likesErr } = await supabase.from('news_likes').select('*');
          const { data: dbComments, error: commentsErr } = await supabase.from('news_comments').select('*');
          const { data: dbViews, error: viewsErr } = await supabase.from('news_views').select('*');
          const { data: dbShares, error: sharesErr } = await supabase.from('news_shares').select('*');
          
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

      const newsWithEngagement = newsList.map(news => {
        const likesCount = likesList.filter(l => l.news_id === news.id).length;
        const commentsCount = commentsList.filter(c => c.news_id === news.id).length;
        const viewsCount = viewsList.filter(v => v.news_id === news.id).length;
        const sharesCount = sharesList.filter(s => s.news_id === news.id).length;
        
        const ageInHours = (Date.now() - new Date(news.created_at).getTime()) / 3600000;
        
        // Recency Score: maximum 48 points for fresh posts (under 48h), sliding down linearly to 0
        const recencyScore = ageInHours <= 48 ? Math.max(0, 48 - ageInHours) : 0;
        
        // Advanced formula: score = (views * 1) + (likes * 4) + (comments * 10) + (shares * 6) + recencyScore
        const score = (viewsCount * 1) + (likesCount * 4) + (commentsCount * 10) + (sharesCount * 6) + recencyScore;

        return {
          ...news,
          viewsCount,
          likesCount,
          commentsCount,
          sharesCount,
          score
        };
      });

      return newsWithEngagement.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (err) {
      console.error('Error fetching trending news:', err);
      return [];
    }
  }

};

