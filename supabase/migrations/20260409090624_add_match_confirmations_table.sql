
/*
  # Add match_confirmations table

  1. New Tables
    - `match_confirmations`
      - `id` (uuid, primary key)
      - `match_id` (uuid, foreign key to matches)
      - `player_id` (uuid, foreign key to profiles.user_id)
      - `confirmed` (boolean, whether the player confirmed the match result)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `match_confirmations` table
    - Players can view confirmations for their own matches
    - Players can insert their own confirmation
    - Players can update their own confirmation

  3. Notes
    - This table tracks per-player confirmation of match results
    - A match is fully confirmed when all 4 players have confirmed=true
*/

CREATE TABLE IF NOT EXISTS public.match_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.match_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view match confirmations"
  ON public.match_confirmations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can insert own confirmation"
  ON public.match_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own confirmation"
  ON public.match_confirmations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);
