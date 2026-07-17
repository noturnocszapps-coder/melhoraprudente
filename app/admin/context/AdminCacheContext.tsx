'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { engagementService } from '@/services';

interface AdminCacheType {
  // Dashboard
  stats: {
    totalPosts: number;
    totalUsers: number;
    totalCategories: number;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
  };
  trending: any[];
  growth: {
    dailyGrowth: string;
    weeklyGrowth: string;
    avgReadingTime: string;
    estimatedBounceRate: string;
  };
  dashboardLoading: boolean;

  // Noticias
  newsList: any[];
  newsCategories: string[];
  newsLoading: boolean;

  // Categorias
  categories: any[];
  categoriesLoading: boolean;

  // Comentarios
  comments: any[];
  commentsLoading: boolean;
  commentsFilter: string;

  // Usuarios
  users: any[];
  commentCounts: Record<string, number>;
  postCounts: Record<string, number>;
  usersLoading: boolean;

  // Anuncios
  ads: any[];
  adsLoading: boolean;

  // Actions
  refreshDashboard: () => Promise<void>;
  refreshNews: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshComments: (filter: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshAds: () => Promise<void>;

  // Direct state setters (for in-place optimistic mutations)
  setNewsList: React.Dispatch<React.SetStateAction<any[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setComments: React.Dispatch<React.SetStateAction<any[]>>;
  setUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setAds: React.Dispatch<React.SetStateAction<any[]>>;
}

const AdminCacheContext = createContext<AdminCacheType | undefined>(undefined);

// Local helpers for robust offline/fallback data persistence
function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

function setStoredData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export const AdminCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Dashboard State
  const [stats, setStats] = useState(() => getStoredData('mp_cache_dashboard_stats', {
    totalPosts: 0,
    totalUsers: 0,
    totalCategories: 0,
    likesCount: 0,
    commentsCount: 0,
    viewsCount: 0,
    sharesCount: 0
  }));
  const [trending, setTrending] = useState<any[]>(() => getStoredData('mp_cache_dashboard_trending', []));
  const [growth, setGrowth] = useState(() => getStoredData('mp_cache_dashboard_growth', {
    dailyGrowth: '+0%',
    weeklyGrowth: '+0%',
    avgReadingTime: '2m 00s',
    estimatedBounceRate: '40.0%'
  }));
  const [dashboardLoading, setDashboardLoading] = useState(() => {
    const hasCache = getStoredData('mp_cache_dashboard_stats', null);
    return !hasCache;
  });

  // 2. Noticias State
  const [newsList, setNewsList] = useState<any[]>(() => getStoredData('mp_cache_news_list', []));
  const [newsCategories, setNewsCategories] = useState<string[]>(() => getStoredData('mp_cache_news_categories', ['all', 'Cidade', 'Política', 'Segurança', 'Esportes', 'Cultura', 'Geral']));
  const [newsLoading, setNewsLoading] = useState(() => {
    const hasCache = getStoredData('mp_cache_news_list', null);
    return !hasCache;
  });

  // 3. Categorias State
  const [categories, setCategories] = useState<any[]>(() => getStoredData('mp_cache_categories', []));
  const [categoriesLoading, setCategoriesLoading] = useState(() => {
    const hasCache = getStoredData('mp_cache_categories', null);
    return !hasCache;
  });

  // 4. Comentarios State
  const [comments, setComments] = useState<any[]>(() => getStoredData('mp_cache_comments', []));
  const [commentsFilter, setCommentsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [commentsLoading, setCommentsLoading] = useState(() => {
    const hasCache = getStoredData('mp_cache_comments', null);
    return !hasCache;
  });

  // 5. Usuarios State
  const [users, setUsers] = useState<any[]>(() => getStoredData('mp_cache_users', []));
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() => getStoredData('mp_cache_user_comment_counts', {}));
  const [postCounts, setPostCounts] = useState<Record<string, number>>(() => getStoredData('mp_cache_user_post_counts', {}));
  const [usersLoading, setUsersLoading] = useState(() => {
    const hasCache = getStoredData('mp_cache_users', null);
    return !hasCache;
  });

  // 6. Anuncios State
  const [ads, setAds] = useState<any[]>(() => getStoredData('mp_cache_ads', []));
  const [adsLoading, setAdsLoading] = useState(() => {
    const hasCache = getStoredData('mp_cache_ads', null);
    return !hasCache;
  });

  // --- REFRESH FUNCTIONS (SWR Background Revalidation) ---

  const refreshDashboard = async () => {
    try {
      const safeCount = async (table: string) => {
        try {
          const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
          if (error) throw error;
          return count || 0;
        } catch (e) {
          console.warn(`Could not fetch count for ${table}:`, e);
          return 0;
        }
      };

      const [postsCount, usersCount, categoriesCount, engagementMetrics, trendingNews] = await Promise.all([
        safeCount('news'),
        safeCount('profiles'),
        safeCount('categories'),
        engagementService.getEngagementMetrics(),
        engagementService.getTrendingNews(15)
      ]);

      // Calculate dynamic reading time based on actual word counts
      let totalWords = 0;
      let articlesWithContent = 0;
      trendingNews.forEach(item => {
        if (item.content) {
          totalWords += item.content.split(/\s+/).length;
          articlesWithContent++;
        }
      });

      const avgWords = articlesWithContent > 0 ? Math.round(totalWords / articlesWithContent) : 250;
      const totalSeconds = Math.round((avgWords / 200) * 60);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const avgReadingStr = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

      const bounceBase = 45;
      const engagementFactor = Math.min(20, (engagementMetrics.likesCount + engagementMetrics.commentsCount * 2 + engagementMetrics.sharesCount * 1.5) / Math.max(1, engagementMetrics.viewsCount) * 100);
      const estimatedBounce = Math.max(28.5, bounceBase - engagementFactor).toFixed(1) + '%';

      const freshStats = {
        totalPosts: postsCount,
        totalUsers: usersCount,
        totalCategories: categoriesCount,
        likesCount: engagementMetrics.likesCount,
        commentsCount: engagementMetrics.commentsCount,
        viewsCount: engagementMetrics.viewsCount,
        sharesCount: engagementMetrics.sharesCount
      };

      const freshGrowth = {
        dailyGrowth: `+${postsCount > 0 ? Math.min(20, Math.ceil(postsCount * 0.12)) : 0}%`,
        weeklyGrowth: `+${postsCount > 0 ? Math.min(45, Math.ceil(postsCount * 0.28)) : 0}%`,
        avgReadingTime: avgReadingStr,
        estimatedBounceRate: estimatedBounce
      };

      setStats(freshStats);
      setTrending(trendingNews);
      setGrowth(freshGrowth);

      setStoredData('mp_cache_dashboard_stats', freshStats);
      setStoredData('mp_cache_dashboard_trending', trendingNews);
      setStoredData('mp_cache_dashboard_growth', freshGrowth);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const refreshNews = async () => {
    try {
      let fetchedNews: any[] = [];
      let categoriesList: string[] = ['all'];

      // Fetch categories
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('categories')
            .select('name')
            .eq('is_active', true)
            .order('name', { ascending: true });
          
          if (error) throw error;
          if (data && data.length > 0) {
            categoriesList = ['all', ...Array.from(new Set(data.map((c: any) => c.name)))];
          }
        }
      } catch (error) {
        console.warn('Error fetching categories for news:', error);
      }

      // Fetch news
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('news')
          .select('*, author:profiles(full_name), news_views(id)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        fetchedNews = data || [];
      } else {
        fetchedNews = getStoredData<any[]>('mp_fallback_posts', []);
      }

      const mapped = fetchedNews.map((post: any) => {
        let viewsCount = 0;
        if (isSupabaseConfigured) {
          viewsCount = post.news_views ? post.news_views.length : 0;
        } else {
          const localViews = getStoredData<any[]>('mp_fallback_views', []);
          viewsCount = localViews.filter((v: any) => v.news_id === post.id).length;
        }

        return {
          id: post.id,
          title: post.title || 'Sem título',
          slug: post.slug || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          category: post.category || 'Geral',
          status: post.status || 'draft',
          author_id: post.author_id,
          created_at: post.created_at,
          updated_at: post.updated_at || post.created_at,
          cover_image: post.cover_image || post.cover_image_url || null,
          city_name: post.city_name || 'Presidente Prudente',
          city_slug: post.city_slug || 'presidente-prudente',
          region: post.region || 'SP',
          viewsCount: viewsCount,
          author: post.author || { full_name: 'Redação' }
        };
      });

      setNewsList(mapped);
      setNewsCategories(categoriesList);

      setStoredData('mp_cache_news_list', mapped);
      setStoredData('mp_cache_news_categories', categoriesList);
      // Synchronize with original fallback structure just in case
      setStoredData('mp_fallback_posts', fetchedNews);
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
      setStoredData('mp_cache_categories', data || []);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const refreshComments = async (filter: string = 'pending') => {
    try {
      let query = supabase
        .from('news_comments')
        .select('*, news:news!news_comments_news_id_fkey(title), user:profiles!news_comments_user_id_fkey(full_name, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setComments(data || []);
      setCommentsFilter(filter as any);
      setStoredData('mp_cache_comments', data || []);
    } catch (error) {
      console.error('Error refreshing comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const refreshUsers = async () => {
    try {
      // 1. Profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;

      // 2. Comments count
      let comments: any[] = [];
      let commentsErrorOccurred = false;
      try {
        const { data, error } = await supabase
          .from('news_comments')
          .select('id, user_id, status');
        if (error) throw error;
        if (data) comments = data;
      } catch (e) {
        commentsErrorOccurred = true;
      }

      // 3. News count
      let newsItems: any[] = [];
      let newsErrorOccurred = false;
      try {
        const { data, error } = await supabase
          .from('news')
          .select('id, author_id');
        if (error) throw error;
        if (data) newsItems = data;
      } catch (e) {
        newsErrorOccurred = true;
      }

      const countsComments: Record<string, number> = {};
      if (commentsErrorOccurred) {
        profiles?.forEach(u => {
          countsComments[u.id] = -1;
        });
      } else {
        comments.forEach(c => {
          if (c.status === 'approved') {
            countsComments[c.user_id] = (countsComments[c.user_id] || 0) + 1;
          }
        });
      }

      const countsPosts: Record<string, number> = {};
      if (newsErrorOccurred) {
        profiles?.forEach(u => {
          countsPosts[u.id] = -1;
        });
      } else {
        newsItems.forEach(p => {
          if (p.author_id) {
            countsPosts[p.author_id] = (countsPosts[p.author_id] || 0) + 1;
          }
        });
      }

      const usersList = profiles || [];
      setUsers(usersList);
      setCommentCounts(countsComments);
      setPostCounts(countsPosts);

      setStoredData('mp_cache_users', usersList);
      setStoredData('mp_cache_user_comment_counts', countsComments);
      setStoredData('mp_cache_user_post_counts', countsPosts);
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
      setStoredData('mp_cache_ads', data || []);
    } catch (error) {
      console.error('Error refreshing ads:', error);
    } finally {
      setAdsLoading(false);
    }
  };

  // Trigger SWR caches silently on mount
  useEffect(() => {
    refreshDashboard();
    refreshNews();
    refreshCategories();
    refreshComments(commentsFilter);
    refreshUsers();
    refreshAds();
  }, []);

  return (
    <AdminCacheContext.Provider value={{
      stats,
      trending,
      growth,
      dashboardLoading,

      newsList,
      newsCategories,
      newsLoading,

      categories,
      categoriesLoading,

      comments,
      commentsLoading,
      commentsFilter,

      users,
      commentCounts,
      postCounts,
      usersLoading,

      ads,
      adsLoading,

      refreshDashboard,
      refreshNews,
      refreshCategories,
      refreshComments,
      refreshUsers,
      refreshAds,

      setNewsList,
      setCategories,
      setComments,
      setUsers,
      setAds
    }}>
      {children}
    </AdminCacheContext.Provider>
  );
};

export const useAdminCache = () => {
  const context = useContext(AdminCacheContext);
  if (context === undefined) {
    throw new Error('useAdminCache must be used within an AdminCacheProvider');
  }
  return context;
};
