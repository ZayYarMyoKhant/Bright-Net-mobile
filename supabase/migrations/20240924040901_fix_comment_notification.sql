-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.send_comment_notification();

-- Recreate the function with the correct logic to cast the post_id to text
CREATE OR REPLACE FUNCTION public.send_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the owner of the post that was commented on
  SELECT user_id INTO post_owner_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Only send a notification if the commenter is not the post owner
  IF NEW.user_id <> post_owner_id THEN
    -- Cast the post_id (bigint) to text before inserting into target_id
    INSERT INTO public.notifications (recipient_id, actor_id, type, target_id)
    VALUES (post_owner_id, NEW.user_id, 'new_comment', NEW.post_id::text);
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is correctly configured. 
-- If the trigger already exists, this will do nothing. If not, it creates it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_new_comment_send_notification'
  ) THEN
    CREATE TRIGGER on_new_comment_send_notification
      AFTER INSERT ON public.post_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.send_comment_notification();
  END IF;
END;
$$;
