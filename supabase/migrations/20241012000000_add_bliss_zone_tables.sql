
-- Create couples table
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    first_loving_day DATE,
    status TEXT CHECK (status IN ('requesting', 'accepted', 'broken_up')) NOT NULL DEFAULT 'requesting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user1_id, user2_id)
);

-- Create trigger to update `is_in_relationship` on profiles
CREATE OR REPLACE FUNCTION update_is_in_relationship()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'accepted') OR (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted') THEN
        UPDATE public.profiles SET is_in_relationship = TRUE WHERE id = NEW.user1_id OR id = NEW.user2_id;
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'broken_up') OR (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET is_in_relationship = FALSE WHERE id = OLD.user1_id OR id = OLD.user2_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER couples_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.couples
FOR EACH ROW EXECUTE FUNCTION update_is_in_relationship();


-- Function to get couple details for a user
CREATE OR REPLACE FUNCTION get_couple_details(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    first_loving_day TEXT,
    user1 JSON,
    user2 JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.first_loving_day::text,
        json_build_object('id', u1.id, 'full_name', u1.full_name, 'avatar_url', u1.avatar_url),
        json_build_object('id', u2.id, 'full_name', u2.full_name, 'avatar_url', u2.avatar_url)
    FROM public.couples c
    JOIN public.profiles u1 ON c.user1_id = u1.id
    JOIN public.profiles u2 ON c.user2_id = u2.id
    WHERE (c.user1_id = user_id_param OR c.user2_id = user_id_param) AND c.status = 'accepted'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to handle break up
CREATE OR REPLACE FUNCTION break_up_couple(couple_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.couples SET status = 'broken_up' WHERE id = couple_id_param;
END;
$$ LANGUAGE plpgsql;


-- Create xo_games table
CREATE TABLE IF NOT EXISTS public.xo_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    player1_score INT NOT NULL DEFAULT 0,
    player2_score INT NOT NULL DEFAULT 0,
    current_turn UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    board_state TEXT[] CHECK (array_length(board_state, 1) = 9),
    winner TEXT CHECK (winner IN ('X', 'O', 'draw')),
    status TEXT CHECK (status IN ('requesting', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'requesting',
    match_winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to accept a couple request
CREATE OR REPLACE FUNCTION accept_couple_request(couple_id_param UUID)
RETURNS void AS $$
DECLARE
    couple_record RECORD;
BEGIN
    -- Get the couple details
    SELECT * INTO couple_record FROM public.couples WHERE id = couple_id_param;

    -- Check if users are already in another relationship
    IF EXISTS (
        SELECT 1 FROM public.couples 
        WHERE (user1_id = couple_record.user1_id OR user2_id = couple_record.user1_id OR user1_id = couple_record.user2_id OR user2_id = couple_record.user2_id) 
        AND status = 'accepted' AND id != couple_id_param
    ) THEN
        RAISE EXCEPTION 'One of the users is already in a relationship';
    END IF;

    -- Update the status to 'accepted'
    UPDATE public.couples SET status = 'accepted' WHERE id = couple_id_param;

    -- Delete other pending requests for these users
    DELETE FROM public.couples 
    WHERE status = 'requesting' AND (user1_id = couple_record.user1_id OR user2_id = couple_record.user1_id OR user1_id = couple_record.user2_id OR user2_id = couple_record.user2_id)
    AND id != couple_id_param;
END;
$$ LANGUAGE plpgsql;

-- Alter profiles table to add is_in_relationship
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_in_relationship BOOLEAN NOT NULL DEFAULT FALSE;
