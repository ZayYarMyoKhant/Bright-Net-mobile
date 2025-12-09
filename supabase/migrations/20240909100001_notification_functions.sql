
-- Function to create a notification for a new comment
CREATE OR REPLACE FUNCTION handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    -- Get the owner of the post
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;

    -- Create a notification if the commenter is not the post owner
    IF post_owner_id IS NOT NULL AND NEW.user_id <> post_owner_id THEN
        INSERT INTO notifications (actor_id, recipient_id, type, target_id, target_parent_id)
        VALUES (NEW.user_id, post_owner_id, 'new_comment', NEW.id, NEW.post_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new comments
CREATE TRIGGER new_comment_notification_trigger
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION handle_new_comment_notification();


-- Function to create a notification for a new follower
CREATE OR REPLACE FUNCTION handle_new_follower_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a notification for the user who is being followed
    INSERT INTO notifications (actor_id, recipient_id, type, target_id)
    VALUES (NEW.follower_id, NEW.user_id, 'new_follower', NEW.follower_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new followers
CREATE TRIGGER new_follower_notification_trigger
AFTER INSERT ON followers
FOR EACH ROW
EXECUTE FUNCTION handle_new_follower_notification();
