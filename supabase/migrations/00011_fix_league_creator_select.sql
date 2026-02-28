-- ============================================
-- Fix: creator can't SELECT their league right after INSERT
-- because they haven't been added to league_members yet.
-- Add "OR auth.uid() = created_by" to the leagues SELECT policy.
-- ============================================

DROP POLICY IF EXISTS "Members can view their leagues" ON leagues;

CREATE POLICY "Members can view their leagues"
  ON leagues FOR SELECT USING (
    is_league_member(id) OR auth.uid() = created_by
  );
