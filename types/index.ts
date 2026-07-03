export type Role = 'admin' | 'editor' | 'user';
export type UserStatus = 'active' | 'suspended' | 'blocked';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: Role;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export type PostStatus = 'draft' | 'review' | 'published' | 'archived';

export interface Post {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_id: string;
  category_id: string;
  status: PostStatus;
  is_featured: boolean;
  is_breaking: boolean;
  region?: string | null;
  city_slug?: string | null;
  city_name?: string | null;
  ai_classification?: string | null;
  ai_relevance_score?: number | null;
  ai_viral_potential_score?: number | null;
  ai_regional_impact_score?: number | null;
  ai_summary?: string | null;
  ai_seo_title?: string | null;
  ai_seo_description?: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  author?: Profile;
  category?: Category;
}

export type NewsStatus = 'draft' | 'published';

export interface News {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string;
  status: NewsStatus;
  author_id: string;
  created_at: string;
  updated_at: string;
  
  // Advanced features
  is_breaking?: boolean;
  is_featured?: boolean;
  region?: string | null; // e.g., 'BR', 'SP', 'RJ', 'PR' etc.
  subtitle?: string | null;
  
  // Multi-city tenant fields
  city_slug?: string | null;
  city_name?: string | null;
  
  // AI Editorial fields
  ai_classification?: string | null;
  ai_relevance_score?: number | null;
  ai_viral_potential_score?: number | null;
  ai_regional_impact_score?: number | null;
  ai_summary?: string | null;
  ai_seo_title?: string | null;
  ai_seo_description?: string | null;
  
  // Computed fields
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  score?: number;

  // Joined fields
  author?: Profile;
}


export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Profile;
  posts?: { title: string };
}

export interface Ad {
  id: string;
  name: string;
  image_url: string;
  target_url: string;
  slot: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  adsense_code: string | null;
  primary_color: string;
  secondary_color: string;
}

export interface NewsLike {
  id: string;
  news_id: string;
  user_id: string;
  created_at: string;
}

export interface NewsComment {
  id: string;
  news_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user?: Profile;
  replies?: NewsComment[];
}

export interface NewsView {
  id: string;
  news_id: string;
  session_id: string;
  created_at: string;
}

export interface NewsShare {
  id: string;
  news_id: string;
  platform: string;
  created_at: string;
}


