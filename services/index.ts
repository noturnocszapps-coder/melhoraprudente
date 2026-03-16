import { supabase } from '../lib/supabase';
import { Post, Category, Ad, Settings } from '../types';

export const newsService = {
  async getLatestPosts(limit = 10) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase error in getLatestPosts:', error);
      throw error;
    }
    return data as Post[];
  },

  async getFeaturedPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error in getFeaturedPosts:', error);
      throw error;
    }
    return data as Post[];
  },

  async getPostsByCategory(categorySlug: string, limit = 10) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, category:categories!inner(*), author:profiles(*)')
      .eq('status', 'published')
      .eq('categories.slug', categorySlug)
      .order('published_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase error in getPostsByCategory:', error);
      throw error;
    }
    return data as Post[];
  },

  async getPostBySlug(slug: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data as Post;
  },

  async getRelatedPosts(categoryId: string, excludePostId: string, limit = 4) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('status', 'published')
      .eq('category_id', categoryId)
      .neq('id', excludePostId)
      .order('published_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Post[];
  }
};

export const categoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  }
};

export const adService = {
  async getActiveAdsBySlot(slot: string) {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('slot', slot)
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString());
    
    if (error) throw error;
    return data as Ad[];
  }
};

export const settingsService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Settings;
  }
};
