-- Migration: Add subscription support to users
-- This enables subscription tiers and billing for users

-- Add subscription fields to users table
ALTER TABLE shout_users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_stripe_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for valid subscription tiers
-- Note: If this fails because constraint already exists, that's fine
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_tier'
    ) THEN
        ALTER TABLE shout_users 
        ADD CONSTRAINT valid_subscription_tier 
        CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));
    END IF;
END $$;

-- Add indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_shout_users_subscription_tier ON shout_users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_shout_users_subscription_expires ON shout_users(subscription_expires_at);

-- Add comment for documentation
COMMENT ON COLUMN shout_users.subscription_tier IS 'User subscription tier: free, pro, or enterprise';
COMMENT ON COLUMN shout_users.subscription_expires_at IS 'When the current subscription expires (null for free tier)';
COMMENT ON COLUMN shout_users.subscription_stripe_id IS 'Stripe subscription ID for billing';
COMMENT ON COLUMN shout_users.subscription_started_at IS 'When the subscription was first activated';

