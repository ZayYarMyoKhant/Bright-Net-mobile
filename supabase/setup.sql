
-- ### TABLES ###

-- 1. Couples Table
-- Stores information about user relationships.
CREATE TABLE IF NOT EXISTS public.couples (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    first_loving_day date NULL,
    status text NOT NULL DEFAULT 'requesting'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT couples_pkey PRIMARY KEY (id),
    CONSTRAINT couples_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT couples_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- 2. XO Games Table
-- Stores state for Tic-Tac-Toe games.
CREATE TABLE IF NOT EXISTS public.xo_games (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    player1_id uuid NOT NULL,
    player2_id uuid NOT NULL,
    player1_score smallint NOT NULL DEFAULT 0,
    player2_score smallint NOT NULL DEFAULT 0,
    current_turn uuid NOT NULL,
    board_state text[] NULL DEFAULT ARRAY[NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL],
    winner text NULL,
    status text NOT NULL DEFAULT 'requesting'::text,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    match_winner_id uuid NULL,
    CONSTRAINT xo_games_pkey PRIMARY KEY (id),
    CONSTRAINT xo_games_current_turn_fkey FOREIGN KEY (current_turn) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT xo_games_match_winner_id_fkey FOREIGN KEY (match_winner_id) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT xo_games_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT xo_games_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.xo_games ENABLE ROW LEVEL SECURITY;


-- ### REALTIME TRIGGERS ###

-- 1. Trigger for `couples` table updates
CREATE OR REPLACE FUNCTION public.handle_couple_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set is_in_relationship to TRUE for both users when a request is accepted
  IF NEW.status = 'accepted' AND OLD.status = 'requesting' THEN
    UPDATE public.profiles
    SET is_in_relationship = TRUE
    WHERE id = NEW.user1_id OR id = NEW.user2_id;
  END IF;
  
  -- Set is_in_relationship to FALSE for both users when a relationship is broken up
  IF NEW.status = 'broken_up' AND OLD.status = 'accepted' THEN
    UPDATE public.profiles
    SET is_in_relationship = FALSE
    WHERE id = OLD.user1_id OR id = OLD.user2_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_couple_update
AFTER UPDATE ON public.couples
FOR EACH ROW EXECUTE FUNCTION public.handle_couple_update();


-- 2. Trigger for `xo_games` table `updated_at`
CREATE OR REPLACE FUNCTION public.handle_xo_game_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_xo_game_update
BEFORE UPDATE ON public.xo_games
FOR EACH ROW EXECUTE FUNCTION public.handle_xo_game_update();


-- ### DATABASE FUNCTIONS (RPC) ###

-- 1. Get Couple Details
CREATE OR REPLACE FUNCTION public.get_couple_details(user_id_param uuid)
RETURNS TABLE(id uuid, first_loving_day date, user1 json, user2 json)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_loving_day,
    json_build_object('id', u1.id, 'full_name', u1.full_name, 'avatar_url', u1.avatar_url) as user1,
    json_build_object('id', u2.id, 'full_name', u2.full_name, 'avatar_url', u2.avatar_url) as user2
  FROM couples c
  JOIN profiles u1 ON c.user1_id = u1.id
  JOIN profiles u2 ON c.user2_id = u2.id
  WHERE c.status = 'accepted' AND (c.user1_id = user_id_param OR c.user2_id = user_id_param);
END;
$$;


-- 2. Accept Couple Request
CREATE OR REPLACE FUNCTION public.accept_couple_request(couple_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  couple_record public.couples;
BEGIN
  -- Check if the current user is user2 of the request
  SELECT * INTO couple_record FROM public.couples WHERE id = couple_id_param AND user2_id = auth.uid();

  IF couple_record IS NULL THEN
    RAISE EXCEPTION 'Couple request not found or you are not authorized to accept it.';
  END IF;
  
  -- Update status to accepted
  UPDATE public.couples
  SET status = 'accepted'
  WHERE id = couple_id_param;
END;
$$;


-- 3. Break up Couple
CREATE OR REPLACE FUNCTION public.break_up_couple(couple_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark the relationship as broken_up, which will trigger handle_couple_update
  UPDATE public.couples
  SET status = 'broken_up'
  WHERE id = couple_id_param AND (user1_id = auth.uid() OR user2_id = auth.uid());

  -- You might want to delete the record after a certain period or archive it.
  -- For now, we just update the status.
END;
$$;


-- ### ROW LEVEL SECURITY (RLS) ###

-- 1. RLS for `couples`
DROP POLICY IF EXISTS "Users can view and manage their own relationships" ON public.couples;
CREATE POLICY "Users can view and manage their own relationships"
ON public.couples
FOR ALL
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 2. RLS for `xo_games`
DROP POLICY IF EXISTS "Players can view and manage their own games" ON public.xo_games;
CREATE POLICY "Players can view and manage their own games"
ON public.xo_games
FOR ALL
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Ensure profiles table policies allow reads
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ensure followers table policies allow reads for authenticated users
DROP POLICY IF EXISTS "Allow authenticated user to read all" ON public.followers;
CREATE POLICY "Allow authenticated user to read all"
ON public.followers FOR SELECT
USING (auth.role() = 'authenticated');

-- Grant usage on schema and select on tables for anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.couples TO anon, authenticated;
GRANT SELECT ON TABLE public.xo_games TO anon, authenticated;
GRANT ALL ON TABLE public.couples TO authenticated;
GRANT ALL ON TABLE public.xo_games TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_couple_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_couple_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.break_up_couple(uuid) TO authenticated;

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.xo_games;

