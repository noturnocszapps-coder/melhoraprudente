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
  { id: 'cat-2', name: 'Região', slug: 'regiao', description: null, is_active: true, created_at: new Date().toISOString() }
];

const DEFAULT_POSTS: Post[] = [];

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
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('mp_fallback_posts');
      window.localStorage.removeItem('mp_fallback_news');
      window.localStorage.removeItem('mp_fallback_likes');
      window.localStorage.removeItem('mp_fallback_news_comments');
      window.localStorage.removeItem('mp_fallback_views');
      window.localStorage.removeItem('mp_fallback_shares');
    } catch (e) {}
  }
  return [];
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
        .select('*, user:profiles!news_comments_user_id_fkey(full_name, avatar_url, role)')
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
  },

  async getMostReadLast24h(limit = 5): Promise<(News & { viewsCount: number })[]> {
    try {
      const newsList = await newsPortalService.getLatestNews(100);
      let viewsList: any[] = [];
      let loadedFromDb = false;

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('news_views')
            .select('*')
            .gte('created_at', oneDayAgo);

          if (!error && data) {
            viewsList = data;
            loadedFromDb = true;
          }
        } catch (dbErr) {
          console.warn('Error fetching views from Supabase for most read 24h:', dbErr);
        }
      }

      if (!loadedFromDb) {
        viewsList = getStoredData<any[]>('mp_fallback_views', []);
      }

      // Filter views list to last 24 hours
      const viewsLast24h = viewsList.filter(v => {
        try {
          return new Date(v.created_at).getTime() >= (Date.now() - 24 * 60 * 60 * 1000);
        } catch {
          return false;
        }
      });

      // Group views by news_id
      const viewCounts: { [newsId: string]: number } = {};
      viewsLast24h.forEach(v => {
        viewCounts[v.news_id] = (viewCounts[v.news_id] || 0) + 1;
      });

      // Map to news items
      const newsWithViews = newsList.map(news => {
        const viewsCount = viewCounts[news.id] || 0;
        return {
          ...news,
          viewsCount
        };
      });

      // Sort by viewsCount descending, then by created_at descending
      const sorted = newsWithViews.sort((a, b) => {
        if (b.viewsCount !== a.viewsCount) {
          return b.viewsCount - a.viewsCount;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return sorted.slice(0, limit);
    } catch (err) {
      console.error('Error fetching most read news last 24h:', err);
      try {
        const fallbackNews = await newsPortalService.getLatestNews(limit);
        return fallbackNews.map(n => ({ ...n, viewsCount: 0 }));
      } catch {
        return [];
      }
    }
  }

};

