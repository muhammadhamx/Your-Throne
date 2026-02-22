-- Allow users to delete their own profile (for account deletion)
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
