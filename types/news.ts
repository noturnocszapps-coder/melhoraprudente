export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category: string;
  tags?: string[];
  image_url?: string;
  source_name?: string;
  original_url?: string;
  published_at: string;
  views_count?: number;
  is_featured?: boolean;
  is_breaking?: boolean;
  read_time_minutes?: number;
}

export type CategorySlug =
  | 'todas'
  | 'cidade'
  | 'economia'
  | 'politica'
  | 'seguranca'
  | 'inovacao'
  | 'cultura'
  | 'regiao';

export interface CategoryInfo {
  id: CategorySlug;
  label: string;
  description?: string;
  color?: string;
}
