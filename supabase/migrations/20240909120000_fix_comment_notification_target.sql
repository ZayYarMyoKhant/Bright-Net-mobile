
-- Add the new target_post_id column to the notifications table
ALTER TABLE public.notifications
ADD COLUMN target_post_id BIGINT;

-- Add a foreign key constraint to link it to the posts table
ALTER TABLE public.notifications
ADD CONSTRAINT fk_target_post
FOREIGN KEY (target_post_id)
REFERENCES public.posts(id)
ON DELETE CASCADE;

-- Drop the existing function and trigger to redefine them
DROP TRIGGER IF EXISTS on_new_comment_send_notification ON public.post_comments;
DROP FUNCTION IF EXISTS public.send_comment_notification();

-- Recreate the function to use the new target_post_id column
CREATE OR REPLACE FUNCTION public.send_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  post_owner_allows_notifications BOOLEAN;
BEGIN
  -- Get the ID of the user who owns the post
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Check if the commenter is not the post owner
  IF NEW.user_id <> post_owner_id THEN
    -- Check if the post owner allows push notifications
    SELECT allow_push_notifications INTO post_owner_allows_notifications
    FROM public.profiles
    WHERE id = post_owner_id;
    
    -- Insert a notification if allowed
    IF post_owner_allows_notifications IS TRUE THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, target_post_id)
      VALUES (post_owner_id, NEW.user_id, 'new_comment', NEW.post_id);
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to call the updated function
CREATE TRIGGER on_new_comment_send_notification
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.send_comment_notification();
