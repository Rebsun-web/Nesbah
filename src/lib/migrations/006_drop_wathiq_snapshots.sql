-- Migration 006: Drop Wathiq snapshot columns from pos_application and business_users
--
-- BACKGROUND
-- ----------
-- Migration 005 created wathiq_data as the single canonical source of Wathiq data
-- and added wathiq_data_id FKs to both pos_application and business_users.
-- Snapshot columns were kept during the transition period (migration 005, step 6)
-- while all ~25 query files were updated to JOIN wathiq_data directly.
--
-- All queries have now been updated. This migration removes the snapshots.
--
-- COLUMNS DROPPED FROM pos_application
-- --------------------------------------
-- These are pure Wathiq snapshot copies; all reads now use wd.* via JOIN wathiq_data:
--   trade_name, cr_number, legal_form, registration_status, issue_date_gregorian,
--   confirmation_date_gregorian, city (HQ city — NOT city_of_operation which stays),
--   has_ecommerce, store_url, cr_capital, cash_capital, management_structure,
--   in_kind_capital, avg_capital, headquarter_district_name, headquarter_street_name,
--   headquarter_building_number, wathiq_raw
--
-- NOTE: The following columns are NOT dropped — they are application-specific, not Wathiq:
--   city_of_operation    — user-entered operational city
--   contact_person       — applicant contact (may differ from Wathiq)
--   contact_person_number
--   sector               — user-selected sector (COALESCE with wd.sector in queries)
--   cr_national_number   — used as the JOIN key to wathiq_data
--   admin_notes          — application-level admin notes (≠ wd.admin_notes)
--
-- COLUMNS DROPPED FROM business_users
-- -------------------------------------
-- All Wathiq data now lives in wathiq_data; reads use wd.* via wathiq_data_id FK:
--   trade_name, cr_number, legal_form, registration_status, issue_date_gregorian,
--   confirmation_date_gregorian, city, has_ecommerce, store_url, cr_capital,
--   cash_capital, management_structure, management_managers, address, sector,
--   in_kind_capital, avg_capital, headquarter_city_name, headquarter_district_name,
--   headquarter_street_name, headquarter_building_number, activities, contact_info
--
-- NOTE: The following columns are NOT dropped:
--   cr_national_number   — used for wathiq_data JOIN fallback and as business identifier
--   contact_person       — user-specific contact
--   contact_person_number
--   wathiq_data_id       — FK to wathiq_data
--
-- Safe to run: all dropped columns have been confirmed unused by all API queries.
-- Run inside a transaction.

BEGIN;

-- ============================================================
-- STEP 1 — Drop Wathiq snapshot columns from pos_application
-- ============================================================

ALTER TABLE pos_application
    DROP COLUMN IF EXISTS trade_name,
    DROP COLUMN IF EXISTS cr_number,
    DROP COLUMN IF EXISTS legal_form,
    DROP COLUMN IF EXISTS registration_status,
    DROP COLUMN IF EXISTS issue_date_gregorian,
    DROP COLUMN IF EXISTS confirmation_date_gregorian,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS has_ecommerce,
    DROP COLUMN IF EXISTS store_url,
    DROP COLUMN IF EXISTS cr_capital,
    DROP COLUMN IF EXISTS cash_capital,
    DROP COLUMN IF EXISTS management_structure,
    DROP COLUMN IF EXISTS in_kind_capital,
    DROP COLUMN IF EXISTS avg_capital,
    DROP COLUMN IF EXISTS headquarter_district_name,
    DROP COLUMN IF EXISTS headquarter_street_name,
    DROP COLUMN IF EXISTS headquarter_building_number,
    DROP COLUMN IF EXISTS wathiq_raw;

-- ============================================================
-- STEP 2 — Drop Wathiq snapshot columns from business_users
-- ============================================================

ALTER TABLE business_users
    DROP COLUMN IF EXISTS trade_name,
    DROP COLUMN IF EXISTS cr_number,
    DROP COLUMN IF EXISTS legal_form,
    DROP COLUMN IF EXISTS registration_status,
    DROP COLUMN IF EXISTS issue_date_gregorian,
    DROP COLUMN IF EXISTS confirmation_date_gregorian,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS has_ecommerce,
    DROP COLUMN IF EXISTS store_url,
    DROP COLUMN IF EXISTS cr_capital,
    DROP COLUMN IF EXISTS cash_capital,
    DROP COLUMN IF EXISTS management_structure,
    DROP COLUMN IF EXISTS management_managers,
    DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS sector,
    DROP COLUMN IF EXISTS in_kind_capital,
    DROP COLUMN IF EXISTS avg_capital,
    DROP COLUMN IF EXISTS headquarter_city_name,
    DROP COLUMN IF EXISTS headquarter_district_name,
    DROP COLUMN IF EXISTS headquarter_street_name,
    DROP COLUMN IF EXISTS headquarter_building_number,
    DROP COLUMN IF EXISTS activities,
    DROP COLUMN IF EXISTS contact_info;

-- ============================================================
-- STEP 3 — Drop and recreate v_application_full view
--          (was created in 005 — drop and recreate without snapshot cols)
-- ============================================================

DROP VIEW IF EXISTS v_application_full;

CREATE VIEW v_application_full AS
    SELECT
        pa.application_id,
        pa.user_id,
        pa.status,
        pa.submitted_at,
        pa.auction_end_time,
        pa.notes,
        pa.own_pos_system,
        pa.contact_person,
        pa.contact_person_number,
        pa.number_of_pos_devices,
        pa.city_of_operation,
        pa.pos_provider_name,
        pa.pos_age_duration_months,
        pa.avg_monthly_pos_sales,
        pa.preferred_repayment_period_months,
        pa.cr_national_number,
        pa.financing_type,
        pa.approximate_financing_amount,
        pa.business_contact_email,
        pa.reference_number,
        pa.verification_status,
        pa.offers_count,
        pa.revenue_collected,
        pa.opened_by,
        pa.purchased_by,
        pa.sector AS application_sector,
        pa.wathiq_data_id,
        -- Wathiq fields (canonical source)
        wd.cr_number,
        wd.trade_name,
        wd.legal_form,
        wd.registration_status,
        wd.issue_date_gregorian,
        wd.confirmation_date_gregorian,
        wd.city,
        wd.has_ecommerce,
        wd.store_url,
        wd.cr_capital,
        wd.cash_capital,
        wd.management_structure,
        wd.management_managers,
        wd.contact_info,
        wd.activities,
        wd.in_kind_capital,
        wd.avg_capital,
        wd.headquarter_district_name,
        wd.headquarter_street_name,
        wd.headquarter_building_number,
        COALESCE(pa.sector, wd.sector) AS sector,
        wd.is_verified,
        wd.verification_date
    FROM pos_application pa
    LEFT JOIN wathiq_data wd ON wd.cr_national_number = pa.cr_national_number;

COMMIT;
