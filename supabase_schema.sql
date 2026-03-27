-- PHASE 2: SUPABASE DATABASE SCHEMA
-- Melhora Prudente News Portal

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
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
  slot TEXT NOT NULL CHECK (slot IN ('home_top', 'home_middle', 'sidebar_top', 'sidebar_bottom', 'post_inline', 'post_footer')),
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
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
