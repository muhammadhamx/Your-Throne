-- ============================================
-- Throne Leagues: leagues + league_members
-- ============================================

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 30),
  emoji TEXT NOT NULL DEFAULT '🏆',
  description TEXT CHECK (char_length(description) <= 200),
  join_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leagues_join_code ON leagues(join_code);
CREATE INDEX idx_leagues_created_by ON leagues(created_by);

-- League members table (must be created before policies that reference it)
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

CREATE INDEX idx_league_members_league ON league_members(league_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);

-- ============================================
-- RLS: Leagues
-- ============================================
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Anyone can view a league they're a member of
CREATE POLICY "Members can view their leagues"
  ON leagues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = leagues.id
      AND league_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create leagues
CREATE POLICY "Authenticated users can create leagues"
  ON leagues FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can delete a league
CREATE POLICY "Creator can delete league"
  ON leagues FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- RLS: League members
-- ============================================
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their leagues
CREATE POLICY "Members can view league members"
  ON league_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM league_members AS my
      WHERE my.league_id = league_members.league_id
      AND my.user_id = auth.uid()
    )
  );

-- Users can join leagues (insert themselves)
CREATE POLICY "Users can join leagues"
  ON league_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave leagues (delete their own row)
CREATE POLICY "Users can leave leagues"
  ON league_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RPC: Join league by code (atomic)
-- ============================================
CREATE OR REPLACE FUNCTION join_league_by_code(p_user_id UUID, p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_league_id UUID;
BEGIN
  SELECT id INTO v_league_id FROM leagues WHERE join_code = UPPER(TRIM(p_code));

  IF v_league_id IS NULL THEN
    RAISE EXCEPTION 'League not found';
  END IF;

  INSERT INTO league_members (league_id, user_id)
  VALUES (v_league_id, p_user_id)
  ON CONFLICT (league_id, user_id) DO NOTHING;

  RETURN v_league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: Get league leaderboard with weekly XP
-- Calculates XP from sessions this week (Monday 00:00 UTC to now)
-- ============================================
CREATE OR REPLACE FUNCTION get_league_leaderboard(p_league_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_emoji TEXT,
  total_xp INTEGER,
  weekly_xp BIGINT
) AS $$
DECLARE
  v_week_start TIMESTAMPTZ;
BEGIN
  v_week_start := date_trunc('week', NOW());

  RETURN QUERY
  SELECT
    lm.user_id,
    p.display_name,
    p.avatar_emoji,
    p.xp AS total_xp,
    COALESCE(SUM(
      CASE WHEN s.ended_at IS NOT NULL AND s.started_at >= v_week_start
      THEN
        CASE WHEN s.is_quick_log THEN 10 ELSE 25 END
        + CASE WHEN s.rating IS NOT NULL THEN 5 ELSE 0 END
      ELSE 0
      END
    ), 0)::BIGINT AS weekly_xp
  FROM league_members lm
  JOIN profiles p ON p.id = lm.user_id
  LEFT JOIN sessions s ON s.user_id = lm.user_id
    AND s.started_at >= v_week_start
    AND s.ended_at IS NOT NULL
  WHERE lm.league_id = p_league_id
  GROUP BY lm.user_id, p.display_name, p.avatar_emoji, p.xp
  ORDER BY weekly_xp DESC, p.xp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Broaden profiles SELECT policy so league co-members can see each other
-- ============================================
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR is_in_session = TRUE
    OR EXISTS (
      SELECT 1 FROM league_members lm1
      JOIN league_members lm2 ON lm1.league_id = lm2.league_id
      WHERE lm1.user_id = auth.uid()
      AND lm2.user_id = profiles.id
    )
  );
