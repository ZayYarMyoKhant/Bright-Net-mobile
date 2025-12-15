-- Add the new column to the notifications table
ALTER TABLE public.notifications
ADD COLUMN target_post_id BIGINT;

-- Add a foreign key constraint to the new column
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_target_post_id_fkey FOREIGN KEY (target_post_id)
REFERENCES public.posts(id) ON DELETE CASCADE;

-- Drop the old trigger and function if they exist
DROP TRIGGER IF EXISTS on_comment_insert_send_notification ON public.post_comments;
DROP FUNCTION IF EXISTS public.send_comment_notification();

-- Create or replace the function to handle new comment notifications
CREATE OR REPLACE FUNCTION public.send_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the ID of the owner of the post that was commented on
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Insert a notification for the post owner, but not if they are the one commenting
  IF post_owner_id IS NOT NULL AND post_owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, target_id, target_post_id)
    VALUES (post_owner_id, NEW.user_id, 'new_comment', NEW.id, NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to call the function on new comment insertion
CREATE TRIGGER on_comment_insert_send_notification
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.send_comment_notification();
