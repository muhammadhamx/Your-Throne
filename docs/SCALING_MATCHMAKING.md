# Scaling Buddy Matchmaking

## Current Implementation (v1 — handles ~200 concurrent searchers)

**How it works:**
- All searching users join a single Supabase Realtime **Presence channel** (`buddy-matchmaking`)
- When user B joins, user A (already present) gets a `join` event
- User A calls `create_buddy_match(A, B)` — a PostgreSQL function with race-safe checks
- User A broadcasts `buddy-matched` event → both users navigate to buddy chat
- The `create_buddy_match` RPC is atomic: checks neither user is already matched, both are still searching and in-session

**Why it works for now:**
- Simple, no extra infrastructure
- Supabase Realtime handles the signaling
- Race conditions handled by the PostgreSQL function
- Free tier supports ~200 concurrent Realtime connections

**Where it breaks:**
- Presence broadcasts state to ALL channel members on every join/leave → O(n²) messages
- At 1000 users: every join triggers 999 sync events
- Multiple users race to match the same newcomer → unnecessary RPC calls
- Supabase Free Tier Realtime connection limit (~200)

---

## Tier 1: Sharded Presence Channels (~5K concurrent users)

**Minimal code change, no infra change.**

### Changes:
1. Instead of one `buddy-matchmaking` channel, create ~50 shards: `buddy-match:0` through `buddy-match:49`
2. Assign users randomly: `const shard = Math.floor(Math.random() * 50)`
3. If no match found in 5 seconds, leave current shard and join another (round-robin)
4. Each shard has ~20 users max → manageable Presence traffic

### Code sketch:
```typescript
startSearching: async (userId) => {
  let shard = Math.floor(Math.random() * SHARD_COUNT);
  const tryNextShard = () => {
    removeChannel(`buddy-match:${shard}`);
    shard = (shard + 1) % SHARD_COUNT;
    joinMatchmakingShard(userId, shard);
  };

  joinMatchmakingShard(userId, shard);
  // Rotate every 5 seconds if no match
  const rotateInterval = setInterval(tryNextShard, 5000);
  // Store cleanup ref...
};
```

### Pros:
- No backend changes needed
- Still uses Supabase free tier
- Reduces blast radius from O(n²) to O(n²/shards²)

### Cons:
- Two users in different shards won't find each other immediately (5s delay)
- Still client-side matching (each client does the RPC call)

---

## Tier 2: Server-Side Queue (recommended next step — ~100K concurrent users)

**Requires: 1 Edge Function + 1 database table + pg_cron or polling.**

### Database:
```sql
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'expired')),
  match_id UUID REFERENCES buddy_matches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX idx_queue_waiting ON matchmaking_queue(status, created_at)
  WHERE status = 'waiting';

-- Atomic FIFO pairing function
CREATE OR REPLACE FUNCTION process_matchmaking_queue()
RETURNS INTEGER AS $$
DECLARE
  v_pair RECORD;
  v_match buddy_matches;
  v_count INTEGER := 0;
BEGIN
  LOOP
    -- Grab exactly 2 waiting users atomically
    WITH pair AS (
      SELECT id, user_id FROM matchmaking_queue
      WHERE status = 'waiting' AND expires_at > NOW()
      ORDER BY created_at
      LIMIT 2
      FOR UPDATE SKIP LOCKED
    )
    SELECT
      array_agg(id) AS queue_ids,
      array_agg(user_id) AS user_ids,
      count(*) AS cnt
    INTO v_pair
    FROM pair;

    -- Exit if fewer than 2 users waiting
    EXIT WHEN v_pair.cnt < 2;

    -- Create the buddy match
    INSERT INTO buddy_matches (user_a, user_b)
    VALUES (v_pair.user_ids[1], v_pair.user_ids[2])
    RETURNING * INTO v_match;

    -- Update queue entries
    UPDATE matchmaking_queue
    SET status = 'matched', match_id = v_match.id
    WHERE id = ANY(v_pair.queue_ids);

    -- Clear looking_for_buddy on profiles
    UPDATE profiles SET looking_for_buddy = FALSE
    WHERE id = ANY(v_pair.user_ids);

    v_count := v_count + 1;
  END LOOP;

  -- Expire old entries
  UPDATE matchmaking_queue SET status = 'expired'
  WHERE status = 'waiting' AND expires_at <= NOW();

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Function (`match-buddy`):
```typescript
// Called by client to join queue
// POST /match-buddy { action: 'join' | 'leave' }
Deno.serve(async (req) => {
  const { action } = await req.json();
  const supabase = createClient(/* service role */);
  const user = await getUser(req);

  if (action === 'join') {
    await supabase.from('matchmaking_queue').insert({
      user_id: user.id, status: 'waiting'
    });
    // Run the queue processor
    const { data } = await supabase.rpc('process_matchmaking_queue');
    return new Response(JSON.stringify({ queued: true, matches_made: data }));
  }

  if (action === 'leave') {
    await supabase.from('matchmaking_queue')
      .update({ status: 'expired' })
      .eq('user_id', user.id)
      .eq('status', 'waiting');
    return new Response(JSON.stringify({ left: true }));
  }
});
```

### Client changes:
```typescript
startSearching: async (userId) => {
  set({ isSearchingBuddy: true });

  // Join queue via Edge Function
  await supabase.functions.invoke('match-buddy', { body: { action: 'join' } });

  // Listen for match on a private channel (no shared Presence!)
  const channel = getChannel(`match-notify:${userId}`);
  channel.on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'matchmaking_queue',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    if (payload.new.status === 'matched') {
      // Navigate to buddy chat
      set({ currentMatch: payload.new.match_id, isSearchingBuddy: false });
    }
  }).subscribe();

  // OR: poll every 2 seconds (simpler, no Realtime needed)
  const pollInterval = setInterval(async () => {
    const match = await getActiveMatch(userId);
    if (match) {
      clearInterval(pollInterval);
      set({ currentMatch: match, isSearchingBuddy: false });
    }
  }, 2000);
};
```

### Why this scales:
- No Presence channel → no O(n²) problem
- Queue processing is O(n) — just grab pairs FIFO
- `FOR UPDATE SKIP LOCKED` prevents race conditions without blocking
- Each user only listens on their own channel (or polls) → O(1) per user
- Works with Supabase Pro tier (~500 connections)

### Pros:
- Handles 100K+ concurrent searchers
- No race conditions
- Fair FIFO ordering
- Easy to add filters later (match by timezone, session length, etc.)

### Cons:
- Requires Edge Function (Supabase Pro or self-hosted)
- Slightly higher latency (~2-3 seconds) compared to Presence (~1 second)
- Need to handle queue cleanup for disconnected users

---

## Tier 3: Dedicated Matchmaking Service (~1M+ concurrent users)

**Requires: Separate backend service (Node.js/Go/Rust) + Redis.**

### Architecture:
```
Client → WebSocket → Matchmaking Service → Redis Queue → Match Notifier → Client
```

### Key components:
1. **Redis Sorted Set** as the queue (score = timestamp)
2. **Worker process** pops pairs every 100ms
3. **WebSocket server** (or Socket.io) for instant notifications
4. **PostgreSQL** only for persisting the match record

### Why:
- Redis ZPOPMIN is O(log n) and handles millions of ops/sec
- WebSocket = sub-100ms match notification
- Horizontal scaling: multiple workers can process the queue
- Can add sophisticated matching (preferences, ratings, geography)

### When to use:
- 100K+ daily active users
- Need sub-second matching
- Want to add matching preferences/filters
- The Supabase bill is getting uncomfortable

---

## Migration Path

```
v1 (now)          → Single Presence channel, client-side matching
                     Good for: 0-200 concurrent searchers

v1.5 (easy win)   → Sharded Presence channels (50 shards)
                     Good for: 200-5K concurrent searchers
                     Effort: ~2 hours, no infra changes

v2 (next level)   → Server-side queue + Edge Function
                     Good for: 5K-100K concurrent searchers
                     Effort: ~1 day, needs Supabase Pro

v3 (big league)   → Dedicated matchmaking service + Redis
                     Good for: 100K+ concurrent searchers
                     Effort: ~1 week, needs separate infrastructure
```

## Monitoring Triggers (when to upgrade)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Concurrent searchers | > 100 | Consider Tier 1 |
| Presence sync latency | > 3 seconds | Implement Tier 1 |
| Failed match RPCs | > 10% of attempts | Implement Tier 2 |
| Supabase Realtime connections | > 80% of plan limit | Implement Tier 2 |
| Match wait time | > 10 seconds (with 50+ searchers) | Investigate + upgrade |
| Daily active users | > 50K | Plan Tier 3 |
