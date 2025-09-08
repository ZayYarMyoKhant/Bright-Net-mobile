-- This script contains the necessary Row Level Security (RLS) policies
-- for the Bright-Net application to function correctly.
--
-- How to use:
-- 1. Go to your Supabase project dashboard.
-- 2. In the left sidebar, click on "SQL Editor".
-- 3. Click "New query".
-- 4. Copy the entire content of this file.
-- 5. Paste it into the SQL Editor.
-- 6. Click "RUN".
--
-- This will enable RLS and create all the required policies for the tables.

-- =================================================================
-- Table: class_messages
-- =================================================================

-- 1. Enable RLS on the table
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (optional, but good for a clean slate)
DROP POLICY IF EXISTS "Class members can view messages." ON public.class_messages;
DROP POLICY IF EXISTS "Class members can insert their own messages." ON public.class_messages;
DROP POLICY IF EXISTS "Users can delete their own messages." ON public.class_messages;


-- 3. Create SELECT policy: Authenticated users can read messages in classes they are a member of.
CREATE POLICY "Class members can view messages."
ON public.class_messages
FOR SELECT
TO authenticated
USING (
  (class_id IN (
    SELECT class_members.class_id
    FROM public.class_members
    WHERE (class_members.user_id = auth.uid())
  ))
);

-- 4. Create INSERT policy: Authenticated users can insert messages into classes they are a member of.
CREATE POLICY "Class members can insert their own messages."
ON public.class_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) AND
  (class_id IN (
    SELECT class_members.class_id
    FROM public.class_members
    WHERE (class_members.user_id = auth.uid())
  ))
);

-- 5. Create DELETE policy: Users can only delete their own messages.
CREATE POLICY "Users can delete their own messages."
ON public.class_messages
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id)
);


-- =================================================================
-- Table: class_members (Policies for joining/leaving classes)
-- =================================================================

-- 1. Enable RLS on the table
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can see class members." ON public.class_members;
DROP POLICY IF EXISTS "Users can join a class." ON public.class_members;
DROP POLICY IF EXISTS "Users can leave a class." ON public.class_members;

-- 3. Create SELECT policy: Allow authenticated users to see who is in which class.
CREATE POLICY "Authenticated users can see class members."
ON public.class_members
FOR SELECT
TO authenticated
USING (true);

-- 4. Create INSERT policy: Allow a user to insert a row for themselves (i.e., join a class).
CREATE POLICY "Users can join a class."
ON public.class_members
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
);

-- 5. Create DELETE policy: Allow a user to delete their own membership row (i.e., leave a class).
CREATE POLICY "Users can leave a class."
ON public.class_members
FOR DELETE
TO authenticated
USING (
  (auth.uid() = user_id)
);
