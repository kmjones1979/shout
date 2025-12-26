-- AI Agents Migration
-- V1: Basic agent configuration storage

-- Agent configurations
CREATE TABLE IF NOT EXISTS shout_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_address TEXT NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) <= 50),
    personality TEXT CHECK (char_length(personality) <= 1000),
    system_instructions TEXT,
    model TEXT DEFAULT 'gemini-2.0-flash',
    avatar_emoji TEXT DEFAULT '🤖',
    
    -- Visibility: 'private', 'friends', 'public'
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_agent_name_per_user UNIQUE (owner_address, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_owner ON shout_agents(owner_address);
CREATE INDEX IF NOT EXISTS idx_agents_visibility ON shout_agents(visibility);
CREATE INDEX IF NOT EXISTS idx_agents_created ON shout_agents(created_at DESC);

-- Enable RLS
ALTER TABLE shout_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own agents" ON shout_agents;
CREATE POLICY "Users can manage own agents" ON shout_agents
    FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE shout_agents;

-- V2: Agent knowledge base (URLs for indexing)
CREATE TABLE IF NOT EXISTS shout_agent_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES shout_agents(id) ON DELETE CASCADE,
    
    -- Content info
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT DEFAULT 'webpage', -- 'webpage', 'github', 'docs'
    
    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    error_message TEXT,
    
    -- Vertex AI reference (for V2)
    embedding_id TEXT,
    chunk_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indexed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_url_per_agent UNIQUE (agent_id, url)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_agent ON shout_agent_knowledge(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_status ON shout_agent_knowledge(status);

-- Enable RLS
ALTER TABLE shout_agent_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage agent knowledge" ON shout_agent_knowledge;
CREATE POLICY "Users can manage agent knowledge" ON shout_agent_knowledge
    FOR ALL USING (true);

-- V2: Agent chat history (optional, for context)
CREATE TABLE IF NOT EXISTS shout_agent_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES shout_agents(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    
    -- Message
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_chats_agent ON shout_agent_chats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_chats_user ON shout_agent_chats(user_address);
CREATE INDEX IF NOT EXISTS idx_agent_chats_created ON shout_agent_chats(created_at DESC);

-- Enable RLS
ALTER TABLE shout_agent_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access agent chats" ON shout_agent_chats;
CREATE POLICY "Users can access agent chats" ON shout_agent_chats
    FOR ALL USING (true);

-- Function to increment agent message count
CREATE OR REPLACE FUNCTION increment_agent_messages(p_agent_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE shout_agents
    SET message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

