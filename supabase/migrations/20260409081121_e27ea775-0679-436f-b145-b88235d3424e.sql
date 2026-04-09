
-- Fix matches insert policy: only allow if the user is one of the players
DROP POLICY "Authenticated users can create matches" ON public.matches;
CREATE POLICY "Participants can create matches" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IN (player1_id, player2_id, player3_id, player4_id)
  );

-- Fix rankings insert policy: restrict to own user
DROP POLICY "System can insert rankings" ON public.rankings;
CREATE POLICY "Users can insert own rankings" ON public.rankings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
