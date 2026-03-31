--
-- PostgreSQL database dump
--

\restrict WAIButQaGmsXV8Xxd91cGG4hLvSYzXLyiI2mBhygFhOyEnJGj796QZEq3ekKCC2

-- Dumped from database version 16.11
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: admin_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_role AS ENUM (
    'super_admin',
    'admin',
    'read_only'
);


--
-- Name: add_bank_to_opened_by(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_bank_to_opened_by(app_id integer, bank_user_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
            BEGIN
                UPDATE pos_application 
                SET opened_by = array_append(opened_by, bank_user_id)
                WHERE application_id = app_id 
                AND NOT (bank_user_id = ANY(opened_by));
                
                RETURN FOUND;
            END;
            $$;


--
-- Name: add_bank_to_purchased_by(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_bank_to_purchased_by(app_id integer, bank_user_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
            BEGIN
                -- Check if bank is already in opened_by
                IF NOT EXISTS (
                    SELECT 1 FROM pos_application 
                    WHERE application_id = app_id 
                    AND bank_user_id = ANY(opened_by)
                ) THEN
                    RAISE EXCEPTION 'Bank must view application before purchasing';
                END IF;
                
                -- Add to purchased_by if not already there
                UPDATE pos_application 
                SET purchased_by = array_append(purchased_by, bank_user_id)
                WHERE application_id = app_id 
                AND bank_user_id = ANY(opened_by)
                AND NOT (bank_user_id = ANY(purchased_by));
                
                RETURN FOUND;
            END;
            $$;


--
-- Name: calculate_application_windows(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_application_windows(submitted_time timestamp without time zone) RETURNS TABLE(window_start timestamp without time zone, window_end timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    submitted_time AS window_start,
                    submitted_time + INTERVAL '48 hours' AS window_end;
            END;
            $$;


--
-- Name: calculate_bank_performance_stats(integer, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_bank_performance_stats(p_bank_user_id integer, p_period_start date, p_period_end date) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total_viewed INTEGER;
    v_total_purchased INTEGER;
    v_total_offers_submitted INTEGER;
    v_total_deals_won INTEGER;
    v_total_deals_lost INTEGER;
    v_avg_response_time DECIMAL(10,2);
BEGIN
    -- Calculate application interaction metrics
    SELECT 
        COUNT(CASE WHEN p_bank_user_id = ANY(opened_by) THEN 1 END),
        COUNT(CASE WHEN p_bank_user_id = ANY(purchased_by) THEN 1 END)
    INTO v_total_viewed, v_total_purchased
    FROM submitted_applications sa
    WHERE sa.submitted_at::DATE BETWEEN p_period_start AND p_period_end;
    
    -- Calculate offer metrics
    SELECT 
        COUNT(*)
    INTO v_total_offers_submitted
    FROM application_offers ao
    WHERE ao.bank_user_id = p_bank_user_id 
    AND ao.submitted_at::DATE BETWEEN p_period_start AND p_period_end;
    
    -- Calculate deal outcome metrics
    SELECT 
        COUNT(CASE WHEN closure_type = 'deal_won' THEN 1 END),
        COUNT(CASE WHEN closure_type = 'deal_lost' THEN 1 END)
    INTO v_total_deals_won, v_total_deals_lost
    FROM submitted_applications sa
    WHERE sa.closed_at::DATE BETWEEN p_period_start AND p_period_end
    AND EXISTS (
        SELECT 1 FROM application_offers ao 
        WHERE ao.submitted_application_id = sa.id 
        AND ao.bank_user_id = p_bank_user_id
    );
    
    -- Calculate response time metrics
    SELECT 
        AVG(EXTRACT(EPOCH FROM (ao.submitted_at - sa.submitted_at))/3600)
    INTO v_avg_response_time
    FROM application_offers ao
    JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
    WHERE ao.bank_user_id = p_bank_user_id 
    AND ao.submitted_at::DATE BETWEEN p_period_start AND p_period_end;
    
    -- Insert or update the statistics
    INSERT INTO bank_performance_metrics (
        bank_user_id, time_period,
        applications_viewed, applications_purchased, offers_submitted,
        deals_closed_won, deals_closed_lost, avg_response_time_hours,
        updated_at
    ) VALUES (
        p_bank_user_id, p_period_start,
        v_total_viewed, v_total_purchased, v_total_offers_submitted,
        v_total_deals_won, v_total_deals_lost, v_avg_response_time,
        NOW()
    )
    ON CONFLICT (bank_user_id, time_period)
    DO UPDATE SET
        applications_viewed = EXCLUDED.applications_viewed,
        applications_purchased = EXCLUDED.applications_purchased,
        offers_submitted = EXCLUDED.offers_submitted,
        deals_closed_won = EXCLUDED.deals_closed_won,
        deals_closed_lost = EXCLUDED.deals_closed_lost,
        avg_response_time_hours = EXCLUDED.avg_response_time_hours,
        updated_at = NOW();
END;
$$;


--
-- Name: calculate_offer_windows(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_offer_windows(application_window_end timestamp without time zone) RETURNS TABLE(window_start timestamp without time zone, window_end timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    application_window_end AS window_start,
                    application_window_end + INTERVAL '24 hours' AS window_end;
            END;
            $$;


--
-- Name: get_bank_tracking_info(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_bank_tracking_info(app_id integer) RETURNS TABLE(opened_banks integer[], purchased_banks integer[])
    LANGUAGE plpgsql
    AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    pa.opened_by,
                    pa.purchased_by
                FROM pos_application pa
                WHERE pa.application_id = app_id;
            END;
            $$;


--
-- Name: get_commission_statistics(timestamp without time zone, timestamp without time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_commission_statistics(start_date timestamp without time zone DEFAULT NULL::timestamp without time zone, end_date timestamp without time zone DEFAULT NULL::timestamp without time zone, bank_user_id_param integer DEFAULT NULL::integer) RETURNS TABLE(total_deals bigint, total_deal_value numeric, total_commission_revenue numeric, total_bank_revenue numeric, avg_commission_rate numeric, avg_deal_value numeric, avg_commission_per_deal numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_deals,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN deal_value ELSE 0 END), 0) as total_deal_value,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN commission_amount ELSE 0 END), 0) as total_commission_revenue,
        COALESCE(SUM(CASE WHEN status = 'accepted' THEN bank_revenue ELSE 0 END), 0) as total_bank_revenue,
        ROUND(AVG(CASE WHEN status = 'accepted' THEN commission_rate ELSE NULL END), 2) as avg_commission_rate,
        ROUND(AVG(CASE WHEN status = 'accepted' THEN deal_value ELSE NULL END), 2) as avg_deal_value,
        ROUND(AVG(CASE WHEN status = 'accepted' THEN commission_amount ELSE NULL END), 2) as avg_commission_per_deal
    FROM application_offers
    WHERE (start_date IS NULL OR submitted_at >= start_date)
      AND (end_date IS NULL OR submitted_at <= end_date)
      AND (bank_user_id_param IS NULL OR bank_user_id = bank_user_id_param);
END;
$$;


--
-- Name: get_offer_statistics(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_offer_statistics(bank_user_id_param integer DEFAULT NULL::integer) RETURNS TABLE(total_offers bigint, pending_offers bigint, accepted_offers bigint, rejected_offers bigint, expired_offers bigint, total_revenue numeric, avg_setup_fee numeric, avg_transaction_fee_mada numeric, avg_transaction_fee_visa_mc numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_offers,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_offers,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_offers,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_offers,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_offers,
        COALESCE(SUM(offer_device_setup_fee) FILTER (WHERE status = 'accepted'), 0) as total_revenue,
        COALESCE(AVG(offer_device_setup_fee), 0) as avg_setup_fee,
        COALESCE(AVG(offer_transaction_fee_mada), 0) as avg_transaction_fee_mada,
        COALESCE(AVG(offer_transaction_fee_visa_mc), 0) as avg_transaction_fee_visa_mc
    FROM application_offers
    WHERE (bank_user_id_param IS NULL OR bank_user_id = bank_user_id_param);
END;
$$;


--
-- Name: set_auto_reject_on_submission(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_auto_reject_on_submission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'submitted' THEN
    NEW.auto_reject_at = NEW.submitted_at + INTERVAL '48 hours';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: trigger_update_bank_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_update_bank_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update statistics for the current month when data changes
    PERFORM calculate_bank_performance_stats(
        COALESCE(NEW.bank_user_id, OLD.bank_user_id),
        DATE_TRUNC('month', NOW())::DATE,
        (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_auto_reject_on_view(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_auto_reject_on_view() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If application is viewed, cancel auto-rejection
  IF NEW.status = 'viewed' AND OLD.status = 'submitted' THEN
    NEW.auto_reject_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_employee_logo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_employee_logo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    IF NEW.logo_url != OLD.logo_url THEN
                        UPDATE bank_employees 
                        SET logo_url = NEW.logo_url 
                        WHERE bank_user_id = NEW.user_id;
                    END IF;
                    RETURN NEW;
                END;
                $$;


--
-- Name: update_partner_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_partner_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    admin_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    mfa_enabled boolean DEFAULT false,
    mfa_secret character varying(255),
    CONSTRAINT admin_users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'read_only'::character varying])::text[])))
);


--
-- Name: admin_users_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_admin_id_seq OWNED BY public.admin_users.admin_id;


--
-- Name: application_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.application_offers (
    offer_id integer NOT NULL,
    submitted_application_id integer NOT NULL,
    bank_user_id integer,
    submitted_by_user_id integer,
    offer_comment text,
    offer_terms text,
    offer_validity_days integer DEFAULT 30,
    bank_name character varying(255),
    bank_contact_person character varying(255),
    bank_contact_email character varying(255),
    bank_contact_phone character varying(50),
    includes_hardware boolean DEFAULT false,
    includes_software boolean DEFAULT false,
    includes_support boolean DEFAULT false,
    support_hours character varying(100),
    warranty_months integer DEFAULT 0,
    pricing_tier character varying(100),
    volume_discount_threshold numeric(10,2) DEFAULT 0,
    volume_discount_percentage numeric(5,2) DEFAULT 0,
    admin_notes text,
    is_featured boolean DEFAULT false,
    featured_reason text,
    status character varying(50) DEFAULT 'submitted'::character varying,
    submitted_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone,
    uploaded_document bytea,
    uploaded_mimetype character varying(100),
    uploaded_filename character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    employee_id integer,
    approved_financing_amount numeric(15,2),
    proposed_repayment_period_months integer,
    interest_rate numeric(5,2),
    monthly_installment_amount numeric(15,2),
    grace_period_months integer,
    relationship_manager_name character varying(255),
    offer_document bytea,
    offer_document_mimetype character varying(100),
    offer_document_filename character varying(255),
    offer_document_size integer,
    offer_summary text,
    special_conditions text,
    early_payment_discount numeric(5,2),
    late_payment_penalty numeric(5,2),
    collateral_requirements text,
    processing_fee numeric(10,2),
    insurance_requirements text,
    offer_device_setup_fee numeric DEFAULT 0,
    offer_transaction_fee_mada numeric DEFAULT 0,
    offer_transaction_fee_visa_mc numeric DEFAULT 0,
    offer_settlement_time_mada integer DEFAULT 0,
    offer_settlement_time_visa_mc integer DEFAULT 0,
    settlement_time character varying,
    deal_value numeric DEFAULT 0,
    commission_rate numeric DEFAULT 0,
    commission_amount numeric DEFAULT 0,
    bank_revenue numeric DEFAULT 0,
    relationship_manager_phone character varying,
    relationship_manager_email character varying,
    accepted_at timestamp without time zone,
    offer_selection_deadline timestamp without time zone
);


--
-- Name: application_offers_offer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.application_offers_offer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: application_offers_offer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.application_offers_offer_id_seq OWNED BY public.application_offers.offer_id;


--
-- Name: bank_application_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_application_views (
    id integer NOT NULL,
    application_id integer NOT NULL,
    bank_user_id integer NOT NULL,
    bank_name character varying(255) NOT NULL,
    viewed_at timestamp without time zone DEFAULT now(),
    auction_start_time timestamp without time zone,
    time_to_open_minutes integer,
    ip_address character varying(45),
    user_agent text,
    employee_id integer
);


--
-- Name: bank_application_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_application_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_application_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_application_views_id_seq OWNED BY public.bank_application_views.id;


--
-- Name: bank_employee_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_employee_audit_log (
    log_id integer NOT NULL,
    employee_id integer NOT NULL,
    bank_user_id integer NOT NULL,
    action_type character varying(100) NOT NULL,
    action_details text,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: bank_employee_audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_employee_audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_employee_audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_employee_audit_log_log_id_seq OWNED BY public.bank_employee_audit_log.log_id;


--
-- Name: bank_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_employees (
    employee_id integer NOT NULL,
    bank_user_id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    "position" character varying(255),
    phone character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    last_login_at timestamp without time zone,
    logo_url character varying(500)
);


--
-- Name: bank_employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_employees_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_employees_employee_id_seq OWNED BY public.bank_employees.employee_id;


--
-- Name: bank_offer_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_offer_submissions (
    id integer NOT NULL,
    application_id integer NOT NULL,
    bank_user_id integer NOT NULL,
    bank_name character varying(255) NOT NULL,
    offer_id integer,
    submitted_at timestamp without time zone DEFAULT now(),
    first_viewed_at timestamp without time zone,
    time_to_submit_minutes integer,
    employee_id integer
);


--
-- Name: bank_offer_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_offer_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_offer_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_offer_submissions_id_seq OWNED BY public.bank_offer_submissions.id;


--
-- Name: bank_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_users (
    user_id integer NOT NULL,
    email character varying(255),
    credit_limit numeric(15,2) DEFAULT 1000.00,
    contact_person character varying(255),
    contact_person_number character varying(20),
    logo_url character varying(500)
);


--
-- Name: business_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_users (
    cr_national_number text NOT NULL,
    trade_name character varying NOT NULL,
    address character varying NOT NULL,
    sector character varying NOT NULL,
    cr_capital numeric,
    user_id integer NOT NULL,
    registration_status character varying NOT NULL,
    cr_number text,
    contact_info jsonb,
    store_url text,
    cash_capital numeric,
    in_kind_capital text,
    legal_form text,
    issue_date_gregorian text,
    confirmation_date_gregorian text,
    has_ecommerce boolean DEFAULT false,
    management_structure text,
    management_managers jsonb,
    avg_capital numeric(15,2),
    city character varying(255),
    activities text[],
    admin_notes text,
    is_verified boolean DEFAULT false,
    verification_date timestamp without time zone,
    contact_person character varying(255),
    contact_person_number character varying(20),
    headquarter_city_name character varying(255),
    headquarter_district_name character varying(255),
    headquarter_street_name character varying(255),
    headquarter_building_number character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT business_users_registration_status_check CHECK (((registration_status)::text = ANY ((ARRAY['active'::character varying, 'non active'::character varying])::text[])))
);


--
-- Name: pos_application; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_application (
    application_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(50) DEFAULT 'submitted'::character varying,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    uploaded_document bytea,
    own_pos_system boolean,
    trade_name character varying(255),
    cr_number character varying(50),
    cr_national_number character varying(50),
    legal_form character varying(255),
    registration_status character varying(50),
    issue_date_gregorian date,
    city character varying(255),
    activities jsonb,
    contact_info jsonb,
    has_ecommerce boolean,
    store_url text,
    cr_capital numeric(15,2),
    cash_capital numeric(15,2),
    management_structure character varying(255),
    management_managers jsonb,
    uploaded_filename text,
    uploaded_mimetype text,
    contact_person text,
    contact_person_number text,
    number_of_pos_devices integer,
    city_of_operation text,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    auction_end_time timestamp without time zone,
    offer_selection_end_time timestamp without time zone,
    business_user_id integer,
    revenue_collected numeric(10,2) DEFAULT 0,
    offers_count integer DEFAULT 0,
    admin_notes text,
    current_application_status character varying(50) DEFAULT 'live_auction'::character varying,
    purchased_by integer[] DEFAULT '{}'::integer[],
    opened_by integer[] DEFAULT '{}'::integer[],
    assigned_user_id integer,
    pos_provider_name character varying(255),
    pos_age_duration_months integer,
    avg_monthly_pos_sales numeric(15,2),
    requested_financing_amount numeric(15,2),
    preferred_repayment_period_months integer,
    updated_at timestamp without time zone DEFAULT now(),
    monthly_sales numeric(15,2) DEFAULT 0,
    financing_amount numeric(15,2) DEFAULT 0,
    repayment_period integer DEFAULT 12,
    pos_provider character varying(255),
    pos_age character varying(100),
    CONSTRAINT pos_application_status_check CHECK (((status)::text = ANY ((ARRAY['live_auction'::character varying, 'completed'::character varying, 'ignored'::character varying])::text[])))
);


--
-- Name: pos_application_application_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_application_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_application_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_application_application_id_seq OWNED BY public.pos_application.application_id;


--
-- Name: status_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_audit_log (
    log_id integer NOT NULL,
    application_id integer NOT NULL,
    from_status character varying(20) NOT NULL,
    to_status character varying(20) NOT NULL,
    admin_user_id integer NOT NULL,
    reason text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: status_audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_audit_log_log_id_seq OWNED BY public.status_audit_log.log_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying NOT NULL,
    password text NOT NULL,
    user_type character varying(50) NOT NULL,
    entity_name character varying,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    account_status character varying(20) DEFAULT 'active'::character varying,
    verification_status character varying(20) DEFAULT 'pending'::character varying,
    login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    failed_login_attempts integer DEFAULT 0,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    email_verified_at timestamp without time zone,
    phone character varying(20),
    address text,
    profile_completed boolean DEFAULT false,
    logo_url character varying(500),
    role character varying(20) DEFAULT NULL::character varying,
    permissions jsonb,
    mfa_enabled boolean DEFAULT false,
    mfa_secret character varying(255) DEFAULT NULL::character varying,
    admin_notes text,
    CONSTRAINT check_admin_role CHECK (((((user_type)::text = 'admin_user'::text) AND (role IS NOT NULL)) OR (((user_type)::text <> 'admin_user'::text) AND (role IS NULL)))),
    CONSTRAINT user_type_check CHECK (((user_type)::text = ANY ((ARRAY['business_user'::character varying, 'individual_user'::character varying, 'bank_user'::character varying, 'admin_user'::character varying, 'bank_employee'::character varying])::text[]))),
    CONSTRAINT users_account_status_check CHECK (((account_status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'pending_verification'::character varying, 'deactivated'::character varying])::text[]))),
    CONSTRAINT users_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admin_users admin_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN admin_id SET DEFAULT nextval('public.admin_users_admin_id_seq'::regclass);


--
-- Name: application_offers offer_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_offers ALTER COLUMN offer_id SET DEFAULT nextval('public.application_offers_offer_id_seq'::regclass);


--
-- Name: bank_application_views id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_application_views ALTER COLUMN id SET DEFAULT nextval('public.bank_application_views_id_seq'::regclass);


--
-- Name: bank_employee_audit_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employee_audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.bank_employee_audit_log_log_id_seq'::regclass);


--
-- Name: bank_employees employee_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employees ALTER COLUMN employee_id SET DEFAULT nextval('public.bank_employees_employee_id_seq'::regclass);


--
-- Name: bank_offer_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions ALTER COLUMN id SET DEFAULT nextval('public.bank_offer_submissions_id_seq'::regclass);


--
-- Name: pos_application application_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_application ALTER COLUMN application_id SET DEFAULT nextval('public.pos_application_application_id_seq'::regclass);


--
-- Name: status_audit_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.status_audit_log_log_id_seq'::regclass);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (admin_id);


--
-- Name: application_offers application_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_pkey PRIMARY KEY (offer_id);


--
-- Name: bank_application_views bank_application_views_application_id_bank_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_application_id_bank_user_id_key UNIQUE (application_id, bank_user_id);


--
-- Name: bank_application_views bank_application_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_pkey PRIMARY KEY (id);


--
-- Name: bank_employee_audit_log bank_employee_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employee_audit_log
    ADD CONSTRAINT bank_employee_audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: bank_employees bank_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT bank_employees_pkey PRIMARY KEY (employee_id);


--
-- Name: bank_offer_submissions bank_offer_submissions_application_id_bank_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_application_id_bank_user_id_key UNIQUE (application_id, bank_user_id);


--
-- Name: bank_offer_submissions bank_offer_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_pkey PRIMARY KEY (id);


--
-- Name: bank_users bank_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_users
    ADD CONSTRAINT bank_users_pkey PRIMARY KEY (user_id);


--
-- Name: business_users business_users_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_users
    ADD CONSTRAINT business_users_pk PRIMARY KEY (cr_national_number);


--
-- Name: pos_application pos_application_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_application
    ADD CONSTRAINT pos_application_pkey PRIMARY KEY (application_id);


--
-- Name: status_audit_log status_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_audit_log
    ADD CONSTRAINT status_audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: bank_employees uk_bank_employees_user_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT uk_bank_employees_user_id UNIQUE (user_id);


--
-- Name: users user_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pk PRIMARY KEY (user_id);


--
-- Name: idx_application_offers_bank_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_offers_bank_user_id ON public.application_offers USING btree (bank_user_id);


--
-- Name: idx_application_offers_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_offers_expires_at ON public.application_offers USING btree (expires_at);


--
-- Name: idx_application_offers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_offers_status ON public.application_offers USING btree (status);


--
-- Name: idx_application_offers_submitted_application_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_offers_submitted_application_id ON public.application_offers USING btree (submitted_application_id);


--
-- Name: idx_application_offers_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_offers_submitted_at ON public.application_offers USING btree (submitted_at);


--
-- Name: idx_application_offers_submitted_by_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_offers_submitted_by_user_id ON public.application_offers USING btree (submitted_by_user_id);


--
-- Name: idx_audit_log_bank_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_bank_user_id ON public.bank_employee_audit_log USING btree (bank_user_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created_at ON public.bank_employee_audit_log USING btree (created_at);


--
-- Name: idx_audit_log_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_employee_id ON public.bank_employee_audit_log USING btree (employee_id);


--
-- Name: idx_bank_application_views_app_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_application_views_app_id ON public.bank_application_views USING btree (application_id);


--
-- Name: idx_bank_application_views_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_application_views_bank_id ON public.bank_application_views USING btree (bank_user_id);


--
-- Name: idx_bank_application_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_application_views_viewed_at ON public.bank_application_views USING btree (viewed_at);


--
-- Name: idx_bank_employees_bank_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_employees_bank_user_id ON public.bank_employees USING btree (bank_user_id);


--
-- Name: idx_bank_employees_last_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_employees_last_login ON public.bank_employees USING btree (last_login_at);


--
-- Name: idx_bank_employees_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_employees_user_id ON public.bank_employees USING btree (user_id);


--
-- Name: idx_bank_offer_submissions_app_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_offer_submissions_app_id ON public.bank_offer_submissions USING btree (application_id);


--
-- Name: idx_bank_offer_submissions_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_offer_submissions_bank_id ON public.bank_offer_submissions USING btree (bank_user_id);


--
-- Name: idx_bank_offer_submissions_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_offer_submissions_submitted_at ON public.bank_offer_submissions USING btree (submitted_at);


--
-- Name: idx_bank_users_logo_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_users_logo_url ON public.bank_users USING btree (logo_url);


--
-- Name: idx_business_users_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_city ON public.business_users USING btree (city);


--
-- Name: idx_business_users_cr_national_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_cr_national_number ON public.business_users USING btree (cr_national_number);


--
-- Name: idx_business_users_cr_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_cr_number ON public.business_users USING btree (cr_number);


--
-- Name: idx_business_users_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_created_at ON public.business_users USING btree (created_at);


--
-- Name: idx_business_users_registration_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_registration_status ON public.business_users USING btree (registration_status);


--
-- Name: idx_business_users_trade_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_trade_name ON public.business_users USING btree (trade_name);


--
-- Name: idx_business_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_users_user_id ON public.business_users USING btree (user_id);


--
-- Name: idx_offers_financing_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_financing_amount ON public.application_offers USING btree (approved_financing_amount);


--
-- Name: idx_offers_grace_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_grace_period ON public.application_offers USING btree (grace_period_months);


--
-- Name: idx_offers_interest_rate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_interest_rate ON public.application_offers USING btree (interest_rate);


--
-- Name: idx_offers_monthly_installment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_monthly_installment ON public.application_offers USING btree (monthly_installment_amount);


--
-- Name: idx_offers_processing_fee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_processing_fee ON public.application_offers USING btree (processing_fee);


--
-- Name: idx_offers_relationship_manager; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_relationship_manager ON public.application_offers USING btree (relationship_manager_name);


--
-- Name: idx_offers_repayment_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_offers_repayment_period ON public.application_offers USING btree (proposed_repayment_period_months);


--
-- Name: idx_pos_app_auction_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_auction_end ON public.pos_application USING btree (auction_end_time);


--
-- Name: idx_pos_app_avg_monthly_sales; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_avg_monthly_sales ON public.pos_application USING btree (avg_monthly_pos_sales);


--
-- Name: idx_pos_app_current_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_current_status ON public.pos_application USING btree (current_application_status);


--
-- Name: idx_pos_app_financing_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_financing_amount ON public.pos_application USING btree (requested_financing_amount);


--
-- Name: idx_pos_app_offers_count; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_offers_count ON public.pos_application USING btree (offers_count);


--
-- Name: idx_pos_app_pos_provider_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_pos_provider_name ON public.pos_application USING btree (pos_provider_name);


--
-- Name: idx_pos_app_repayment_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_repayment_period ON public.pos_application USING btree (preferred_repayment_period_months);


--
-- Name: idx_pos_app_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_app_updated_at ON public.pos_application USING btree (updated_at);


--
-- Name: idx_pos_application_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_application_status ON public.pos_application USING btree (status);


--
-- Name: idx_pos_application_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_application_submitted_at ON public.pos_application USING btree (submitted_at);


--
-- Name: idx_pos_application_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_application_user_id ON public.pos_application USING btree (user_id);


--
-- Name: idx_status_audit_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_audit_admin ON public.status_audit_log USING btree (admin_user_id);


--
-- Name: idx_status_audit_application_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_audit_application_id ON public.status_audit_log USING btree (application_id);


--
-- Name: idx_status_audit_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_status_audit_timestamp ON public.status_audit_log USING btree ("timestamp");


--
-- Name: idx_users_account_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_account_status ON public.users USING btree (account_status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_login ON public.users USING btree (last_login_at);


--
-- Name: idx_users_logo_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_logo_url ON public.users USING btree (logo_url);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: idx_users_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_verification_status ON public.users USING btree (verification_status);


--
-- Name: bank_users update_employee_logo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_employee_logo AFTER UPDATE ON public.bank_users FOR EACH ROW EXECUTE FUNCTION public.update_employee_logo();


--
-- Name: application_offers application_offers_bank_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_bank_user_id_fkey FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: application_offers application_offers_submitted_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_submitted_application_id_fkey FOREIGN KEY (submitted_application_id) REFERENCES public.pos_application(application_id) ON DELETE CASCADE;


--
-- Name: application_offers application_offers_submitted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_submitted_by_user_id_fkey FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_application_views bank_application_views_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.pos_application(application_id) ON DELETE CASCADE;


--
-- Name: bank_application_views bank_application_views_bank_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_bank_user_id_fkey FOREIGN KEY (bank_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions bank_offer_submissions_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.pos_application(application_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions bank_offer_submissions_bank_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_bank_user_id_fkey FOREIGN KEY (bank_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions bank_offer_submissions_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.application_offers(offer_id) ON DELETE CASCADE;


--
-- Name: bank_users bank_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_users
    ADD CONSTRAINT bank_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: business_users business_users_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_users
    ADD CONSTRAINT business_users_users_fk FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: application_offers fk_application_offers_bank_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT fk_application_offers_bank_user_id FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_employee_audit_log fk_audit_log_bank; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employee_audit_log
    ADD CONSTRAINT fk_audit_log_bank FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_employee_audit_log fk_audit_log_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employee_audit_log
    ADD CONSTRAINT fk_audit_log_employee FOREIGN KEY (employee_id) REFERENCES public.bank_employees(employee_id) ON DELETE CASCADE;


--
-- Name: bank_employees fk_bank_employees_bank_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT fk_bank_employees_bank_user FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_employees fk_bank_employees_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT fk_bank_employees_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions fk_bank_offer_submissions_bank_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT fk_bank_offer_submissions_bank_user FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions fk_bank_offer_submissions_bank_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT fk_bank_offer_submissions_bank_user_id FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: pos_application pos_application_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_application
    ADD CONSTRAINT pos_application_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict WAIButQaGmsXV8Xxd91cGG4hLvSYzXLyiI2mBhygFhOyEnJGj796QZEq3ekKCC2

