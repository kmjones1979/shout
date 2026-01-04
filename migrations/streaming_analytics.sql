-- Streaming and Feature Analytics Migration
-- Adds tracking columns for live streaming, rooms, scheduling, and channels

-- Add analytics columns to shout_users
DO $$
BEGIN
    -- Streaming analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'streams_created') THEN
        ALTER TABLE shout_users ADD COLUMN streams_created INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'streams_started') THEN
        ALTER TABLE shout_users ADD COLUMN streams_started INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'streams_ended') THEN
        ALTER TABLE shout_users ADD COLUMN streams_ended INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'streaming_minutes') THEN
        ALTER TABLE shout_users ADD COLUMN streaming_minutes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'streams_viewed') THEN
        ALTER TABLE shout_users ADD COLUMN streams_viewed INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'stream_viewing_minutes') THEN
        ALTER TABLE shout_users ADD COLUMN stream_viewing_minutes INTEGER DEFAULT 0;
    END IF;
    
    -- Room analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'rooms_created') THEN
        ALTER TABLE shout_users ADD COLUMN rooms_created INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'rooms_joined') THEN
        ALTER TABLE shout_users ADD COLUMN rooms_joined INTEGER DEFAULT 0;
    END IF;
    
    -- Scheduling analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'schedules_created') THEN
        ALTER TABLE shout_users ADD COLUMN schedules_created INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'schedules_joined') THEN
        ALTER TABLE shout_users ADD COLUMN schedules_joined INTEGER DEFAULT 0;
    END IF;
    
    -- Channel analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'channels_joined') THEN
        ALTER TABLE shout_users ADD COLUMN channels_joined INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_streams_created ON shout_users(streams_created DESC);
CREATE INDEX IF NOT EXISTS idx_users_streams_started ON shout_users(streams_started DESC);
CREATE INDEX IF NOT EXISTS idx_users_streaming_minutes ON shout_users(streaming_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_users_rooms_created ON shout_users(rooms_created DESC);

SELECT 'Streaming analytics migration complete!' as status;

