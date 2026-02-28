-- ============================================
-- Fix RLS infinite recursion (error 42P17)
-- league_members SELECT policy queries itself,
-- leagues SELECT queries league_members (triggers above),
-- profiles SELECT joins league_members to itself.
-- Solution: SECURITY DEFINER helpers that bypass RLS.
-- ============================================

-- Helper: check if current user is a member of a league (bypasses RLS)
CREATE OR REPLACE FUNCTION is_league_member(p_league_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = p_league_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user shares any league with another user
CREATE OR REPLACE FUNCTION shares_league_with(p_other_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM league_members lm1
    JOIN league_members lm2 ON lm1.league_id = lm2.league_id
    WHERE lm1.user_id = auth.uid() AND lm2.user_id = p_other_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop broken policies, recreate using helpers
DROP POLICY IF EXISTS "Members can view league members" ON league_members;
DROP POLICY IF EXISTS "Members can view their leagues" ON leagues;
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

CREATE POLICY "Members can view league members"
  ON league_members FOR SELECT USING (is_league_member(league_id));

CREATE POLICY "Members can view their leagues"
  ON leagues FOR SELECT USING (is_league_member(id));

CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT USING (
    auth.uid() = id OR is_in_session = TRUE OR shares_league_with(id)
  );
