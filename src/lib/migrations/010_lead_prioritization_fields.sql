-- 010_lead_prioritization_fields.sql
--
-- Client "Implementation Spec" Part A: three new questions on the SME application
-- form (annual revenue / pre-revenue / POS sales), plus alignment of the whole
-- application form with the authoritative reference implementation on nesbah.net.
--
-- Design decisions baked into this migration:
--
-- 1. TABLE. The spec says `applications`; that table does not exist here. The
--    central application table is `pos_application` (see CLAUDE.md dispatcher
--    note), so all columns land there.
--
-- 2. POS QUESTION reuses the existing `own_pos_system` boolean rather than adding
--    `has_pos`. The two questions are near-identical and a second boolean would
--    be a permanent source of confusion. Consequence: rows written by the legacy
--    POS flow answered a slightly different question, so the score treats NULL /
--    legacy values as "unknown" rather than "no".
--
-- 3. CODES, NOT LABELS. Every enumerated answer is stored as a stable code.
--    Labels change and differ per language; codes must stay comparable across
--    historical records and partner-side reporting.
--
-- 4. ADD ALONGSIDE, NEVER CONVERT IN PLACE. `city_of_operation`, `sector` and
--    `approximate_financing_amount` already hold free text / localized display
--    labels. Their codes go in NEW columns and the original text is kept as a
--    display fallback. Historical rows that cannot be mapped unambiguously stay
--    NULL — a NULL that falls back to the original text is honest; a guess is not.
--
-- 5. `lead_tier` is derived by trigger from `lead_score`, mirroring the reference
--    implementation exactly (>=75 high, >=45 medium, else low).
--
-- Apply to dev first (nesbah_dev), verify the onboarding flow end to end, then
-- apply to prod during a quiet window. All statements are idempotent.

BEGIN;

-- ─── Part A: the three new questions ────────────────────────────────────────

ALTER TABLE public.pos_application
    -- '100k_300k' | '300k_1m' | 'gt_1m'. NULL when is_pre_revenue is true.
    ADD COLUMN IF NOT EXISTS annual_revenue_code text,
    ADD COLUMN IF NOT EXISTS is_pre_revenue boolean NOT NULL DEFAULT false;

-- The POS question maps onto the existing own_pos_system boolean (decision 2).
-- It stays NULL-able: historical rows genuinely have no answer to the new
-- question, and back-filling one would be fabricating data. Required-ness is
-- enforced at the API layer for the submission paths instead.

-- ─── Reference-implementation alignment: stable codes ───────────────────────

ALTER TABLE public.pos_application
    -- 'lt_250k' | '250k_500k' | '500k_1m' | 'gt_1m' — buckets taken from the
    -- reference implementation so the lead score is comparable across sites.
    ADD COLUMN IF NOT EXISTS amount_range_code text,
    -- 'lt_1' | '1_2' | '2_3' | '3_5' | 'gt_5'
    ADD COLUMN IF NOT EXISTS business_age_range_code text,
    ADD COLUMN IF NOT EXISTS city_code text,
    ADD COLUMN IF NOT EXISTS sector_code text;

-- ─── Consent tracking ───────────────────────────────────────────────────────
-- The reference form requires an explicit consent checkbox and records which
-- version of the terms was accepted. Neither spec document asked for this, but
-- it is a field on the reference form and it is the only defensible way to
-- evidence consent for sharing applicant data with financing partners.

ALTER TABLE public.pos_application
    ADD COLUMN IF NOT EXISTS consent_at timestamp without time zone,
    ADD COLUMN IF NOT EXISTS consent_version text;

-- ─── Internal lead-prioritization indicator ─────────────────────────────────
-- Visible to admins and financing partners ONLY. Never surfaced to the applicant.
-- Not a credit score, affordability assessment, or eligibility decision.

ALTER TABLE public.pos_application
    ADD COLUMN IF NOT EXISTS lead_score integer,
    ADD COLUMN IF NOT EXISTS lead_tier text;

-- ─── Constraints ────────────────────────────────────────────────────────────
-- Guard rails rather than validation: they make the XOR rule and the code
-- vocabularies impossible to violate from ANY write path, including psql.
-- NOT VALID so existing rows are never rejected; new/updated rows are checked.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_application_revenue_xor_chk') THEN
        ALTER TABLE public.pos_application
            ADD CONSTRAINT pos_application_revenue_xor_chk
            CHECK (NOT (is_pre_revenue AND annual_revenue_code IS NOT NULL)) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_application_revenue_code_chk') THEN
        ALTER TABLE public.pos_application
            ADD CONSTRAINT pos_application_revenue_code_chk
            CHECK (annual_revenue_code IS NULL
                   OR annual_revenue_code IN ('100k_300k', '300k_1m', 'gt_1m')) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_application_amount_code_chk') THEN
        ALTER TABLE public.pos_application
            ADD CONSTRAINT pos_application_amount_code_chk
            CHECK (amount_range_code IS NULL
                   OR amount_range_code IN ('lt_250k', '250k_500k', '500k_1m', 'gt_1m')) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_application_age_code_chk') THEN
        ALTER TABLE public.pos_application
            ADD CONSTRAINT pos_application_age_code_chk
            CHECK (business_age_range_code IS NULL
                   OR business_age_range_code IN ('lt_1', '1_2', '2_3', '3_5', 'gt_5')) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_application_lead_score_chk') THEN
        ALTER TABLE public.pos_application
            ADD CONSTRAINT pos_application_lead_score_chk
            CHECK (lead_score IS NULL OR lead_score BETWEEN 0 AND 100) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pos_application_lead_tier_chk') THEN
        ALTER TABLE public.pos_application
            ADD CONSTRAINT pos_application_lead_tier_chk
            CHECK (lead_tier IS NULL OR lead_tier IN ('high', 'medium', 'low')) NOT VALID;
    END IF;
END $$;

-- ─── Derive lead_tier from lead_score ───────────────────────────────────────
-- Thresholds mirror the reference implementation's applications_derive_fields().
-- Kept in a trigger (not application code) so every write path — API, admin
-- edit, manual SQL — produces a consistent tier.

CREATE OR REPLACE FUNCTION public.pos_application_derive_lead_tier()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.lead_score IS NULL THEN
        NEW.lead_tier := NULL;
    ELSIF NEW.lead_score >= 75 THEN
        NEW.lead_tier := 'high';
    ELSIF NEW.lead_score >= 45 THEN
        NEW.lead_tier := 'medium';
    ELSE
        NEW.lead_tier := 'low';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS pos_application_derive_lead_tier_trg ON public.pos_application;
CREATE TRIGGER pos_application_derive_lead_tier_trg
    BEFORE INSERT OR UPDATE OF lead_score ON public.pos_application
    FOR EACH ROW EXECUTE FUNCTION public.pos_application_derive_lead_tier();

-- ─── Best-effort backfill of the new code columns ───────────────────────────
-- Only unambiguous mappings are applied. Everything else stays NULL and falls
-- back to the original text column at display time.

-- Amount: the old options were "<250K / 250K-1M / 1M-5M / >5M" in Arabic OR
-- English display labels. Only the bottom and top buckets map cleanly:
--   "<250K"        -> lt_250k
--   "1M-5M", ">5M" -> gt_1m   (both are above 1M, which is the new top bucket)
-- The old "250K-1M" bucket straddles the new 250k_500k / 500k_1m boundary with
-- no way to tell which side a given row belongs on, so it is left NULL.
UPDATE public.pos_application
   SET amount_range_code = 'lt_250k'
 WHERE amount_range_code IS NULL
   AND approximate_financing_amount IS NOT NULL
   AND (approximate_financing_amount ILIKE '%less than 250%'
        OR approximate_financing_amount LIKE '%أقل من 250%'
        OR approximate_financing_amount LIKE '%أقل من ٢٥٠%');

UPDATE public.pos_application
   SET amount_range_code = 'gt_1m'
 WHERE amount_range_code IS NULL
   AND approximate_financing_amount IS NOT NULL
   AND (approximate_financing_amount ILIKE '%1M – 5M%'
        OR approximate_financing_amount ILIKE '%1M - 5M%'
        OR approximate_financing_amount ILIKE '%more than 5M%'
        OR approximate_financing_amount LIKE '%1 مليون – 5%'
        OR approximate_financing_amount LIKE '%أكثر من 5 مليون%');

-- City / sector: free text (Arabic or English, user-typed, so typos exist).
-- Mapped only on exact-ish matches against the canonical vocabulary.
UPDATE public.pos_application pa
   SET city_code = v.code
  FROM (VALUES
        ('riyadh', 'الرياض', 'riyadh'),
        ('jeddah', 'جدة', 'jeddah'),
        ('dammam', 'الدمام', 'dammam'),
        ('makkah', 'مكة', 'makkah'),
        ('madinah', 'المدينة', 'madinah'),
        ('khobar', 'الخبر', 'khobar'),
        ('abha', 'أبها', 'abha'),
        ('taif', 'الطائف', 'taif'),
        ('buraydah', 'بريدة', 'buraydah'),
        ('khamis', 'خميس مشيط', 'khamis mushait')
       ) AS v(code, ar, en)
 WHERE pa.city_code IS NULL
   AND pa.city_of_operation IS NOT NULL
   AND (btrim(pa.city_of_operation) = v.ar
        OR lower(btrim(pa.city_of_operation)) = v.en);

UPDATE public.pos_application pa
   SET sector_code = v.code
  FROM (VALUES
        ('retail', 'البيع بالتجزئة', 'retail'),
        ('wholesale', 'البيع بالجملة', 'wholesale'),
        ('manufacturing', 'التصنيع', 'manufacturing'),
        ('services', 'الخدمات', 'services'),
        ('technology', 'التكنولوجيا', 'technology'),
        ('healthcare', 'الرعاية الصحية', 'healthcare'),
        ('education', 'التعليم', 'education'),
        ('hospitality', 'الفندقة والسياحة', 'hospitality & tourism'),
        ('construction', 'البناء والمقاولات', 'construction'),
        ('agriculture', 'الزراعة', 'agriculture')
       ) AS v(code, ar, en)
 WHERE pa.sector_code IS NULL
   AND pa.sector IS NOT NULL
   AND (btrim(pa.sector) = v.ar
        OR lower(btrim(pa.sector)) = v.en);

-- ─── Financing type vocabulary alignment ────────────────────────────────────
-- The reference implementation uses 'corporate' and 'commercial_real_estate'
-- where this codebase used 'business' and 'real_estate'. Rename in place: these
-- ARE codes already, so the mapping is exact and lossless.
--
-- 'general' ("أخرى" / Other) has no counterpart in the reference vocabulary. It
-- is retired from the form but kept as a legacy value on existing rows — the
-- alternative is inventing a financing type for a lead that never chose one.
--
-- NOTE: public URL slugs (/business-financing, /real-estate-project-financing)
-- are indexed in Google Search Console and are NOT touched. Only internal codes.
UPDATE public.pos_application SET financing_type = 'corporate'               WHERE financing_type = 'business';
UPDATE public.pos_application SET financing_type = 'commercial_real_estate'  WHERE financing_type = 'real_estate';

-- Indexes for the admin/partner list views that will filter and sort on these.
CREATE INDEX IF NOT EXISTS idx_pos_app_lead_score ON public.pos_application (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_pos_app_lead_tier  ON public.pos_application (lead_tier);

COMMIT;
