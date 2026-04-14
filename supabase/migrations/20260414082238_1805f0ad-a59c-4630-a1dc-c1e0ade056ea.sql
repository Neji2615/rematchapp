-- Add per-set score columns
ALTER TABLE public.matches
  ADD COLUMN set1_team1 integer NOT NULL DEFAULT 0,
  ADD COLUMN set1_team2 integer NOT NULL DEFAULT 0,
  ADD COLUMN set2_team1 integer NOT NULL DEFAULT 0,
  ADD COLUMN set2_team2 integer NOT NULL DEFAULT 0,
  ADD COLUMN set3_team1 integer DEFAULT NULL,
  ADD COLUMN set3_team2 integer DEFAULT NULL;