-- Migration 004: Add approximate_financing_amount (text enum) to pos_application
-- The onboarding form collects a range enum ("Less than 250K SAR", etc.)
-- This is separate from requested_financing_amount (DECIMAL) used by the old POS flow.

ALTER TABLE pos_application
    ADD COLUMN IF NOT EXISTS approximate_financing_amount TEXT;
