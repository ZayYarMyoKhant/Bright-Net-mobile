
-- 1. Create the notification type enum
CREATE TYPE public.notification_type AS ENUM (
    'new_comment',
    'new_follower'
);

-- 2. Create the notifications table
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    recipient_id uuid NOT NULL,
    actor_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    target_id uuid,
    target_parent_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
    CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policies for notifications table
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications (to mark as read)"
ON public.notifications
FOR UPDATE USING (auth.uid() = recipient_id);

-- 4. Function to create a notification for a new comment
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id uuid;
    post_id_val uuid;
BEGIN
    -- Get the owner of the post
    SELECT user_id, id INTO post_owner_id, post_id_val
    FROM public.posts
    WHERE id = NEW.post_id;

    -- Only send a notification if the commenter is not the post owner
    IF post_owner_id IS NOT NULL AND NEW.user_id <> post_owner_id THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, target_id, target_parent_id)
        VALUES (post_owner_id, NEW.user_id, 'new_comment', NEW.id, post_id_val);
    END IF;

    RETURN NEW;
END;
$$;

-- 5. Trigger to call the function when a new comment is inserted
CREATE TRIGGER on_new_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

-- 6. Function to create a notification for a new follower
CREATE OR REPLACE FUNCTION public.create_follower_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only send notification if it's not a private account (no request needed)
    -- and the follower is not the user themselves.
    IF NEW.user_id <> NEW.follower_id THEN
         INSERT INTO public.notifications (recipient_id, actor_id, type, target_id)
         VALUES (NEW.user_id, NEW.follower_id, 'new_follower', NEW.follower_id);
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. Trigger to call the function when a new follow relationship is created
CREATE TRIGGER on_new_follower
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.create_follower_notification();

