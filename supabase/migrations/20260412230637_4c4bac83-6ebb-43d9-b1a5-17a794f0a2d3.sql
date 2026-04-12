
-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Allow rankings to be updated (needed for upsert)
CREATE POLICY "System can update rankings"
ON public.rankings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Update confirm_match to also upsert rankings
CREATE OR REPLACE FUNCTION public.confirm_match(match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _match matches%ROWTYPE;
  _confirmed uuid[];
  _user_id uuid;
  _points int;
  _bonus int;
  _week_start date;
  _week_end date;
  _winner1 uuid;
  _winner2 uuid;
  _div_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO _match FROM matches WHERE id = match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF _user_id NOT IN (_match.player1_id, _match.player2_id, _match.player3_id, _match.player4_id) THEN
    RETURN jsonb_build_object('error', 'Not a participant');
  END IF;

  _confirmed := COALESCE(_match.confirmed_by, '{}');

  IF _user_id = ANY(_confirmed) THEN
    RETURN jsonb_build_object('status', 'already_confirmed', 'confirmed_count', array_length(_confirmed, 1));
  END IF;

  _confirmed := array_append(_confirmed, _user_id);
  UPDATE matches SET confirmed_by = _confirmed WHERE id = match_id;

  -- If all 4 confirmed, award points and update rankings
  IF array_length(_confirmed, 1) = 4 THEN
    _points := _match.points_awarded;
    _bonus := _match.bonus_points;

    -- Determine winners
    IF _match.winner_team = 1 THEN
      _winner1 := _match.player1_id;
      _winner2 := _match.player2_id;
    ELSE
      _winner1 := _match.player3_id;
      _winner2 := _match.player4_id;
    END IF;

    -- Award points to profiles
    UPDATE profiles SET total_points = total_points + _points + _bonus WHERE user_id IN (_winner1, _winner2);

    -- Calculate current week boundaries (Monday to Sunday)
    _week_start := date_trunc('week', now())::date;
    _week_end := _week_start + 6;

    -- Upsert rankings for each winner
    FOR _div_id IN SELECT division_id FROM profiles WHERE user_id IN (_winner1, _winner2) AND division_id IS NOT NULL
    LOOP
      -- handled per player below
    END LOOP;

    -- Upsert ranking for winner 1
    PERFORM upsert_weekly_ranking(_winner1, _week_start, _week_end, _points + _bonus);
    -- Upsert ranking for winner 2
    PERFORM upsert_weekly_ranking(_winner2, _week_start, _week_end, _points + _bonus);

    RETURN jsonb_build_object('status', 'confirmed_and_points_awarded', 'confirmed_count', 4, 'points', _points + _bonus);
  END IF;

  RETURN jsonb_build_object('status', 'confirmed', 'confirmed_count', array_length(_confirmed, 1));
END;
$$;

-- Helper function to upsert weekly ranking
CREATE OR REPLACE FUNCTION public.upsert_weekly_ranking(
  _player_id uuid,
  _week_start date,
  _week_end date,
  _points_to_add int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _div_id uuid;
BEGIN
  SELECT division_id INTO _div_id FROM profiles WHERE user_id = _player_id;
  IF _div_id IS NULL THEN RETURN; END IF;

  INSERT INTO rankings (user_id, division_id, week_start, week_end, points)
  VALUES (_player_id, _div_id, _week_start, _week_end, _points_to_add)
  ON CONFLICT (user_id, week_start) 
  DO UPDATE SET points = rankings.points + _points_to_add;
END;
$$;

-- Add unique constraint for upsert to work
ALTER TABLE public.rankings ADD CONSTRAINT rankings_user_week_unique UNIQUE (user_id, week_start);

-- Function to process weekly promotions and demotions
CREATE OR REPLACE FUNCTION public.process_weekly_promotions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _div record;
  _top_player uuid;
  _bottom_player uuid;
  _next_div_id uuid;
  _prev_div_id uuid;
  _week_start date;
  _promoted int := 0;
  _demoted int := 0;
  _pos int;
  _r record;
BEGIN
  -- Last week's Monday
  _week_start := (date_trunc('week', now()) - interval '7 days')::date;

  -- Process each division
  FOR _div IN SELECT id, level FROM divisions ORDER BY level LOOP
    -- Calculate and assign positions for this division
    _pos := 0;
    FOR _r IN 
      SELECT id, user_id FROM rankings 
      WHERE division_id = _div.id AND week_start = _week_start 
      ORDER BY points DESC
    LOOP
      _pos := _pos + 1;
      UPDATE rankings SET position = _pos WHERE id = _r.id;
      
      -- Top player (promote if not in highest division)
      IF _pos = 1 THEN
        SELECT id INTO _next_div_id FROM divisions WHERE level = _div.level + 1;
        IF _next_div_id IS NOT NULL THEN
          UPDATE profiles SET division_id = _next_div_id WHERE user_id = _r.user_id;
          _promoted := _promoted + 1;
        END IF;
      END IF;
    END LOOP;

    -- Bottom player (demote if not in lowest division and more than 1 player)
    IF _pos > 1 THEN
      SELECT user_id INTO _bottom_player FROM rankings 
        WHERE division_id = _div.id AND week_start = _week_start 
        ORDER BY points ASC LIMIT 1;
      
      SELECT id INTO _prev_div_id FROM divisions WHERE level = _div.level - 1;
      IF _prev_div_id IS NOT NULL AND _bottom_player IS NOT NULL THEN
        UPDATE profiles SET division_id = _prev_div_id WHERE user_id = _bottom_player;
        _demoted := _demoted + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('promoted', _promoted, 'demoted', _demoted, 'week_processed', _week_start);
END;
$$;
