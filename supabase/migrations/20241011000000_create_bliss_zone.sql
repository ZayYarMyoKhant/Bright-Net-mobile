
-- Couples Table for Anniversary Feature
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    first_loving_day DATE,
    status TEXT NOT NULL DEFAULT 'requesting', -- 'requesting', 'accepted', 'broken_up'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user1_id, user2_id)
);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_in_relationship BOOLEAN DEFAULT FALSE;

-- XO Games Table
CREATE TABLE IF NOT EXISTS xo_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player1_score INT NOT NULL DEFAULT 0,
    player2_score INT NOT NULL DEFAULT 0,
    current_turn UUID NOT NULL, -- user id of the current player
    board_state JSONB NOT NULL DEFAULT '[null, null, null, null, null, null, null, null, null]',
    winner TEXT, -- 'X', 'O', or 'draw' for the current round
    status TEXT NOT NULL DEFAULT 'requesting', -- 'requesting', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled'
    match_winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Winner of the best-of-3 match
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to handle breaking up a couple and updating profiles
CREATE OR REPLACE FUNCTION break_up_couple(couple_id_param UUID)
RETURNS void AS $$
DECLARE
    u1_id UUID;
    u2_id UUID;
BEGIN
    -- Get user IDs from the couple
    SELECT user1_id, user2_id INTO u1_id, u2_id
    FROM couples
    WHERE id = couple_id_param;

    -- Delete the couple relationship
    DELETE FROM couples WHERE id = couple_id_param;

    -- Update profiles
    UPDATE profiles
    SET is_in_relationship = FALSE
    WHERE id = u1_id OR id = u2_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to accept a couple request and update profiles
CREATE OR REPLACE FUNCTION accept_couple_request(couple_id_param UUID)
RETURNS void AS $$
DECLARE
    u1_id UUID;
    u2_id UUID;
BEGIN
    -- Update couple status to accepted
    UPDATE couples
    SET status = 'accepted'
    WHERE id = couple_id_param
    RETURNING user1_id, user2_id INTO u1_id, u2_id;

    -- Update profiles
    UPDATE profiles
    SET is_in_relationship = TRUE
    WHERE id = u1_id OR id = u2_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
