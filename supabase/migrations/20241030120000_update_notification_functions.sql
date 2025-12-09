
-- Helper function to invoke the send-push-notification edge function
CREATE OR REPLACE FUNCTION trigger_push_notification(recipient_id_param UUID, title_param TEXT, body_param TEXT, data_param JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tokens_array TEXT[];
BEGIN
    -- Get all active push tokens for the recipient
    SELECT ARRAY_AGG(token) INTO tokens_array FROM public.push_notification_tokens WHERE user_id = recipient_id_param;

    -- Only proceed if there are tokens to send to
    IF array_length(tokens_array, 1) > 0 THEN
        -- Invoke the Edge Function
        PERFORM net.http_post(
            -- URL of the Edge Function
            url := 'http://localhost:54321/functions/v1/send-push-notification',
            -- Headers
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni7eTJyrD_xSox1EVHdWsNIF3s"}'::JSONB,
            -- Body
            body := jsonb_build_object(
                'tokens', tokens_array,
                'title', title_param,
                'body', body_param,
                'data', data_param
            )
        );
    END IF;
END;
$$;


-- Function to handle new comment notifications
CREATE OR REPLACE FUNCTION public.handle_new_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id UUID;
    actor_name TEXT;
    notification_title TEXT;
    notification_body TEXT;
    notification_data JSONB;
BEGIN
    -- Get the ID of the owner of the post that was commented on
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    -- Get the name of the user who made the comment
    SELECT full_name INTO actor_name FROM profiles WHERE id = NEW.user_id;

    -- Create a notification only if the commenter is not the post owner
    IF NEW.user_id <> post_owner_id THEN
        INSERT INTO public.notifications (actor_id, recipient_id, type, target_id, target_parent_id)
        VALUES (NEW.user_id, post_owner_id, 'new_comment', NEW.id, NEW.post_id);

        -- Prepare and send the push notification
        notification_title := 'New Comment';
        notification_body := actor_name || ' commented on your post.';
        notification_data := jsonb_build_object(
            'type', 'new_comment',
            'postId', NEW.post_id
        );
        
        PERFORM trigger_push_notification(post_owner_id, notification_title, notification_body, notification_data);
    END IF;
    
    RETURN NEW;
END;
$$;


-- Function to handle new follower notifications
CREATE OR REPLACE FUNCTION public.handle_new_follower_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    actor_name TEXT;
    notification_title TEXT;
    notification_body TEXT;
    notification_data JSONB;
BEGIN
    -- Insert into notifications table
    INSERT INTO public.notifications (actor_id, recipient_id, type, target_id)
    VALUES (NEW.follower_id, NEW.user_id, 'new_follower', NEW.follower_id);

    -- Get the name of the user who followed
    SELECT full_name INTO actor_name FROM profiles WHERE id = NEW.follower_id;

    -- Prepare and send the push notification
    notification_title := 'New Follower';
    notification_body := actor_name || ' started following you.';
    notification_data := jsonb_build_object(
        'type', 'new_follower',
        'profileId', NEW.follower_id
    );

    PERFORM trigger_push_notification(NEW.user_id, notification_title, notification_body, notification_data);
    
    RETURN NEW;
END;
$$;

-- Note: The triggers themselves don't need to be recreated if they already exist from the previous step.
-- This SQL file is designed to be run to UPDATE the functions.
-- If you are running this for the first time, make sure the triggers are also created:

-- DROP TRIGGER IF EXISTS on_new_comment_create_notification ON public.post_comments;
-- CREATE TRIGGER on_new_comment_create_notification
-- AFTER INSERT ON public.post_comments
-- FOR EACH ROW
-- EXECUTE FUNCTION public.handle_new_comment_notification();

-- DROP TRIGGER IF EXISTS on_new_follower_create_notification ON public.followers;
-- CREATE TRIGGER on_new_follower_create_notification
-- AFTER INSERT ON public.followers
-- FOR EACH ROW
-- EXECUTE FUNCTION public.handle_new_follower_notification();
