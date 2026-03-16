export type Role = 'admin' | 'redator' | 'usuario';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: Role;
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
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  author?: Profile;
  category?: Category;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Profile;
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
