-- Server-side stats aggregation for "All Time"
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
SELECT json_build_object(
  'total_sessions', COUNT(*),
  'total_duration', COALESCE(SUM(duration_seconds), 0),
  'avg_duration', COALESCE(AVG(duration_seconds), 0)::INTEGER,
  'longest_session', COALESCE(MAX(duration_seconds), 0),
  'first_session', MIN(started_at),
  'hourly_distribution', (
    SELECT json_agg(json_build_object('hour', h, 'count', c))
    FROM (
      SELECT EXTRACT(HOUR FROM started_at)::INTEGER as h, COUNT(*) as c
      FROM sessions WHERE user_id = p_user_id AND ended_at IS NOT NULL
      GROUP BY h ORDER BY h
    ) sub
  )
) FROM sessions
WHERE user_id = p_user_id AND ended_at IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Keep-alive table to prevent Supabase free tier auto-pause
CREATE TABLE keep_alive (
  id INTEGER PRIMARY KEY DEFAULT 1,
  pinged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO keep_alive (id, pinged_at) VALUES (1, NOW());

-- Message cleanup function (run via pg_cron)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM buddy_matches WHERE status = 'ended' AND ended_at < NOW() - INTERVAL '7 days';
  DELETE FROM chat_room_participants WHERE left_at IS NOT NULL AND left_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
