-- RLS Policies for Supabase Project

-- ---------------------------------------------------------
-- 1. PROFILES Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (public access)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
FOR SELECT USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users cannot delete their profiles (for data integrity)


-- ---------------------------------------------------------
-- 2. POSTS Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all posts
DROP POLICY IF EXISTS "Authenticated users can view all posts." ON public.posts;
CREATE POLICY "Authenticated users can view all posts." ON public.posts
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create posts
DROP POLICY IF EXISTS "Authenticated users can create posts." ON public.posts;
CREATE POLICY "Authenticated users can create posts." ON public.posts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
DROP POLICY IF EXISTS "Users can update their own posts." ON public.posts;
CREATE POLICY "Users can update their own posts." ON public.posts
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own posts
DROP POLICY IF EXISTS "Users can delete their own posts." ON public posts;
CREATE POLICY "Users can delete their own posts." ON public.posts
FOR DELETE USING (auth.uid() = user_id);


-- ---------------------------------------------------------
-- 3. POST LIKES Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the post_likes table
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all likes (needed for counts)
DROP POLICY IF EXISTS "Authenticated users can view all likes." ON public.post_likes;
CREATE POLICY "Authenticated users can view all likes." ON public.post_likes
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to like/unlike posts
DROP POLICY IF EXISTS "Users can insert their own likes." ON public.post_likes;
CREATE POLICY "Users can insert their own likes." ON public.post_likes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes (unliking)
DROP POLICY IF EXISTS "Users can delete their own likes." ON public.post_likes;
CREATE POLICY "Users can delete their own likes." ON public.post_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ---------------------------------------------------------
-- 4. POST COMMENTS Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the post_comments table
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all comments
DROP POLICY IF EXISTS "Authenticated users can view all comments." ON public.post_comments;
CREATE POLICY "Authenticated users can view all comments." ON public.post_comments
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create comments
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public.post_comments;
CREATE POLICY "Authenticated users can create comments." ON public.post_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments." ON public.post_comments;
CREATE POLICY "Users can delete their own comments." ON public.post_comments
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ---------------------------------------------------------
-- 5. CLASSES Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all classes (as they are public/private joinable)
DROP POLICY IF EXISTS "Authenticated users can view all classes." ON public.classes;
CREATE POLICY "Authenticated users can view all classes." ON public.classes
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create classes
DROP POLICY IF EXISTS "Authenticated users can create classes." ON public.classes;
CREATE POLICY "Authenticated users can create classes." ON public.classes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Allow the creator to update their own class
DROP POLICY IF EXISTS "Creator can update their own class." ON public.classes;
CREATE POLICY "Creator can update their own class." ON public.classes
FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Allow the creator to delete their own class
DROP POLICY IF EXISTS "Creator can delete their own class." ON public.classes;
CREATE POLICY "Creator can delete their own class." ON public.classes
FOR DELETE USING (auth.uid() = created_by);


-- ---------------------------------------------------------
-- 6. CLASS MEMBERS Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the class_members table
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see all memberships (needed to check if they are a member)
DROP POLICY IF EXISTS "Authenticated users can view memberships." ON public.class_members;
CREATE POLICY "Authenticated users can view memberships." ON public.class_members
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to join a class
DROP POLICY IF EXISTS "Users can insert their own membership." ON public.class_members;
CREATE POLICY "Users can insert their own membership." ON public.class_members
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to leave a class (delete their own membership)
DROP POLICY IF EXISTS "Users can delete their own membership." ON public.class_members;
CREATE POLICY "Users can delete their own membership." ON public.class_members
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ---------------------------------------------------------
-- 7. CLASS MESSAGES Table Policies
-- ---------------------------------------------------------

-- Enable RLS on the class_messages table
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

-- Allow members of a class to view its messages
DROP POLICY IF EXISTS "Members can view class messages." ON public.class_messages;
CREATE POLICY "Members can view class messages." ON public.class_messages
FOR SELECT USING (
  class_id IN (
    SELECT class_id FROM public.class_members WHERE user_id = auth.uid()
  )
);

-- Allow members of a class to send messages
DROP POLICY IF EXISTS "Members can send class messages." ON public.class_messages;
CREATE POLICY "Members can send class messages." ON public.class_messages
FOR INSERT WITH CHECK (
  (auth.uid() = user_id) AND
  (class_id IN (
    SELECT class_id FROM public.class_members WHERE user_id = auth.uid()
  ))
);

-- Allow users to delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages." ON public.class_messages;
CREATE POLICY "Users can delete their own messages." ON public.class_messages
FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------
-- Storage (Avatars and Posts) Policies
-- ---------------------------------------------------------

-- Policies for 'avatars' bucket (used for profile pics and class covers)
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar." ON storage.objects
FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- Policies for 'posts' bucket
DROP POLICY IF EXISTS "Post media are publicly accessible." ON storage.objects;
CREATE POLICY "Post media are publicly accessible." ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Authenticated users can upload post media." ON storage.objects;
CREATE POLICY "Authenticated users can upload post media." ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own post media." ON storage.objects;
CREATE POLICY "Users can delete their own post media." ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'posts' AND auth.uid() = owner);
