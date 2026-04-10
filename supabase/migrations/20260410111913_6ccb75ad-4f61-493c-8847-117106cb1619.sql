
-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to confirm match and award points when all 4 players confirmed
CREATE OR REPLACE FUNCTION public.confirm_match(match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _match matches%ROWTYPE;
  _confirmed uuid[];
  _user_id uuid;
  _points int;
  _bonus int;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO _match FROM matches WHERE id = match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  -- Check user is participant
  IF _user_id NOT IN (_match.player1_id, _match.player2_id, _match.player3_id, _match.player4_id) THEN
    RETURN jsonb_build_object('error', 'Not a participant');
  END IF;

  _confirmed := COALESCE(_match.confirmed_by, '{}');

  -- Already confirmed?
  IF _user_id = ANY(_confirmed) THEN
    RETURN jsonb_build_object('status', 'already_confirmed', 'confirmed_count', array_length(_confirmed, 1));
  END IF;

  -- Add confirmation
  _confirmed := array_append(_confirmed, _user_id);
  UPDATE matches SET confirmed_by = _confirmed WHERE id = match_id;

  -- If all 4 confirmed, award points
  IF array_length(_confirmed, 1) = 4 THEN
    _points := _match.points_awarded;
    _bonus := _match.bonus_points;

    IF _match.winner_team = 1 THEN
      UPDATE profiles SET total_points = total_points + _points + _bonus WHERE user_id IN (_match.player1_id, _match.player2_id);
    ELSE
      UPDATE profiles SET total_points = total_points + _points + _bonus WHERE user_id IN (_match.player3_id, _match.player4_id);
    END IF;

    RETURN jsonb_build_object('status', 'confirmed_and_points_awarded', 'confirmed_count', 4, 'points', _points + _bonus);
  END IF;

  RETURN jsonb_build_object('status', 'confirmed', 'confirmed_count', array_length(_confirmed, 1));
END;
$$;
