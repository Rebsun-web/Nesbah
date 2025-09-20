-- Add MFA columns to users table
-- Run this SQL to add the required columns for MFA functionality

-- Add mfa_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'mfa_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added mfa_enabled column to users table';
    ELSE
        RAISE NOTICE 'mfa_enabled column already exists';
    END IF;
END $$;

-- Add mfa_secret column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'mfa_secret'
    ) THEN
        ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
        RAISE NOTICE 'Added mfa_secret column to users table';
    ELSE
        RAISE NOTICE 'mfa_secret column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('mfa_enabled', 'mfa_secret')
ORDER BY column_name;
