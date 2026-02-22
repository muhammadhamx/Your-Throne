-- Profiles table: minimal user profile for chat display and session status
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous Pooper',
  avatar_emoji TEXT NOT NULL DEFAULT '💩',
  is_in_session BOOLEAN NOT NULL DEFAULT FALSE,
  session_started_at TIMESTAMPTZ,
  looking_for_buddy BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile and other active session users
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_in_session = TRUE);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_emoji)
  VALUES (
    NEW.id,
    'Anonymous Pooper',
    (ARRAY['💩','🚽','📰','🧻','👑','🦆','🐻','🌟'])[floor(random() * 8 + 1)]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
