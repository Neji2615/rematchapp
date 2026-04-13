
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id, created_at DESC);

-- Update process_weekly_promotions to insert notifications
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
  _next_div record;
  _prev_div record;
  _current_div_name text;
  _week_start date;
  _promoted int := 0;
  _demoted int := 0;
  _pos int;
  _r record;
BEGIN
  _week_start := (date_trunc('week', now()) - interval '7 days')::date;

  FOR _div IN SELECT id, name, level FROM divisions ORDER BY level LOOP
    _pos := 0;
    _top_player := NULL;
    _bottom_player := NULL;

    FOR _r IN 
      SELECT r.id, r.user_id FROM rankings r
      WHERE r.division_id = _div.id AND r.week_start = _week_start 
      ORDER BY r.points DESC
    LOOP
      _pos := _pos + 1;
      UPDATE rankings SET position = _pos WHERE id = _r.id;

      IF _pos = 1 THEN _top_player := _r.user_id; END IF;
      _bottom_player := _r.user_id;
    END LOOP;

    -- Promote top player
    IF _top_player IS NOT NULL THEN
      SELECT id, name INTO _next_div FROM divisions WHERE level = _div.level + 1;
      IF _next_div.id IS NOT NULL THEN
        UPDATE profiles SET division_id = _next_div.id WHERE user_id = _top_player;
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (_top_player, '🎉 Promoção!', 'Parabéns! Subiste para a divisão ' || _next_div.name || '!', 'promotion');
        _promoted := _promoted + 1;
      END IF;
    END IF;

    -- Demote bottom player (only if more than 1 player)
    IF _pos > 1 AND _bottom_player IS NOT NULL AND _bottom_player != _top_player THEN
      SELECT id, name INTO _prev_div FROM divisions WHERE level = _div.level - 1;
      IF _prev_div.id IS NOT NULL THEN
        UPDATE profiles SET division_id = _prev_div.id WHERE user_id = _bottom_player;
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (_bottom_player, '📉 Despromoção', 'Desceste para a divisão ' || _prev_div.name || '. Não desistas!', 'demotion');
        _demoted := _demoted + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('promoted', _promoted, 'demoted', _demoted, 'week_processed', _week_start);
END;
$$;
