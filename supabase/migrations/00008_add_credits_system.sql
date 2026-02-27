-- Add credits wallet to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Credits transaction log for auditability
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('xp_convert', 'buddy_match', 'buddy_chat_unlock')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atomic XP to credits conversion
CREATE OR REPLACE FUNCTION convert_xp_to_credits(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_credit_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_credits INTEGER;
BEGIN
  SELECT xp INTO v_current_xp FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current_xp < p_xp_amount THEN
    RAISE EXCEPTION 'Insufficient XP';
  END IF;

  UPDATE profiles
  SET xp = xp - p_xp_amount,
      credits = credits + p_credit_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  INSERT INTO credit_transactions (user_id, amount, reason, metadata)
  VALUES (p_user_id, p_credit_amount, 'xp_convert',
    jsonb_build_object('xp_spent', p_xp_amount));

  RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Spend credits for buddy match
CREATE OR REPLACE FUNCTION spend_credits_buddy_match(
  p_user_id UUID,
  p_cost INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  SELECT credits INTO v_current_credits FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current_credits < p_cost THEN
    RETURN FALSE;
  END IF;

  UPDATE profiles SET credits = credits - p_cost, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, reason)
  VALUES (p_user_id, -p_cost, 'buddy_match');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
