-- Migration 005: Normalise Wathiq data into a single canonical table
--
-- PROBLEM
-- -------
-- Wathiq data is currently duplicated across two tables:
--   - business_users  → populated at user registration
--   - pos_application → populated at submission (snapshot copy from business_users,
--                        or directly from Wathiq for public/anonymous submissions)
--
-- Several Wathiq fields that the API returns are not stored at all:
--   confirmation_date_gregorian, in_kind_capital, avg_capital,
--   headquarter_district_name, headquarter_street_name,
--   headquarter_building_number, and the raw API response.
--
-- pos_application also carries 5 dead columns that are exact duplicates of
-- newer, better-named columns added in later migrations.
--
-- SOLUTION
-- --------
-- 1. Create wathiq_data(cr_national_number PK) — ONE row per business entity.
-- 2. Migrate all existing Wathiq data into it.
-- 3. Add wathiq_data_id FK to both pos_application and business_users.
-- 4. Drop the 5 dead duplicate columns from pos_application.
-- 5. Add the previously missing Wathiq columns to pos_application
--    (transition period — these snapshot columns will be removed in migration 006
--    once all 15+ query files have been updated to JOIN wathiq_data directly).
--
-- RELATIONSHIPS AFTER THIS MIGRATION
-- ------------------------------------
--   users ←── business_users ──→ wathiq_data
--                                     ↑
--              pos_application ───────┘
--
-- Safe to run on live DB — all operations are:
--   additive (new table, new FK columns)
--   data-only (UPDATE / INSERT)
--   removals of columns confirmed unused by grep (monthly_sales, etc.)
-- Run inside a transaction so it rolls back cleanly on any error.

BEGIN;

-- ============================================================
-- STEP 1 — Create the canonical Wathiq data table
-- ============================================================

CREATE TABLE IF NOT EXISTS wathiq_data (
    id                          SERIAL PRIMARY KEY,

    -- Natural key — one row per legal business entity
    cr_national_number          TEXT        NOT NULL UNIQUE,

    -- CR identity
    cr_number                   TEXT,
    trade_name                  TEXT,
    legal_form                  TEXT,

    -- Status & dates
    registration_status         TEXT,
    issue_date_gregorian        TEXT,
    confirmation_date_gregorian TEXT,

    -- Location (all headquarter fields from Wathiq)
    city                        TEXT,   -- headquarterCityName
    headquarter_district_name   TEXT,
    headquarter_street_name     TEXT,
    headquarter_building_number TEXT,

    -- E-commerce
    has_ecommerce               BOOLEAN     NOT NULL DEFAULT FALSE,
    store_url                   TEXT,

    -- Capital
    cr_capital                  NUMERIC(15,2),
    cash_capital                NUMERIC(15,2),
    in_kind_capital             NUMERIC(15,2),
    avg_capital                 NUMERIC(15,2),

    -- Management
    management_structure        TEXT,
    management_managers         JSONB,

    -- Business activities
    activities                  TEXT[],

    -- Contact information (email / mobile / phone object from Wathiq)
    contact_info                JSONB,

    -- Sector (derived from activities by wathiq-api-service)
    sector                      TEXT,

    -- Verification state (set by our platform, not Wathiq itself)
    is_verified                 BOOLEAN     NOT NULL DEFAULT FALSE,
    verification_date           TIMESTAMPTZ,
    admin_notes                 TEXT,

    -- Raw API response — kept for debugging / future field extraction
    wathiq_raw                  JSONB,

    -- Housekeeping
    wathiq_fetched_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wathiq_data_cr_national_number
    ON wathiq_data (cr_national_number);

CREATE INDEX IF NOT EXISTS idx_wathiq_data_trade_name
    ON wathiq_data (trade_name);

CREATE INDEX IF NOT EXISTS idx_wathiq_data_registration_status
    ON wathiq_data (registration_status);

-- ============================================================
-- STEP 2 — Seed wathiq_data from business_users
--          (registered users — most complete data set)
-- ============================================================

INSERT INTO wathiq_data (
    cr_national_number,
    cr_number,
    trade_name,
    legal_form,
    registration_status,
    issue_date_gregorian,
    confirmation_date_gregorian,
    city,
    headquarter_district_name,
    headquarter_street_name,
    headquarter_building_number,
    has_ecommerce,
    store_url,
    cr_capital,
    cash_capital,
    in_kind_capital,
    avg_capital,
    management_structure,
    management_managers,
    activities,
    contact_info,
    sector,
    is_verified,
    verification_date,
    admin_notes,
    wathiq_fetched_at,
    created_at,
    updated_at
)
SELECT
    bu.cr_national_number,
    bu.cr_number,
    bu.trade_name,
    bu.legal_form,
    bu.registration_status,
    bu.issue_date_gregorian,
    bu.confirmation_date_gregorian,
    bu.city,
    bu.headquarter_district_name,
    bu.headquarter_street_name,
    bu.headquarter_building_number,
    COALESCE(bu.has_ecommerce, FALSE),
    bu.store_url,
    bu.cr_capital,
    bu.cash_capital,
    -- in_kind_capital is TEXT in business_users — cast carefully
    CASE
        WHEN bu.in_kind_capital ~ '^\d+(\.\d+)?$'
        THEN bu.in_kind_capital::NUMERIC(15,2)
        ELSE NULL
    END,
    bu.avg_capital,
    bu.management_structure,
    bu.management_managers,
    bu.activities,
    bu.contact_info,
    bu.sector,
    COALESCE(bu.is_verified, FALSE),
    bu.verification_date,
    bu.admin_notes,
    COALESCE(bu.created_at, NOW()),
    COALESCE(bu.created_at, NOW()),
    COALESCE(bu.updated_at, NOW())
FROM business_users bu
WHERE bu.cr_national_number IS NOT NULL
ON CONFLICT (cr_national_number) DO NOTHING;

-- ============================================================
-- STEP 3 — Seed wathiq_data from pos_application
--          (anonymous/public submissions with no business_users row)
-- ============================================================

INSERT INTO wathiq_data (
    cr_national_number,
    cr_number,
    trade_name,
    legal_form,
    registration_status,
    issue_date_gregorian,
    city,
    has_ecommerce,
    store_url,
    cr_capital,
    cash_capital,
    management_structure,
    management_managers,
    activities,
    contact_info,
    wathiq_fetched_at,
    created_at,
    updated_at
)
SELECT
    pa.cr_national_number,
    pa.cr_number,
    pa.trade_name,
    pa.legal_form,
    pa.registration_status,
    pa.issue_date_gregorian::TEXT,
    pa.city,
    COALESCE(pa.has_ecommerce, FALSE),
    pa.store_url,
    pa.cr_capital,
    pa.cash_capital,
    pa.management_structure,
    pa.management_managers,
    -- activities column is JSONB on pos_application, TEXT[] on wathiq_data
    -- convert: if it's a JSON array of strings, cast; otherwise leave null
    CASE
        WHEN jsonb_typeof(pa.activities) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(pa.activities))
        ELSE NULL
    END,
    pa.contact_info,
    COALESCE(pa.submitted_at, NOW()),
    COALESCE(pa.submitted_at, NOW()),
    COALESCE(pa.updated_at, NOW())
FROM pos_application pa
WHERE pa.cr_national_number IS NOT NULL
  AND pa.user_id IS NULL   -- public submissions only (registered users already covered above)
ON CONFLICT (cr_national_number) DO NOTHING;

-- ============================================================
-- STEP 4 — Add wathiq_data_id FK to pos_application
-- ============================================================

ALTER TABLE pos_application
    ADD COLUMN IF NOT EXISTS wathiq_data_id INTEGER
        REFERENCES wathiq_data (id) ON DELETE SET NULL;

-- Wire up existing rows
UPDATE pos_application pa
SET    wathiq_data_id = wd.id
FROM   wathiq_data wd
WHERE  pa.cr_national_number = wd.cr_national_number
  AND  pa.wathiq_data_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_pos_application_wathiq_data_id
    ON pos_application (wathiq_data_id);

-- ============================================================
-- STEP 5 — Add wathiq_data_id FK to business_users
-- ============================================================

ALTER TABLE business_users
    ADD COLUMN IF NOT EXISTS wathiq_data_id INTEGER
        REFERENCES wathiq_data (id) ON DELETE SET NULL;

-- Wire up existing rows
UPDATE business_users bu
SET    wathiq_data_id = wd.id
FROM   wathiq_data wd
WHERE  bu.cr_national_number = wd.cr_national_number
  AND  bu.wathiq_data_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_users_wathiq_data_id
    ON business_users (wathiq_data_id);

-- ============================================================
-- STEP 6 — Add the missing Wathiq columns to pos_application
--          (transition snapshot — allows all existing queries to
--           keep reading directly from pos_application until
--           migration 006 removes them after query updates)
-- ============================================================

ALTER TABLE pos_application
    ADD COLUMN IF NOT EXISTS confirmation_date_gregorian TEXT,
    ADD COLUMN IF NOT EXISTS in_kind_capital             NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS avg_capital                 NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS headquarter_district_name   TEXT,
    ADD COLUMN IF NOT EXISTS headquarter_street_name     TEXT,
    ADD COLUMN IF NOT EXISTS headquarter_building_number TEXT,
    ADD COLUMN IF NOT EXISTS wathiq_raw                  JSONB;

-- Backfill these new columns from the freshly-populated wathiq_data
UPDATE pos_application pa
SET
    confirmation_date_gregorian = wd.confirmation_date_gregorian,
    in_kind_capital             = wd.in_kind_capital,
    avg_capital                 = wd.avg_capital,
    headquarter_district_name   = wd.headquarter_district_name,
    headquarter_street_name     = wd.headquarter_street_name,
    headquarter_building_number = wd.headquarter_building_number
FROM wathiq_data wd
WHERE pa.wathiq_data_id = wd.id;

-- ============================================================
-- STEP 7 — Drop confirmed-dead duplicate columns from pos_application
--
-- Each dropped column is an exact semantic duplicate of a newer column:
--   monthly_sales        → avg_monthly_pos_sales
--   financing_amount     → requested_financing_amount
--   repayment_period     → preferred_repayment_period_months
--   pos_provider         → pos_provider_name
--   pos_age              → pos_age_duration_months
--
-- Verified by grep: zero references to these names in src/ (other than
-- their newer counterparts). Safe to drop.
-- ============================================================

ALTER TABLE pos_application
    DROP COLUMN IF EXISTS monthly_sales,
    DROP COLUMN IF EXISTS financing_amount,
    DROP COLUMN IF EXISTS repayment_period,
    DROP COLUMN IF EXISTS pos_provider,
    DROP COLUMN IF EXISTS pos_age;

-- ============================================================
-- STEP 8 — Helpful view: full application with Wathiq data joined
--          Use this in new code instead of selecting from pos_application
--          directly. Existing code can migrate to this view incrementally.
-- ============================================================

CREATE OR REPLACE VIEW v_application_full AS
SELECT
    pa.application_id,
    pa.user_id,
    pa.wathiq_data_id,
    pa.cr_national_number,
    pa.reference_number,
    pa.financing_type,
    pa.status,
    pa.verification_status,
    pa.submitted_at,
    pa.auction_end_time,
    pa.offer_selection_end_time,
    pa.notes,
    pa.admin_notes,
    pa.contact_person,
    pa.contact_person_number,
    pa.city_of_operation,
    pa.sector               AS application_sector,
    pa.business_contact_email,
    pa.approximate_financing_amount,
    pa.preferred_repayment_period_months,
    pa.requested_financing_amount,
    pa.own_pos_system,
    pa.number_of_pos_devices,
    pa.pos_provider_name,
    pa.pos_age_duration_months,
    pa.avg_monthly_pos_sales,
    pa.uploaded_document,
    pa.uploaded_filename,
    pa.uploaded_mimetype,
    pa.opened_by,
    pa.purchased_by,
    pa.offers_count,
    pa.revenue_collected,
    pa.business_user_id,
    pa.assigned_user_id,
    pa.current_application_status,
    pa.updated_at,
    -- All Wathiq fields from the canonical table
    wd.cr_number,
    wd.trade_name,
    wd.legal_form,
    wd.registration_status,
    wd.issue_date_gregorian,
    wd.confirmation_date_gregorian,
    wd.city,
    wd.headquarter_district_name,
    wd.headquarter_street_name,
    wd.headquarter_building_number,
    wd.has_ecommerce,
    wd.store_url,
    wd.cr_capital,
    wd.cash_capital,
    wd.in_kind_capital,
    wd.avg_capital,
    wd.management_structure,
    wd.management_managers,
    wd.activities,
    wd.contact_info,
    wd.sector               AS wathiq_sector,
    wd.is_verified,
    wd.verification_date,
    wd.wathiq_raw,
    wd.wathiq_fetched_at
FROM pos_application pa
LEFT JOIN wathiq_data wd ON pa.wathiq_data_id = wd.id;

COMMIT;
