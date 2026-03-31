-- Migration 001: Support anonymous public submissions from the new landing page
-- Run against Cloud SQL (PostgreSQL 16) via psql
-- Safe to run on live DB: existing rows are unaffected

-- 1. Allow anonymous submissions (public form has no user account)
ALTER TABLE pos_application ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add financing type (7 product types from new frontend)
--    Valid values: pos, working_capital, equipment, expansion, project, real_estate, general
--    Existing rows default to 'pos' (they are all POS applications)
ALTER TABLE pos_application
  ADD COLUMN IF NOT EXISTS financing_type VARCHAR(100) DEFAULT 'pos';

-- 3. Add reference number for anonymous submissions
--    Existing authenticated submissions get NULL (they are identified by user_id)
ALTER TABLE pos_application
  ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);

-- 4. Unique partial index — only enforces uniqueness when reference_number is set
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_application_reference_number
  ON pos_application (reference_number)
  WHERE reference_number IS NOT NULL;
