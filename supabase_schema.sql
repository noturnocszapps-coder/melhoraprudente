-- PHASE 2: SUPABASE DATABASE SCHEMA
-- Melhora Prudente News Portal

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Categories Table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Posts Table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Comments Table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Ads Table
CREATE TABLE ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('home_top', 'home_middle', 'home_sidebar', 'home_footer', 'sidebar_news_detail', 'sidebar_news_detail_bottom', 'article_inline', 'category_top', 'category_footer', 'archive_top', 'archive_footer')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Pages Table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Settings Table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT DEFAULT 'Melhora Prudente',
  logo_url TEXT,
  favicon_url TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  adsense_code TEXT,
  primary_color TEXT DEFAULT '#dc2626',
  secondary_color TEXT DEFAULT '#18181b'
);

-- RLS (Row Level Security) Configuration

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public Read Access Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Published posts are viewable by everyone" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Approved comments are viewable by everyone" ON comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Active ads are viewable by everyone" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "Pages are viewable by everyone" ON pages FOR SELECT USING (true);
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);

-- Functions for Role-based Access
CREATE OR REPLACE FUNCTION get_role(user_id UUID) RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Admin Policies (Full Access)
CREATE POLICY "Admins have full access to everything" ON profiles FOR ALL USING (get_role(auth.uid()) = 'admin');
-- (Repeat for other tables for admin...)

-- Trigger for Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user', 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. News Table (Etapa 1)
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  city_slug TEXT DEFAULT 'presidente-prudente' NOT NULL,
  city_name TEXT DEFAULT 'Presidente Prudente' NOT NULL,
  region TEXT DEFAULT 'SP' NOT NULL,
  is_breaking BOOLEAN DEFAULT false NOT NULL,
  ai_classification TEXT,
  ai_relevance_score INTEGER DEFAULT 50 CHECK (ai_relevance_score BETWEEN 0 AND 100) NOT NULL,
  ai_viral_potential_score INTEGER DEFAULT 50 CHECK (ai_viral_potential_score BETWEEN 0 AND 100) NOT NULL,
  ai_regional_impact_score INTEGER DEFAULT 50 CHECK (ai_regional_impact_score BETWEEN 0 AND 100) NOT NULL,
  ai_summary TEXT,
  ai_seo_title TEXT,
  ai_seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS news_status_created_at_idx ON news (status, created_at DESC);
CREATE INDEX IF NOT EXISTS news_category_idx ON news (category);
CREATE INDEX IF NOT EXISTS news_city_slug_idx ON news (city_slug);
CREATE INDEX IF NOT EXISTS news_is_breaking_created_at_idx ON news (is_breaking, created_at DESC);

-- RLS and Policies for News
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published news are viewable by everyone" ON news FOR SELECT USING (status = 'published');
CREATE POLICY "Admins and Editors have full access to news" ON news FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor'));


-- 9. News Engagement Tables

-- news_views
CREATE TABLE IF NOT EXISTS news_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- news_likes
CREATE TABLE IF NOT EXISTS news_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(news_id, user_id)
);

-- news_comments
CREATE TABLE IF NOT EXISTS news_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES news_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS news_comments_news_status_created_at_idx ON news_comments (news_id, status, created_at);
CREATE INDEX IF NOT EXISTS news_comments_user_id_idx ON news_comments (user_id);
CREATE INDEX IF NOT EXISTS news_comments_parent_id_idx ON news_comments (parent_id);
CREATE INDEX IF NOT EXISTS news_comments_status_created_at_idx ON news_comments (status, created_at);

-- news_shares
CREATE TABLE IF NOT EXISTS news_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS and Policies for engagement tables
ALTER TABLE news_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news_views" ON news_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert news_views" ON news_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view news_likes" ON news_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can toggle news_likes" ON news_likes FOR ALL USING (auth.uid() = user_id);

-- news_comments policies
CREATE POLICY "Anyone can select approved comments" ON news_comments 
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can select their own comments" ON news_comments 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and editors can select all comments" ON news_comments 
  FOR SELECT USING (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Authenticated active users can insert comments" ON news_comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (SELECT status FROM profiles WHERE id = auth.uid()) = 'active' AND
    status = 'pending' AND
    (parent_id IS NULL OR EXISTS (
      SELECT 1 FROM news_comments p WHERE p.id = parent_id AND p.status = 'approved' AND p.news_id = news_id
    ))
  );

CREATE POLICY "Users can update their own pending comments" ON news_comments 
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
  ) WITH CHECK (
    auth.uid() = user_id AND 
    status = 'pending' AND
    moderated_at IS NULL AND
    moderated_by IS NULL
  );

CREATE POLICY "Users can delete their own pending comments" ON news_comments 
  FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
  );

CREATE POLICY "Admins and editors can manage any comment" ON news_comments 
  FOR ALL USING (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Anyone can view news_shares" ON news_shares FOR SELECT USING (true);
CREATE POLICY "Anyone can insert news_shares" ON news_shares FOR INSERT WITH CHECK (true);


-- 10. News Candidates Table (Garimpo de Notícias por IA)
CREATE TABLE IF NOT EXISTS public.news_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  external_id TEXT NOT NULL,
  original_url TEXT UNIQUE NOT NULL,
  original_title TEXT NOT NULL,
  original_excerpt TEXT,
  original_image_url TEXT,
  original_published_at TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  ai_title TEXT,
  ai_summary TEXT,
  ai_category TEXT,
  ai_relevance_score INTEGER CHECK (ai_relevance_score BETWEEN 0 AND 100),
  ai_regional_impact_score INTEGER CHECK (ai_regional_impact_score BETWEEN 0 AND 100),
  ai_viral_potential_score INTEGER CHECK (ai_viral_potential_score BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS news_candidates_status_collected_at_idx ON public.news_candidates (status, collected_at DESC);
CREATE INDEX IF NOT EXISTS news_candidates_external_id_idx ON public.news_candidates (source_name, external_id);

ALTER TABLE public.news_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can select news_candidates" ON public.news_candidates
  FOR SELECT USING (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can insert news_candidates" ON public.news_candidates
  FOR INSERT WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can update news_candidates" ON public.news_candidates
  FOR UPDATE USING (get_role(auth.uid()) IN ('admin', 'editor')) WITH CHECK (get_role(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Admins and editors can delete news_candidates" ON public.news_candidates
  FOR DELETE USING (get_role(auth.uid()) IN ('admin', 'editor'));


