-- Chat rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_participants INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rooms"
  ON chat_rooms FOR SELECT
  USING (is_active = TRUE);

-- Chat room participants
CREATE TABLE chat_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_participants_room ON chat_room_participants(room_id)
  WHERE left_at IS NULL;

ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view room participants"
  ON chat_room_participants FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can join rooms"
  ON chat_room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON chat_room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Buddy matches
CREATE TABLE buddy_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_matches_active ON buddy_matches(status)
  WHERE status = 'active';

ALTER TABLE buddy_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON buddy_matches FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can end own matches"
  ON buddy_matches FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Messages (unified for group + buddy)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  match_id UUID REFERENCES buddy_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT message_parent_check CHECK (
    (room_id IS NOT NULL AND match_id IS NULL) OR
    (room_id IS NULL AND match_id IS NOT NULL)
  )
);

CREATE INDEX idx_messages_room ON messages(room_id, created_at DESC)
  WHERE room_id IS NOT NULL;
CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC)
  WHERE match_id IS NOT NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms/matches"
  ON messages FOR SELECT
  USING (
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM chat_room_participants
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    ))
    OR
    (match_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM buddy_matches
      WHERE id = messages.match_id
      AND (user_a = auth.uid() OR user_b = auth.uid())
    ))
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      (room_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM chat_room_participants
        WHERE room_id = messages.room_id
        AND user_id = auth.uid()
      ))
      OR
      (match_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM buddy_matches
        WHERE id = messages.match_id
        AND (user_a = auth.uid() OR user_b = auth.uid())
        AND status = 'active'
      ))
    )
  );

-- Race-safe buddy match creation function
CREATE OR REPLACE FUNCTION create_buddy_match(p_user_a UUID, p_user_b UUID)
RETURNS buddy_matches AS $$
DECLARE
  v_match buddy_matches;
BEGIN
  -- Check neither user is already in an active match
  IF EXISTS (
    SELECT 1 FROM buddy_matches
    WHERE status = 'active'
    AND (user_a IN (p_user_a, p_user_b) OR user_b IN (p_user_a, p_user_b))
  ) THEN
    RETURN NULL;
  END IF;

  -- Check both users are still looking
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_a AND looking_for_buddy = TRUE AND is_in_session = TRUE
  ) OR NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_b AND looking_for_buddy = TRUE AND is_in_session = TRUE
  ) THEN
    RETURN NULL;
  END IF;

  -- Create match
  INSERT INTO buddy_matches (user_a, user_b)
  VALUES (p_user_a, p_user_b)
  RETURNING * INTO v_match;

  -- Clear looking_for_buddy
  UPDATE profiles SET looking_for_buddy = FALSE
  WHERE id IN (p_user_a, p_user_b);

  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
