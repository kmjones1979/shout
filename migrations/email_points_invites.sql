-- Email, Points, and User Invite Codes Migration
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Add email and points columns to shout_users
-- =====================================================

DO $$ 
BEGIN
    -- Email fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'email') THEN
        ALTER TABLE shout_users ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'email_verified') THEN
        ALTER TABLE shout_users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE shout_users ADD COLUMN email_verified_at TIMESTAMPTZ;
    END IF;
    
    -- Points field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'points') THEN
        ALTER TABLE shout_users ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
    
    -- Track which point rewards have been claimed (to prevent double-claiming)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'points_claimed') THEN
        ALTER TABLE shout_users ADD COLUMN points_claimed JSONB DEFAULT '{}';
    END IF;
    
    -- User's allocated invite count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shout_users' AND column_name = 'invite_count') THEN
        ALTER TABLE shout_users ADD COLUMN invite_count INTEGER DEFAULT 5;
    END IF;
END $$;

-- =====================================================
-- 2. Create email verification codes table
-- =====================================================

CREATE TABLE IF NOT EXISTS shout_email_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_wallet ON shout_email_verification(wallet_address);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON shout_email_verification(code);

-- =====================================================
-- 3. Create user invite codes table
-- =====================================================

CREATE TABLE IF NOT EXISTS shout_user_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_address TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    used_by TEXT,
    used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_invites_owner ON shout_user_invites(owner_address);
CREATE INDEX IF NOT EXISTS idx_user_invites_code ON shout_user_invites(code);

-- =====================================================
-- 4. Create points history table (for tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS shout_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_wallet ON shout_points_history(wallet_address);

-- =====================================================
-- 5. Function to award points (prevents duplicates)
-- =====================================================

CREATE OR REPLACE FUNCTION award_points(
    p_address TEXT,
    p_points INTEGER,
    p_reason TEXT,
    p_claim_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_claimed JSONB;
    v_already_claimed BOOLEAN;
BEGIN
    -- Get current claimed rewards
    SELECT COALESCE(points_claimed, '{}') INTO v_claimed
    FROM shout_users
    WHERE wallet_address = p_address;
    
    -- Check if already claimed (if claim_key provided)
    IF p_claim_key IS NOT NULL THEN
        v_already_claimed := COALESCE(v_claimed->>p_claim_key, 'false')::BOOLEAN;
        IF v_already_claimed THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Update points and mark as claimed
    UPDATE shout_users
    SET 
        points = COALESCE(points, 0) + p_points,
        points_claimed = CASE 
            WHEN p_claim_key IS NOT NULL 
            THEN COALESCE(points_claimed, '{}') || jsonb_build_object(p_claim_key, true)
            ELSE points_claimed
        END,
        updated_at = NOW()
    WHERE wallet_address = p_address;
    
    -- Log the points award
    INSERT INTO shout_points_history (wallet_address, points, reason, metadata)
    VALUES (p_address, p_points, p_reason, jsonb_build_object('claim_key', p_claim_key));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Function to generate user invite codes
-- =====================================================

CREATE OR REPLACE FUNCTION generate_user_invite_codes(
    p_address TEXT,
    p_count INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
DECLARE
    v_existing_count INTEGER;
    v_codes_to_create INTEGER;
    v_new_code TEXT;
    i INTEGER;
BEGIN
    -- Count existing codes for this user
    SELECT COUNT(*) INTO v_existing_count
    FROM shout_user_invites
    WHERE owner_address = p_address;
    
    -- Get user's invite allocation
    SELECT COALESCE(invite_count, 5) INTO v_codes_to_create
    FROM shout_users
    WHERE wallet_address = p_address;
    
    -- Calculate how many more codes to create
    v_codes_to_create := GREATEST(0, v_codes_to_create - v_existing_count);
    
    -- Create new codes
    FOR i IN 1..v_codes_to_create LOOP
        v_new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
        
        INSERT INTO shout_user_invites (owner_address, code)
        VALUES (p_address, v_new_code)
        ON CONFLICT (code) DO NOTHING;
    END LOOP;
    
    RETURN v_codes_to_create;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Function to redeem user invite code
-- =====================================================

CREATE OR REPLACE FUNCTION redeem_user_invite(
    p_code TEXT,
    p_redeemer_address TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_invite RECORD;
    v_owner_address TEXT;
BEGIN
    -- Find the invite code
    SELECT * INTO v_invite
    FROM shout_user_invites
    WHERE UPPER(code) = UPPER(p_code) AND is_active = TRUE AND used_by IS NULL;
    
    IF v_invite IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or already used invite code');
    END IF;
    
    -- Prevent self-redemption
    IF v_invite.owner_address = p_redeemer_address THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own invite code');
    END IF;
    
    v_owner_address := v_invite.owner_address;
    
    -- Mark the code as used
    UPDATE shout_user_invites
    SET used_by = p_redeemer_address, used_at = NOW()
    WHERE id = v_invite.id;
    
    -- Award points to the inviter
    PERFORM award_points(v_owner_address, 100, 'Invite code redeemed', 'invite_' || v_invite.id::TEXT);
    
    -- Update the redeemer's referred_by field
    UPDATE shout_users
    SET referred_by = v_owner_address, invite_code_used = p_code
    WHERE wallet_address = p_redeemer_address;
    
    RETURN jsonb_build_object(
        'success', true, 
        'inviter', v_owner_address,
        'code', p_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Enable RLS
-- =====================================================

ALTER TABLE shout_email_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE shout_user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE shout_points_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own email verification" ON shout_email_verification;
CREATE POLICY "Users can view own email verification" ON shout_email_verification
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert email verification" ON shout_email_verification;
CREATE POLICY "Users can insert email verification" ON shout_email_verification
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update email verification" ON shout_email_verification;
CREATE POLICY "Users can update email verification" ON shout_email_verification
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view own invites" ON shout_user_invites;
CREATE POLICY "Users can view own invites" ON shout_user_invites
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert invites" ON shout_user_invites;
CREATE POLICY "Users can insert invites" ON shout_user_invites
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update invites" ON shout_user_invites;
CREATE POLICY "Users can update invites" ON shout_user_invites
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view points history" ON shout_points_history;
CREATE POLICY "Users can view points history" ON shout_points_history
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert points history" ON shout_points_history;
CREATE POLICY "Users can insert points history" ON shout_points_history
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 9. Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION award_points TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_user_invite_codes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION redeem_user_invite TO authenticated, anon;

