
-- Create Couples Table
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    first_loving_day DATE,
    status TEXT CHECK (status IN ('requesting', 'accepted', 'broken_up', 'declined')) NOT NULL DEFAULT 'requesting',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user1_id, user2_id)
);
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Create XO Games Table
CREATE TABLE IF NOT EXISTS public.xo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    player1_score INT NOT NULL DEFAULT 0,
    player2_score INT NOT NULL DEFAULT 0,
    current_turn UUID REFERENCES public.profiles(id) NOT NULL,
    board_state TEXT[] CHECK (array_length(board_state, 1) = 9),
    winner TEXT,
    status TEXT CHECK (status IN ('requesting', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'requesting',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    match_winner_id UUID REFERENCES public.profiles(id)
);
ALTER TABLE public.xo_games ENABLE ROW LEVEL SECURITY;

-- Add is_in_relationship column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_in_relationship'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_in_relationship BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- Create Checker Games Table
CREATE TABLE IF NOT EXISTS public.checker_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    board_state JSONB NOT NULL,
    current_turn UUID REFERENCES public.profiles(id) NOT NULL,
    winner UUID REFERENCES public.profiles(id),
    status TEXT CHECK (status IN ('requesting', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'requesting',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.checker_games ENABLE ROW LEVEL SECURITY;

-- Policies for Couples Table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.couples;
CREATE POLICY "Enable read access for all users" ON public.couples FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own couple requests" ON public.couples;
CREATE POLICY "Users can insert their own couple requests" ON public.couples FOR INSERT WITH CHECK (auth.uid() = user1_id);

DROP POLICY IF EXISTS "Users can update their own couple status" ON public.couples;
CREATE POLICY "Users can update their own couple status" ON public.couples FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can delete their own couple entries" ON public.couples;
CREATE POLICY "Users can delete their own couple entries" ON public.couples FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Policies for XO Games Table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.xo_games;
CREATE POLICY "Enable read access for all users" ON public.xo_games FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can insert new games" ON public.xo_games;
CREATE POLICY "Players can insert new games" ON public.xo_games FOR INSERT WITH CHECK (auth.uid() = player1_id);

DROP POLICY IF EXISTS "Players can update their own game" ON public.xo_games;
CREATE POLICY "Players can update their own game" ON public.xo_games FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

DROP POLICY IF EXISTS "Players can delete their own game" ON public.xo_games;
CREATE POLICY "Players can delete their own game" ON public.xo_games FOR DELETE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Policies for Checker Games Table
CREATE POLICY "Enable read access for all users on checker_games" ON public.checker_games FOR SELECT USING (true);
CREATE POLICY "Players can insert new checker games" ON public.checker_games FOR INSERT WITH CHECK (auth.uid() = player1_id);
CREATE POLICY "Players can update their own checker game" ON public.checker_games FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Players can delete their own checker game" ON public.checker_games FOR DELETE USING (auth.uid() = player1_id OR auth.uid() = player2_id);


-- Function to update profile when a couple is accepted or broken up
CREATE OR REPLACE FUNCTION public.update_profile_relationship_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'requesting') THEN
        UPDATE public.profiles
        SET is_in_relationship = TRUE
        WHERE id = NEW.user1_id OR id = NEW.user2_id;
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'accepted') THEN
        UPDATE public.profiles
        SET is_in_relationship = FALSE
        WHERE id = OLD.user1_id OR id = OLD.user2_id;
    END IF;
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Trigger for couples table
DROP TRIGGER IF EXISTS on_couple_status_change ON public.couples;
CREATE TRIGGER on_couple_status_change
AFTER UPDATE OR DELETE ON public.couples
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_relationship_status();

-- Function to break up a couple
CREATE OR REPLACE FUNCTION public.break_up_couple(couple_id_param UUID)
RETURNS void AS $$
DECLARE
    v_user1_id UUID;
    v_user2_id UUID;
BEGIN
    -- Get user IDs before deleting
    SELECT user1_id, user2_id INTO v_user1_id, v_user2_id
    FROM public.couples WHERE id = couple_id_param;

    -- Update profiles first
    UPDATE public.profiles
    SET is_in_relationship = FALSE
    WHERE id = v_user1_id OR id = v_user2_id;

    -- Then delete the couple entry
    DELETE FROM public.couples WHERE id = couple_id_param;
END;
$$ LANGUAGE plpgsql;


-- Function to accept a couple request and ensure no other pending requests
CREATE OR REPLACE FUNCTION public.accept_couple_request(couple_id_param UUID)
RETURNS void AS $$
DECLARE
    v_user1_id UUID;
    v_user2_id UUID;
BEGIN
    -- Get user IDs from the accepted request
    SELECT user1_id, user2_id INTO v_user1_id, v_user2_id
    FROM public.couples WHERE id = couple_id_param;

    -- Update the status of the accepted couple
    UPDATE public.couples
    SET status = 'accepted'
    WHERE id = couple_id_param;

    -- Delete other pending requests for both users
    DELETE FROM public.couples
    WHERE status = 'requesting'
    AND (user1_id = v_user1_id OR user2_id = v_user1_id OR user1_id = v_user2_id OR user2_id = v_user2_id);

    -- Update profiles
    UPDATE public.profiles
    SET is_in_relationship = TRUE
    WHERE id = v_user1_id OR id = v_user2_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get couple details
CREATE OR REPLACE FUNCTION get_couple_details(user_id_param uuid)
RETURNS TABLE(
    id uuid,
    first_loving_day date,
    user1 json,
    user2 json
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.first_loving_day,
        json_build_object('id', u1.id, 'full_name', u1.full_name, 'avatar_url', u1.avatar_url),
        json_build_object('id', u2.id, 'full_name', u2.full_name, 'avatar_url', u2.avatar_url)
    FROM
        public.couples c
    JOIN
        public.profiles u1 ON c.user1_id = u1.id
    JOIN
        public.profiles u2 ON c.user2_id = u2.id
    WHERE
        (c.user1_id = user_id_param OR c.user2_id = user_id_param)
        AND c.status = 'accepted'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
