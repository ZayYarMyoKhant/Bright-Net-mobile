
-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts." ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts." ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts." ON public.posts;

DROP POLICY IF EXISTS "Likes are viewable by everyone." ON public.post_likes;
DROP POLICY IF EXISTS "Users can insert their own likes." ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes." ON public.post_likes;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.post_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments." ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments." ON public.post_comments;

DROP POLICY IF EXISTS "Views are readable by everyone" ON public.post_views;
DROP POLICY IF EXISTS "Allow insert for anyone" ON public.post_views;

DROP POLICY IF EXISTS "Classes are viewable by everyone." ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can create classes." ON public.classes;
DROP POLICY IF EXISTS "Class creators can delete their own classes." ON public.classes;
DROP POLICY IF EXISTS "Class creators can update their own classes." ON public.classes;

DROP POLICY IF EXISTS "Membership is viewable by everyone." ON public.class_members;
DROP POLICY IF EXISTS "Authenticated users can join classes." ON public.class_members;
DROP POLICY IF EXISTS "Users can leave classes." ON public.class_members;

DROP POLICY IF EXISTS "Messages are viewable by members of the class." ON public.class_messages;
DROP POLICY IF EXISTS "Class members can send messages." ON public.class_messages;
DROP POLICY IF EXISTS "Users can delete their own messages." ON public.class_messages;

DROP POLICY IF EXISTS "Reactions are viewable by class members." ON public.message_reactions;
DROP POLICY IF EXISTS "Class members can react to messages." ON public.message_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions." ON public.message_reactions;

DROP POLICY IF EXISTS "Read statuses are viewable by class members." ON public.message_read_status;
DROP POLICY IF EXISTS "Class members can create read statuses." ON public.message_read_status;


-- =================================================================
-- PROFILES Table Policies
-- =================================================================
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- =================================================================
-- POSTS Table Policies
-- =================================================================
CREATE POLICY "Posts are viewable by everyone."
  ON public.posts FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own posts."
  ON public.posts FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own posts."
  ON public.posts FOR DELETE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can update their own posts."
  ON public.posts FOR UPDATE
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- =================================================================
-- POST_LIKES Table Policies
-- =================================================================
CREATE POLICY "Likes are viewable by everyone."
  ON public.post_likes FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own likes."
  ON public.post_likes FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own likes."
  ON public.post_likes FOR DELETE
  USING ( auth.uid() = user_id );

-- =================================================================
-- POST_COMMENTS Table Policies
-- =================================================================
CREATE POLICY "Comments are viewable by everyone."
  ON public.post_comments FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert comments."
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK ( true );

CREATE POLICY "Users can delete their own comments."
  ON public.post_comments FOR DELETE
  USING ( auth.uid() = user_id );

-- =================================================================
-- POST_VIEWS Table Policies
-- =================================================================
CREATE POLICY "Views are readable by everyone" 
  ON public.post_views FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert for anyone" 
  ON public.post_views FOR INSERT 
  WITH CHECK (true);

-- =================================================================
-- CLASSES Table Policies
-- =================================================================
CREATE POLICY "Classes are viewable by everyone."
  ON public.classes FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can create classes."
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = created_by );

CREATE POLICY "Class creators can delete their own classes."
  ON public.classes FOR DELETE
  USING ( auth.uid() = created_by );

CREATE POLICY "Class creators can update their own classes."
  ON public.classes FOR UPDATE
  USING ( auth.uid() = created_by );

-- =================================================================
-- CLASS_MEMBERS Table Policies
-- =================================================================
CREATE POLICY "Membership is viewable by everyone."
  ON public.class_members FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can join classes."
  ON public.class_members FOR INSERT
  TO authenticated
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can leave classes."
  ON public.class_members FOR DELETE
  USING ( auth.uid() = user_id );


-- =================================================================
-- CLASS_MESSAGES Table Policies
-- =================================================================
CREATE POLICY "Messages are viewable by members of the class."
  ON public.class_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.class_members
      WHERE class_members.class_id = class_messages.class_id
        AND class_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Class members can send messages."
  ON public.class_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1
      FROM public.class_members
      WHERE class_members.class_id = class_messages.class_id
        AND class_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages."
  ON public.class_messages FOR DELETE
  USING ( auth.uid() = user_id );

-- =================================================================
-- MESSAGE_REACTIONS Table Policies
-- =================================================================
CREATE POLICY "Reactions are viewable by class members."
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.class_messages
      JOIN public.class_members ON class_messages.class_id = class_members.class_id
      WHERE class_messages.id = message_reactions.message_id
        AND class_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Class members can react to messages."
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.class_messages
      JOIN public.class_members ON class_messages.class_id = class_members.class_id
      WHERE class_messages.id = message_reactions.message_id
        AND class_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reactions."
  ON public.message_reactions FOR DELETE
  USING ( auth.uid() = user_id );

-- =================================================================
-- MESSAGE_READ_STATUS Table Policies
-- =================================================================
CREATE POLICY "Read statuses are viewable by class members."
  ON public.message_read_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.class_messages
      JOIN public.class_members ON class_messages.class_id = class_members.class_id
      WHERE class_messages.id = message_read_status.message_id
        AND class_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Class members can create read statuses."
  ON public.message_read_status FOR INSERT
  WITH CHECK (
    auth.uid() = reader_id AND
    EXISTS (
      SELECT 1
      FROM public.class_messages
      JOIN public.class_members ON class_messages.class_id = class_members.class_id
      WHERE class_messages.id = message_read_status.message_id
        AND class_members.user_id = auth.uid()
    )
  );
