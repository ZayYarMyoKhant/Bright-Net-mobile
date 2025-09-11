
-- =================================================================
-- RLS Policies for Bright-Net Application
-- =================================================================
-- This script sets up Row-Level Security (RLS) for all tables.
-- Run this script in your Supabase SQL Editor to apply the policies.
-- =================================================================

-- ----------------------------------------
-- Table: profiles
-- ----------------------------------------
-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- 2. Policy: Authenticated users can view all profiles.
CREATE POLICY "Allow authenticated users to view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
-- 3. Policy: Users can insert their own profile.
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
-- 4. Policy: Users can update their own profile.
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- 5. Policy: Users can delete their own profile.
CREATE POLICY "Allow users to delete their own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);


-- ----------------------------------------
-- Table: posts
-- ----------------------------------------
-- 1. Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- 2. Policy: Authenticated users can view all posts.
CREATE POLICY "Allow authenticated users to view all posts" ON public.posts FOR SELECT TO authenticated USING (true);
-- 3. Policy: Users can create their own posts.
CREATE POLICY "Allow users to create their own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- 4. Policy: Users can update their own posts.
CREATE POLICY "Allow users to update their own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- 5. Policy: Users can delete their own posts.
CREATE POLICY "Allow users to delete their own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ----------------------------------------
-- Table: classes
-- ----------------------------------------
-- 1. Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
-- 2. Policy: Authenticated users can view all classes.
CREATE POLICY "Allow authenticated users to view all classes" ON public.classes FOR SELECT TO authenticated USING (true);
-- 3. Policy: Authenticated users can create new classes.
CREATE POLICY "Allow authenticated users to create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
-- 4. Policy: Only the creator can update or delete their class.
CREATE POLICY "Allow creators to update their class" ON public.classes FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow creators to delete their class" ON public.classes FOR DELETE TO authenticated USING (auth.uid() = created_by);


-- ----------------------------------------
-- Table: class_members
-- ----------------------------------------
-- 1. Enable RLS
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
-- 2. Policy: Authenticated users can view all memberships (to check who is in a class).
CREATE POLICY "Allow authenticated users to view memberships" ON public.class_members FOR SELECT TO authenticated USING (true);
-- 3. Policy: Authenticated users can join a class (insert a new membership for themselves).
CREATE POLICY "Allow users to join classes" ON public.class_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- 4. Policy: Users can leave a class (delete their own membership).
CREATE POLICY "Allow users to leave classes" ON public.class_members FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ----------------------------------------
-- Table: post_likes, post_comments, message_reactions (General Social Interaction)
-- These tables follow a similar pattern.
-- ----------------------------------------

-- post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view all likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to like posts" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to unlike posts" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view all comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to create comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Note: Update policy might be needed if you allow editing comments.

-- message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view all reactions" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to add/update reactions" ON public.message_reactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Using 'FOR ALL' simplifies insert/update/delete for reactions. A user can add, change, or remove their reaction.


-- ----------------------------------------
-- Storage Policies (avatars, posts, etc.)
-- Go to Supabase Dashboard -> Storage -> Policies
-- You will need to create policies for your storage buckets.
-- Example for 'avatars' bucket:
-- ----------------------------------------

-- Allow public read access to avatars
-- (This is usually okay for profile pictures)
-- CREATE POLICY "Public read access for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
-- CREATE POLICY "Allow users to upload to their folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update/delete their own files
-- CREATE POLICY "Allow users to manage their own files" ON storage.objects FOR (UPDATE | DELETE) TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Example for 'posts' bucket:
-- CREATE POLICY "Public read access for post media" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
-- CREATE POLICY "Allow users to upload post media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Allow users to delete their own post media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

