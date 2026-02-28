-- ============================================================
-- Migration 00012: Inter-League Competition, Champion's Wall,
--                  Credits Shop & Economy Rebalance
-- ============================================================

-- ─── 1. WEEKLY LEAGUE RESULTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_league_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  winning_league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  winning_league_name TEXT NOT NULL,
  winning_league_emoji TEXT NOT NULL DEFAULT '🏆',
  winning_league_total_xp BIGINT NOT NULL DEFAULT 0,
  league_rankings JSONB NOT NULL DEFAULT '[]'::jsonb,
  winning_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

ALTER TABLE weekly_league_results ENABLE ROW LEVEL SECURITY;

-- Everyone can see results (Champion's Wall is public)
CREATE POLICY "Anyone can view weekly results"
  ON weekly_league_results FOR SELECT
  USING (true);

-- ─── 2. CHAMPION NOTES ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS champion_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_result_id UUID NOT NULL REFERENCES weekly_league_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '👑',
  note TEXT NOT NULL CHECK (char_length(note) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(weekly_result_id, user_id)
);

ALTER TABLE champion_notes ENABLE ROW LEVEL SECURITY;

-- Everyone can read champion notes
CREATE POLICY "Anyone can view champion notes"
  ON champion_notes FOR SELECT
  USING (true);

-- Only winning league members can insert notes for the current week
CREATE POLICY "Winning league members can post notes"
  ON champion_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM weekly_league_results wr
      WHERE wr.id = weekly_result_id
        AND wr.week_end > now() - interval '7 days'
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(wr.winning_members) AS m
          WHERE (m->>'user_id')::uuid = auth.uid()
        )
    )
  );

-- ─── 3. SHOP ITEMS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('functional', 'title', 'border', 'fun')),
  price INTEGER NOT NULL CHECK (price > 0),
  emoji TEXT NOT NULL DEFAULT '🎁',
  is_repeatable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop items"
  ON shop_items FOR SELECT
  USING (true);

-- ─── 4. SHOP PURCHASES ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES shop_items(id),
  credits_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON shop_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON shop_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 5. ALTER PROFILES — add owned_shop_items ───────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owned_shop_items TEXT[] DEFAULT '{}';

-- ─── 6. RPC: get_global_league_leaderboard ──────────────────────────────────

CREATE OR REPLACE FUNCTION get_global_league_leaderboard()
RETURNS TABLE (
  league_id UUID,
  name TEXT,
  emoji TEXT,
  member_count BIGINT,
  total_weekly_xp BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    l.id AS league_id,
    l.name,
    l.emoji,
    COUNT(DISTINCT lm.user_id) AS member_count,
    COALESCE(SUM(
      CASE WHEN s.is_quick_log THEN 10 ELSE 25 END
      + CASE WHEN s.rating IS NOT NULL THEN 5 ELSE 0 END
    ), 0)::bigint AS total_weekly_xp
  FROM leagues l
  JOIN league_members lm ON lm.league_id = l.id
  LEFT JOIN sessions s
    ON s.user_id = lm.user_id
    AND s.started_at >= date_trunc('week', now())
    AND s.ended_at IS NOT NULL
  GROUP BY l.id, l.name, l.emoji
  ORDER BY total_weekly_xp DESC, member_count ASC, l.created_at ASC;
$$;

-- ─── 7. RPC: finalize_weekly_results ────────────────────────────────────────

CREATE OR REPLACE FUNCTION finalize_weekly_results(p_api_key TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_week_start TIMESTAMPTZ;
  v_week_end TIMESTAMPTZ;
  v_existing UUID;
  v_winner RECORD;
  v_rankings JSONB;
  v_members JSONB;
  v_result_id UUID;
BEGIN
  -- Calculate last week's boundaries (Monday 00:00 to Sunday 23:59:59)
  v_week_start := date_trunc('week', now() - interval '1 day');
  v_week_end := v_week_start + interval '7 days' - interval '1 second';

  -- Idempotent: skip if already finalized
  SELECT id INTO v_existing
  FROM weekly_league_results
  WHERE week_start = v_week_start;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_finalized', 'id', v_existing);
  END IF;

  -- Build league rankings for last week
  SELECT jsonb_agg(row_to_json(ranked)::jsonb ORDER BY ranked.total_weekly_xp DESC)
  INTO v_rankings
  FROM (
    SELECT
      l.id AS league_id,
      l.name,
      l.emoji,
      COUNT(DISTINCT lm.user_id)::int AS member_count,
      COALESCE(SUM(
        CASE WHEN s.is_quick_log THEN 10 ELSE 25 END
        + CASE WHEN s.rating IS NOT NULL THEN 5 ELSE 0 END
      ), 0)::bigint AS total_weekly_xp
    FROM leagues l
    JOIN league_members lm ON lm.league_id = l.id
    LEFT JOIN sessions s
      ON s.user_id = lm.user_id
      AND s.started_at >= v_week_start
      AND s.started_at <= v_week_end
      AND s.ended_at IS NOT NULL
    GROUP BY l.id, l.name, l.emoji
    ORDER BY total_weekly_xp DESC, member_count ASC, l.created_at ASC
  ) ranked;

  -- No leagues? Nothing to finalize
  IF v_rankings IS NULL OR jsonb_array_length(v_rankings) = 0 THEN
    RETURN jsonb_build_object('status', 'no_leagues');
  END IF;

  -- Winner is the first entry (highest XP, fewest members as tiebreaker, oldest league as final tiebreaker)
  SELECT
    (v_rankings->0->>'league_id')::uuid AS league_id,
    v_rankings->0->>'name' AS name,
    v_rankings->0->>'emoji' AS emoji,
    (v_rankings->0->>'total_weekly_xp')::bigint AS total_weekly_xp
  INTO v_winner;

  -- Snapshot winning league members with their individual weekly XP
  SELECT jsonb_agg(row_to_json(mem)::jsonb ORDER BY mem.weekly_xp DESC)
  INTO v_members
  FROM (
    SELECT
      p.id AS user_id,
      p.display_name,
      p.avatar_emoji,
      COALESCE(SUM(
        CASE WHEN s.is_quick_log THEN 10 ELSE 25 END
        + CASE WHEN s.rating IS NOT NULL THEN 5 ELSE 0 END
      ), 0)::bigint AS weekly_xp
    FROM league_members lm
    JOIN profiles p ON p.id = lm.user_id
    LEFT JOIN sessions s
      ON s.user_id = lm.user_id
      AND s.started_at >= v_week_start
      AND s.started_at <= v_week_end
      AND s.ended_at IS NOT NULL
    WHERE lm.league_id = v_winner.league_id
    GROUP BY p.id, p.display_name, p.avatar_emoji
  ) mem;

  -- Insert the result
  INSERT INTO weekly_league_results (
    week_start, week_end,
    winning_league_id, winning_league_name, winning_league_emoji, winning_league_total_xp,
    league_rankings, winning_members
  ) VALUES (
    v_week_start, v_week_end,
    v_winner.league_id, v_winner.name, v_winner.emoji, v_winner.total_weekly_xp,
    v_rankings, COALESCE(v_members, '[]'::jsonb)
  ) RETURNING id INTO v_result_id;

  RETURN jsonb_build_object(
    'status', 'finalized',
    'id', v_result_id,
    'winner', v_winner.name,
    'total_xp', v_winner.total_weekly_xp
  );
END;
$$;

-- ─── 8. RPC: submit_champion_note ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_champion_note(p_user_id UUID, p_note TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result RECORD;
  v_profile RECORD;
  v_note_id UUID;
BEGIN
  -- Validate note length
  IF char_length(p_note) > 200 THEN
    RAISE EXCEPTION 'Note too long (max 200 characters)';
  END IF;

  -- Find the latest weekly result where this user was in the winning league
  SELECT wr.id, wr.winning_league_id
  INTO v_result
  FROM weekly_league_results wr
  WHERE wr.week_end > now() - interval '7 days'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(wr.winning_members) AS m
      WHERE (m->>'user_id')::uuid = p_user_id
    )
  ORDER BY wr.week_end DESC
  LIMIT 1;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'You are not in the winning league for this week';
  END IF;

  -- Get user's current profile snapshot
  SELECT display_name, avatar_emoji INTO v_profile
  FROM profiles WHERE id = p_user_id;

  -- Upsert the note (one per user per week)
  INSERT INTO champion_notes (weekly_result_id, user_id, display_name, avatar_emoji, note)
  VALUES (v_result.id, p_user_id, v_profile.display_name, v_profile.avatar_emoji, p_note)
  ON CONFLICT (weekly_result_id, user_id)
  DO UPDATE SET note = p_note, display_name = v_profile.display_name, avatar_emoji = v_profile.avatar_emoji
  RETURNING id INTO v_note_id;

  RETURN jsonb_build_object('status', 'ok', 'note_id', v_note_id);
END;
$$;

-- ─── 9. RPC: get_latest_weekly_result ───────────────────────────────────────

CREATE OR REPLACE FUNCTION get_latest_weekly_result()
RETURNS SETOF weekly_league_results
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM weekly_league_results
  WHERE week_end > now() - interval '7 days'
  ORDER BY week_end DESC
  LIMIT 1;
$$;

-- ─── 10. RPC: purchase_shop_item ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION purchase_shop_item(p_user_id UUID, p_item_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_current_credits INTEGER;
  v_owned TEXT[];
BEGIN
  -- Get the item
  SELECT * INTO v_item FROM shop_items WHERE id = p_item_id AND is_active = true;
  IF v_item IS NULL THEN
    RAISE EXCEPTION 'Item not found or not available';
  END IF;

  -- Get user's credits and owned items
  SELECT credits, owned_shop_items INTO v_current_credits, v_owned
  FROM profiles WHERE id = p_user_id;

  -- Check if already owned (non-repeatable items)
  IF NOT v_item.is_repeatable AND p_item_id = ANY(v_owned) THEN
    RAISE EXCEPTION 'You already own this item';
  END IF;

  -- Check credits
  IF v_current_credits < v_item.price THEN
    RAISE EXCEPTION 'Not enough credits (need %, have %)', v_item.price, v_current_credits;
  END IF;

  -- Deduct credits
  UPDATE profiles
  SET credits = credits - v_item.price,
      owned_shop_items = CASE
        WHEN NOT v_item.is_repeatable THEN array_append(owned_shop_items, p_item_id)
        ELSE owned_shop_items
      END,
      updated_at = now()
  WHERE id = p_user_id;

  -- Record purchase
  INSERT INTO shop_purchases (user_id, item_id, credits_spent)
  VALUES (p_user_id, p_item_id, v_item.price);

  -- Record credit transaction
  INSERT INTO credit_transactions (user_id, amount, reason, metadata)
  VALUES (p_user_id, -v_item.price, 'shop_purchase',
    jsonb_build_object('item_id', p_item_id, 'item_name', v_item.name));

  RETURN jsonb_build_object(
    'status', 'ok',
    'item_id', p_item_id,
    'credits_remaining', v_current_credits - v_item.price
  );
END;
$$;

-- ─── 11. SEED SHOP ITEMS ───────────────────────────────────────────────────

INSERT INTO shop_items (id, name, description, category, price, emoji, is_repeatable, metadata) VALUES
  -- Functional (repeatable)
  ('streak_freeze', 'Streak Freeze', 'Protect your streak for 1 missed day', 'functional', 50, '🧊', true, '{"effect": "streak_freeze"}'::jsonb),
  ('xp_boost_2x', '2x XP Boost (24h)', 'Double all XP earned for 24 hours', 'functional', 150, '⚡', true, '{"effect": "xp_boost", "multiplier": 2, "duration_hours": 24}'::jsonb),
  ('buddy_no_session', 'Buddy Match (No Session)', 'Find a poop buddy without an active session', 'functional', 25, '🤝', true, '{"effect": "buddy_no_session"}'::jsonb),

  -- Cosmetic Titles (one-time)
  ('title_throne_lord', 'Throne Lord', 'The prestigious "Throne Lord" title', 'title', 100, '🏰', false, '{"title_id": "throne_lord", "title_name": "Throne Lord"}'::jsonb),
  ('title_golden_cheeks', 'Golden Cheeks', 'The legendary "Golden Cheeks" title', 'title', 100, '✨', false, '{"title_id": "golden_cheeks", "title_name": "Golden Cheeks"}'::jsonb),
  ('title_phantom_pooper', 'Phantom Pooper', 'The mysterious "Phantom Pooper" title', 'title', 200, '👻', false, '{"title_id": "phantom_pooper", "title_name": "Phantom Pooper"}'::jsonb),
  ('title_royal_flush_vip', 'Royal Flush VIP', 'The exclusive "Royal Flush VIP" title', 'title', 500, '💎', false, '{"title_id": "royal_flush_vip", "title_name": "Royal Flush VIP"}'::jsonb),

  -- Avatar Borders (one-time)
  ('border_golden', 'Golden Border', 'A luxurious gold ring around your avatar', 'border', 200, '🥇', false, '{"border_id": "golden", "border_color": "#F5A623"}'::jsonb),
  ('border_fire', 'Fire Border', 'A blazing flame ring around your avatar', 'border', 300, '🔥', false, '{"border_id": "fire", "border_color": "#FF6B35"}'::jsonb),
  ('border_diamond', 'Diamond Border', 'A dazzling diamond sparkle ring', 'border', 500, '💠', false, '{"border_id": "diamond", "border_color": "#60A5FA"}'::jsonb),

  -- Fun (repeatable)
  ('confetti_burst', 'Confetti Burst', 'Confetti explosion on your next session complete', 'fun', 15, '🎉', true, '{"effect": "confetti"}'::jsonb),
  ('league_rename', 'League Rename Token', 'Rename your league once', 'fun', 75, '✏️', true, '{"effect": "league_rename"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ─── 12. Update credit_transactions reason enum ─────────────────────────────
-- The reason column uses a CHECK constraint in migration 00008. We need to allow 'shop_purchase' and 'weekly_cap_reset'.
-- Drop old constraint and add expanded one:

DO $$
BEGIN
  -- Try to drop the old constraint if it exists
  ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_reason_check;
EXCEPTION WHEN undefined_object THEN
  -- Constraint doesn't exist, that's fine
END;
$$;

ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_reason_check
  CHECK (reason IN ('xp_convert', 'buddy_match', 'buddy_chat_unlock', 'shop_purchase'));
