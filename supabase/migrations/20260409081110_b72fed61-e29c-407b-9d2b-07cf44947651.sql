
-- Create divisions table
CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view divisions" ON public.divisions
  FOR SELECT TO authenticated USING (true);

-- Seed divisions
INSERT INTO public.divisions (name, level) VALUES
  ('Bronze', 1),
  ('Prata', 2),
  ('Ouro', 3),
  ('Platina', 4),
  ('Diamante', 5);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('Masculino', 'Feminino', 'Outro')),
  preferred_hand TEXT CHECK (preferred_hand IN ('Direita', 'Esquerda')),
  preferred_side TEXT CHECK (preferred_side IN ('Esquerda', 'Direita')),
  division_id UUID REFERENCES public.divisions(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES public.profiles(user_id),
  player2_id UUID NOT NULL REFERENCES public.profiles(user_id),
  player3_id UUID NOT NULL REFERENCES public.profiles(user_id),
  player4_id UUID NOT NULL REFERENCES public.profiles(user_id),
  team1_score INTEGER NOT NULL CHECK (team1_score >= 0),
  team2_score INTEGER NOT NULL CHECK (team2_score >= 0),
  winner_team INTEGER NOT NULL CHECK (winner_team IN (1, 2)),
  points_awarded INTEGER NOT NULL DEFAULT 3,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  is_rematch BOOLEAN NOT NULL DEFAULT false,
  rematch_id UUID,
  confirmed_by UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON public.matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create matches" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Participants can update matches" ON public.matches
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (player1_id, player2_id, player3_id, player4_id)
  );

-- Create rematches table
CREATE TABLE public.rematches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_match_id UUID NOT NULL REFERENCES public.matches(id),
  requester_id UUID NOT NULL REFERENCES public.profiles(user_id),
  partner_id UUID NOT NULL REFERENCES public.profiles(user_id),
  opponent1_id UUID NOT NULL REFERENCES public.profiles(user_id),
  opponent2_id UUID NOT NULL REFERENCES public.profiles(user_id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  rematch_count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rematches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rematches" ON public.rematches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create rematches" ON public.rematches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Participants can update rematches" ON public.rematches
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (requester_id, partner_id, opponent1_id, opponent2_id)
  );

-- Add foreign key from matches to rematches
ALTER TABLE public.matches
  ADD CONSTRAINT fk_matches_rematch FOREIGN KEY (rematch_id) REFERENCES public.rematches(id);

-- Create rankings table
CREATE TABLE public.rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  division_id UUID NOT NULL REFERENCES public.divisions(id),
  points INTEGER NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rankings" ON public.rankings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert rankings" ON public.rankings
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rematches_updated_at
  BEFORE UPDATE ON public.rematches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, division_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    (SELECT id FROM public.divisions WHERE level = 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
