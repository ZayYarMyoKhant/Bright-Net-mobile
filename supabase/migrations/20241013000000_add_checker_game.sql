
-- Create Checker Games Table
CREATE TABLE IF NOT EXISTS public.checker_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- player who initiates, plays 'red'
    player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- player who accepts, plays 'black'
    board_state JSONB NOT NULL,
    current_turn UUID REFERENCES public.profiles(id) NOT NULL,
    winner UUID REFERENCES public.profiles(id),
    status TEXT CHECK (status IN ('requesting', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled')) NOT NULL DEFAULT 'requesting',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.checker_games ENABLE ROW LEVEL SECURITY;

-- Policies for Checker Games Table
CREATE POLICY "Enable read access for all users on checker_games" ON public.checker_games FOR SELECT USING (true);
CREATE POLICY "Players can insert new checker games" ON public.checker_games FOR INSERT WITH CHECK (auth.uid() = player1_id);
CREATE POLICY "Players can update their own checker game" ON public.checker_games FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Players can delete their own checker game" ON public.checker_games FOR DELETE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Function to handle TIMESTAMP updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update 'updated_at' on table modifications
CREATE TRIGGER handle_checker_games_updated_at
BEFORE UPDATE ON public.checker_games
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

