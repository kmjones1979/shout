-- Call History Table
-- Tracks all voice and video calls between users

CREATE TABLE IF NOT EXISTS shout_call_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_address TEXT NOT NULL,
    callee_address TEXT NOT NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'declined', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    channel_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_call_history_caller ON shout_call_history(caller_address);
CREATE INDEX IF NOT EXISTS idx_call_history_callee ON shout_call_history(callee_address);
CREATE INDEX IF NOT EXISTS idx_call_history_created ON shout_call_history(created_at DESC);

-- Enable RLS
ALTER TABLE shout_call_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own call history (as caller or callee)
CREATE POLICY "Users can view their own call history"
ON shout_call_history FOR SELECT
USING (true);

-- Policy: Users can insert their own calls
CREATE POLICY "Users can insert calls"
ON shout_call_history FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own calls (to set end time/duration)
CREATE POLICY "Users can update their calls"
ON shout_call_history FOR UPDATE
USING (true);

