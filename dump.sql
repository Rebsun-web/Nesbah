--
-- PostgreSQL database dump
--

\restrict 4qxnJCkH9kCbbzZvO5A9sol1OxzgJE0I3SA5wZFu9cWzKmbP5147BjeXohc8eMs

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
-- Name: admin_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role AS ENUM (
    'super_admin',
    'admin',
    'read_only'
);


ALTER TYPE public.admin_role OWNER TO postgres;

--
-- Name: add_bank_to_opened_by(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.add_bank_to_opened_by(app_id integer, bank_user_id integer) OWNER TO postgres;

--
-- Name: add_bank_to_purchased_by(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.add_bank_to_purchased_by(app_id integer, bank_user_id integer) OWNER TO postgres;

--
-- Name: calculate_application_windows(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.calculate_application_windows(submitted_time timestamp without time zone) OWNER TO postgres;

--
-- Name: calculate_bank_performance_stats(integer, date, date); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.calculate_bank_performance_stats(p_bank_user_id integer, p_period_start date, p_period_end date) OWNER TO postgres;

--
-- Name: calculate_offer_windows(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.calculate_offer_windows(application_window_end timestamp without time zone) OWNER TO postgres;

--
-- Name: get_bank_tracking_info(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.get_bank_tracking_info(app_id integer) OWNER TO postgres;

--
-- Name: get_commission_statistics(timestamp without time zone, timestamp without time zone, integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.get_commission_statistics(start_date timestamp without time zone, end_date timestamp without time zone, bank_user_id_param integer) OWNER TO postgres;

--
-- Name: get_offer_statistics(integer); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.get_offer_statistics(bank_user_id_param integer) OWNER TO postgres;

--
-- Name: set_auto_reject_on_submission(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.set_auto_reject_on_submission() OWNER TO postgres;

--
-- Name: trigger_update_bank_stats(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.trigger_update_bank_stats() OWNER TO postgres;

--
-- Name: update_auto_reject_on_view(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.update_auto_reject_on_view() OWNER TO postgres;

--
-- Name: update_employee_logo(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.update_employee_logo() OWNER TO postgres;

--
-- Name: update_partner_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_partner_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_partner_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: admin_users_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_users_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_users_admin_id_seq OWNER TO postgres;

--
-- Name: admin_users_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_users_admin_id_seq OWNED BY public.admin_users.admin_id;


--
-- Name: application_offers; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.application_offers OWNER TO postgres;

--
-- Name: application_offers_offer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.application_offers_offer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.application_offers_offer_id_seq OWNER TO postgres;

--
-- Name: application_offers_offer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.application_offers_offer_id_seq OWNED BY public.application_offers.offer_id;


--
-- Name: bank_application_views; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.bank_application_views OWNER TO postgres;

--
-- Name: bank_application_views_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_application_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_application_views_id_seq OWNER TO postgres;

--
-- Name: bank_application_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_application_views_id_seq OWNED BY public.bank_application_views.id;


--
-- Name: bank_employee_audit_log; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.bank_employee_audit_log OWNER TO postgres;

--
-- Name: bank_employee_audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_employee_audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_employee_audit_log_log_id_seq OWNER TO postgres;

--
-- Name: bank_employee_audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_employee_audit_log_log_id_seq OWNED BY public.bank_employee_audit_log.log_id;


--
-- Name: bank_employees; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.bank_employees OWNER TO postgres;

--
-- Name: bank_employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_employees_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_employees_employee_id_seq OWNER TO postgres;

--
-- Name: bank_employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_employees_employee_id_seq OWNED BY public.bank_employees.employee_id;


--
-- Name: bank_offer_submissions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.bank_offer_submissions OWNER TO postgres;

--
-- Name: bank_offer_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_offer_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_offer_submissions_id_seq OWNER TO postgres;

--
-- Name: bank_offer_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_offer_submissions_id_seq OWNED BY public.bank_offer_submissions.id;


--
-- Name: bank_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_users (
    user_id integer NOT NULL,
    email character varying(255),
    credit_limit numeric(15,2) DEFAULT 1000.00,
    contact_person character varying(255),
    contact_person_number character varying(20),
    logo_url character varying(500)
);


ALTER TABLE public.bank_users OWNER TO postgres;

--
-- Name: business_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_users (
    cr_national_number text NOT NULL,
    user_id integer NOT NULL,
    admin_notes text,
    is_verified boolean DEFAULT false,
    verification_date timestamp without time zone,
    contact_person character varying(255),
    contact_person_number character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    wathiq_data_id integer
);


ALTER TABLE public.business_users OWNER TO postgres;

--
-- Name: pos_application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pos_application (
    application_id integer NOT NULL,
    user_id integer,
    status character varying(50) DEFAULT 'submitted'::character varying,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    uploaded_document bytea,
    own_pos_system boolean,
    cr_national_number character varying(50),
    activities jsonb,
    contact_info jsonb,
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
    financing_type character varying(100) DEFAULT 'pos'::character varying,
    reference_number character varying(50),
    sector text,
    business_contact_email text,
    approximate_financing_amount text,
    wathiq_data_id integer,
    CONSTRAINT pos_application_status_check CHECK (((status)::text = ANY ((ARRAY['live_auction'::character varying, 'completed'::character varying, 'ignored'::character varying])::text[])))
);


ALTER TABLE public.pos_application OWNER TO postgres;

--
-- Name: pos_application_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pos_application_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_application_application_id_seq OWNER TO postgres;

--
-- Name: pos_application_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pos_application_application_id_seq OWNED BY public.pos_application.application_id;


--
-- Name: status_audit_log; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.status_audit_log OWNER TO postgres;

--
-- Name: status_audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.status_audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_audit_log_log_id_seq OWNER TO postgres;

--
-- Name: status_audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.status_audit_log_log_id_seq OWNED BY public.status_audit_log.log_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
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
-- Name: wathiq_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wathiq_data (
    id integer NOT NULL,
    cr_national_number text NOT NULL,
    cr_number text,
    trade_name text,
    legal_form text,
    registration_status text,
    issue_date_gregorian text,
    confirmation_date_gregorian text,
    city text,
    headquarter_district_name text,
    headquarter_street_name text,
    headquarter_building_number text,
    has_ecommerce boolean DEFAULT false NOT NULL,
    store_url text,
    cr_capital numeric(15,2),
    cash_capital numeric(15,2),
    in_kind_capital numeric(15,2),
    avg_capital numeric(15,2),
    management_structure text,
    management_managers jsonb,
    activities text[],
    contact_info jsonb,
    sector text,
    is_verified boolean DEFAULT false NOT NULL,
    verification_date timestamp with time zone,
    admin_notes text,
    wathiq_raw jsonb,
    wathiq_fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wathiq_data OWNER TO postgres;

--
-- Name: v_application_full; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_application_full AS
 SELECT pa.application_id,
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
   FROM (public.pos_application pa
     LEFT JOIN public.wathiq_data wd ON ((wd.cr_national_number = (pa.cr_national_number)::text)));


ALTER VIEW public.v_application_full OWNER TO postgres;

--
-- Name: wathiq_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wathiq_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wathiq_data_id_seq OWNER TO postgres;

--
-- Name: wathiq_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wathiq_data_id_seq OWNED BY public.wathiq_data.id;


--
-- Name: admin_users admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN admin_id SET DEFAULT nextval('public.admin_users_admin_id_seq'::regclass);


--
-- Name: application_offers offer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_offers ALTER COLUMN offer_id SET DEFAULT nextval('public.application_offers_offer_id_seq'::regclass);


--
-- Name: bank_application_views id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_application_views ALTER COLUMN id SET DEFAULT nextval('public.bank_application_views_id_seq'::regclass);


--
-- Name: bank_employee_audit_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employee_audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.bank_employee_audit_log_log_id_seq'::regclass);


--
-- Name: bank_employees employee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employees ALTER COLUMN employee_id SET DEFAULT nextval('public.bank_employees_employee_id_seq'::regclass);


--
-- Name: bank_offer_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions ALTER COLUMN id SET DEFAULT nextval('public.bank_offer_submissions_id_seq'::regclass);


--
-- Name: pos_application application_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_application ALTER COLUMN application_id SET DEFAULT nextval('public.pos_application_application_id_seq'::regclass);


--
-- Name: status_audit_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.status_audit_log_log_id_seq'::regclass);


--
-- Name: wathiq_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wathiq_data ALTER COLUMN id SET DEFAULT nextval('public.wathiq_data_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (admin_id, email, password_hash, full_name, role, permissions, is_active, last_login, created_at, updated_at, mfa_enabled, mfa_secret) FROM stdin;
6	readonly@nesbah.com	$2b$12$i2B9Nt/sknIXyymT4KF5QeiLjwGjaRKl9TogDmPnZcaoxbtZrnAwm	Read Only User	read_only	{"view_revenue": true, "view_applications": true}	t	2025-08-20 18:38:39.845654	2025-08-20 18:38:16.682224	2025-08-20 18:38:16.682224	f	\N
1	admin@nesbah.com	$2b$12$56kmM4sAn0m6z5lJKff2tu7PfZ8jH1zO8qc88I.ntf6p7o1gWrzZ6	System Administrator	super_admin	{"all_permissions": true}	t	2025-08-31 19:30:40.078889	2025-08-20 17:26:52.639644	2025-08-20 17:26:52.639644	f	testsecret123456789
\.


--
-- Data for Name: application_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_offers (offer_id, submitted_application_id, bank_user_id, submitted_by_user_id, offer_comment, offer_terms, offer_validity_days, bank_name, bank_contact_person, bank_contact_email, bank_contact_phone, includes_hardware, includes_software, includes_support, support_hours, warranty_months, pricing_tier, volume_discount_threshold, volume_discount_percentage, admin_notes, is_featured, featured_reason, status, submitted_at, expires_at, uploaded_document, uploaded_mimetype, uploaded_filename, created_at, updated_at, employee_id, approved_financing_amount, proposed_repayment_period_months, interest_rate, monthly_installment_amount, grace_period_months, relationship_manager_name, offer_document, offer_document_mimetype, offer_document_filename, offer_document_size, offer_summary, special_conditions, early_payment_discount, late_payment_penalty, collateral_requirements, processing_fee, insurance_requirements, offer_device_setup_fee, offer_transaction_fee_mada, offer_transaction_fee_visa_mc, offer_settlement_time_mada, offer_settlement_time_visa_mc, settlement_time, deal_value, commission_rate, commission_amount, bank_revenue, relationship_manager_phone, relationship_manager_email, accepted_at, offer_selection_deadline) FROM stdin;
\.


--
-- Data for Name: bank_application_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_application_views (id, application_id, bank_user_id, bank_name, viewed_at, auction_start_time, time_to_open_minutes, ip_address, user_agent, employee_id) FROM stdin;
\.


--
-- Data for Name: bank_employee_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_employee_audit_log (log_id, employee_id, bank_user_id, action_type, action_details, ip_address, user_agent, created_at) FROM stdin;
1	1	737	account_created	Bank employee account created by admin for saudinationalbankemployee@nesbah.com	::1	\N	2025-08-31 16:10:37.536341
2	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 16:22:51.227249
3	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 16:24:59.545352
4	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 16:26:45.340932
5	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 16:29:23.580284
6	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 16:35:14.610881
7	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 16:42:52.429368
8	1	737	login	Bank employee logged in successfully	::1	\N	2025-08-31 17:45:06.847733
9	2	1010	account_created	Bank employee account created by admin for pavel@nikitabank.com	::1	\N	2025-09-03 18:45:28.9466
10	3	1010	account_created	Bank employee account created by admin for employee_nikitabank@nesbah.com	::1	\N	2025-09-09 22:47:16.32814
11	4	1030	account_created	Bank employee account created by admin for mrmohammed@almonajem.com	2001:16a2:c093:61ff:b5c0:3f3c:9097:9a15	\N	2025-09-11 12:18:26.718241
12	5	1103	account_created	Bank employee account created by admin for yurikac@tbank.com	::1	\N	2025-12-04 23:51:47.855965
\.


--
-- Data for Name: bank_employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_employees (employee_id, bank_user_id, user_id, first_name, last_name, "position", phone, created_at, last_login_at, logo_url) FROM stdin;
1	737	1004	Nikita	Voronkin	engineer	0653470566	2025-08-31 16:10:37.536341	2025-09-08 20:29:35.427233	/uploads/bank-logos/bank-logo-1756922571575-afv6xyug6vf.jpg
3	1010	1019	Arkad	Teststss	QA	8977070709	2025-09-09 22:47:16.32814	\N	\N
2	1010	1012	Pavels	Smal	Relation Manager	8912387834	2025-09-03 18:45:28.9466	2025-09-11 13:01:09.44959	/uploads/bank-logos/bank-logo-1757457173097-ue21aaxix3f.jpg
5	1103	1104	Yuri	Kac	business developement	+96042985425	2025-12-04 23:51:47.855965	2025-12-05 00:25:19.603982	\N
4	1030	1032	Mostafa	Mohammed	md	+966556099381	2025-09-11 12:18:26.718241	2025-09-11 12:19:42.542926	/uploads/bank-logos/bank-logo-1764934087066-ze31h5h0nb.png
\.


--
-- Data for Name: bank_offer_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_offer_submissions (id, application_id, bank_user_id, bank_name, offer_id, submitted_at, first_viewed_at, time_to_submit_minutes, employee_id) FROM stdin;
\.


--
-- Data for Name: bank_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_users (user_id, email, credit_limit, contact_person, contact_person_number, logo_url) FROM stdin;
737	bank@nesbah.com	50000.00	Mohammed Al-Zahrani	+966502345678	/uploads/bank-logos/bank-logo-1756922571575-afv6xyug6vf.jpg
1010	bank2@nesbah.com	10000.00	Yuoseff	989897987	/uploads/bank-logos/bank-logo-1757457173097-ue21aaxix3f.jpg
1060	husam.saati@digitalpay.sa	10000000.00	Hussam Saati	+966557977780	\N
1061	dana.hamdi@digitalpay.sa	1000000000.00	Dana Hamdi	+966557977780	/uploads/bank-logos/bank-logo-1764932295405-kophqkajrwq.png
1103	TBank@tbank.com	10000.00	Rasul	+9663428424	/uploads/bank-logos/bank-logo-1764932332416-73hmrpn15ny.png
1062	ziad.hilabi@digitalpay	100000000.00	Ziad hilabi	+966557977780	/uploads/bank-logos/bank-logo-1764932877294-fkz6d3suzn6.png
1030	mrmostafaspa@gmail.com	1000000.00	Mostafa Mohammed	+966543445454	/uploads/bank-logos/bank-logo-1764934087066-ze31h5h0nb.png
1106	voronkin.nikita@inbox.ru	10000.00	nik	9897897	\N
\.


--
-- Data for Name: business_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_users (cr_national_number, user_id, admin_notes, is_verified, verification_date, contact_person, contact_person_number, created_at, updated_at, wathiq_data_id) FROM stdin;
7024009669	1101	\N	t	2025-11-15 09:50:35.078	\N	\N	2025-11-15 09:50:35.078	2025-11-15 09:50:35.078	1
7025147799	1102	Registration Status: Active | Issue Date: 2022-12-31 | Has E-commerce Activities: Yes | Management Team: 1 members	t	2025-12-04 20:43:28.009			2025-12-04 23:43:28.646227	2025-12-04 23:47:09.69454	3
7000025036	1105	\N	t	2025-12-04 21:43:00.833	\N	\N	2025-12-04 21:43:00.833	2025-12-04 21:43:00.833	5
7009089074	1083	Registration Status: Active | Issue Date: 2015-03-30 | Management Team: 1 members	t	2025-10-20 12:41:14.905	\N	\N	2025-10-20 15:41:14.947574	2025-10-20 15:41:14.947574	2
7000025333	1020	Registration Status: Active | Legal Form: Joint stock company | Issue Date: 1989-09-04 | Management Team: 11 members	t	2025-09-09 22:55:29.936	\N	\N	2025-09-09 22:55:30.824728	2025-09-09 22:55:30.824728	4
\.


--
-- Data for Name: pos_application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pos_application (application_id, user_id, status, submitted_at, notes, uploaded_document, own_pos_system, cr_national_number, activities, contact_info, management_managers, uploaded_filename, uploaded_mimetype, contact_person, contact_person_number, number_of_pos_devices, city_of_operation, verification_status, auction_end_time, offer_selection_end_time, business_user_id, revenue_collected, offers_count, admin_notes, current_application_status, purchased_by, opened_by, assigned_user_id, pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales, requested_financing_amount, preferred_repayment_period_months, updated_at, financing_type, reference_number, sector, business_contact_email, approximate_financing_amount, wathiq_data_id) FROM stdin;
64	\N	ignored	2026-04-18 17:13:22.762	test	\N	\N	7051664865	\N	\N	\N	\N	\N	test	0583465745	\N	test	verified	2026-04-20 17:13:22.762	\N	\N	0.00	0	\N	ignored	{}	{}	\N	\N	\N	\N	\N	\N	2026-04-20 17:17:39.924876	business	NSB-1776532402762-6LTC6	test	test	Less than 250K SAR	6
65	\N	ignored	2026-04-18 20:36:41.915	frewf	\N	\N	7032786472	\N	\N	\N	\N	\N	test13	055376876	\N	test13	verified	2026-04-20 20:36:41.915	\N	\N	0.00	0	\N	ignored	{}	{}	\N	\N	\N	\N	\N	\N	2026-04-20 20:37:40.592591	expansion	NSB-1776544601915-L0VLJ	test13	test13	250K – 1M SAR	11
66	\N	ignored	2026-04-19 11:33:09.92	testtest	\N	\N	7000000000	\N	\N	\N	\N	\N	testtest	testtest	\N	testtest	verified	2026-04-21 11:33:09.92	\N	\N	0.00	0	\N	ignored	{}	{}	\N	\N	\N	\N	\N	\N	2026-04-21 11:37:40.663953	equipment	NSB-1776598389920-ILQTS	testtest	testtest	250K – 1M SAR	7
\.


--
-- Data for Name: status_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status_audit_log (log_id, application_id, from_status, to_status, admin_user_id, reason, "timestamp") FROM stdin;
625	65	live_auction	ignored	1	Auction expired without offers	2026-04-20 20:37:40.592591
626	66	live_auction	ignored	1	Auction expired without offers	2026-04-21 11:37:40.663953
7	7	unknown	live_auction	1008	Admin direct update	2025-09-02 23:39:28.886137
8	7	unknown	live_auction	1008	Admin direct update	2025-09-02 23:48:16.573909
9	7	completed	live_auction	1	Automated status consistency fix	2025-09-03 15:39:02.824144
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, password, user_type, entity_name, last_login_at, created_at, updated_at, account_status, verification_status, login_attempts, locked_until, failed_login_attempts, password_reset_token, password_reset_expires, email_verified_at, phone, address, profile_completed, logo_url, role, permissions, mfa_enabled, mfa_secret, admin_notes) FROM stdin;
1105	business_7000025036@nesbah.com	$2b$10$6.VEBXY18Dp4PdmZZ6Expu2dixMiBYaM1j1xd/X1dDz9oDRQd/KTG	business_user	الجمعية التعاونية متعددة الأغراض بمحافظة المجمعة	\N	2025-12-05 00:43:00.796425	2025-12-05 00:43:00.796425	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1103	TBank@tbank.com	$2b$10$fQ513aXfwvMxmdz0OywruOvPlCXvkyYPJ.vJvhTx9gtMSO9CvVzI2	bank_user	tbank	\N	2025-12-04 23:49:05.698122	2025-12-04 23:50:14.511353	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1020	business_7000025333@nesbah.com	$2b$10$v8JKpMvFp5JuA1/nbHYZluHuMdwvPPfHoSLOnn8fCwDyYyTAOKmdK	business_user	البنك السعودي الفرنسي	\N	2025-09-09 22:55:30.824728	2025-09-09 23:34:02.45612	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1030	mrmostafaspa@gmail.com	$2b$10$vJbxJVUAJxr5gSFjSGXim.Fqj1cq9GykMwxOvkb3s45nMLIRdA34K	bank_user	spab 	\N	2025-09-11 12:13:38.918941	2025-09-11 12:13:38.918941	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1019	employee_nikitabank@nesbah.com	$2b$10$.IDa1nAHlHQCctyLwv4k4uGzni6Pb4Fy7uMyZOnoh5UE.cyg84VHK	bank_employee	Nikitabank	\N	2025-09-09 22:47:16.32814	2025-09-09 22:47:16.32814	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1033	testsimple1@nesbah.com	$2b$10$test.hash.for.testing.purposes.only	business_user	Test Company 1	\N	2025-09-20 16:07:16.662607	2025-09-20 16:07:16.662607	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1106	voronkin.nikita@inbox.ru	$2b$10$H29vDdsUI4SWb.m2x1N0t.osI/8aSvQ2kd36m11fXhRLPtEIyuKn2	bank_user	trialtrial	\N	2026-04-17 00:02:19.168629	2026-04-17 00:02:19.168629	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1060	husam.saati@digitalpay.sa	$2b$10$vdb7rBalDtBCGGKSEI0VsuTgIV0HdTxI9cmMDob0ilRwYtM6GpnBW	bank_user	DigitalPay	\N	2025-10-09 15:54:10.118636	2025-10-23 12:21:09.008125	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	/uploads/bank-logos/bank-logo-1756330657844-tze98c31yl9.png	\N	\N	f	\N	\N
1101	adelmzahrani@hotmail.com	$2b$10$ZOR0TeCUNwLISl57vuzQ4e5VS/J5KO0oAvsfdmFkKT4xvj0uovE9W	business_user	مطاعم فناء قرطبة لتقديم الوجبات	\N	2025-11-15 12:50:34.937768	2025-11-15 12:50:34.937768	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1102	test@testtest.com	$2b$10$ZsiaZ958ARRpYd95t7HmYe8/Ihyj.bdQndygakdHmefQlO4MKPyd2	business_user	مؤسسة تركي عبدالله تركي العصيمي التجارية	\N	2025-12-04 23:43:28.646227	2025-12-05 00:15:21.605065	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1004	saudinationalbankemployee@nesbah.com	$2b$10$mdeRPUv14WWGEINleA1i7.SgGrFWu./H2WGGqjw7XoY9LsodzYLg6	bank_employee	Saudi National Bank	\N	2025-08-31 16:10:37.536341	2025-08-31 16:10:37.536341	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1007	readonly@nesbah.com	$2b$12$i2B9Nt/sknIXyymT4KF5QeiLjwGjaRKl9TogDmPnZcaoxbtZrnAwm	admin_user	Read Only User	\N	2025-09-02 08:19:40.891992	2025-09-02 08:19:40.891992	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	read_only	{"view_revenue": true, "view_applications": true}	f	\N	\N
1104	yurikac@tbank.com	$2b$10$.AJuIgPxw.yj6.ts9fe6l.we36sUZ43gbcN3xMEChw5iEzMDSWjG.	bank_employee	tbank	\N	2025-12-04 23:51:47.855965	2025-12-05 00:24:12.788557	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
634	admin@test.com	$2b$10$CG4N.qGeKNYLQwnHcMoRL./bJddny/WYQ5qwmJaTVrJ.GIE3gmh/2	admin_user	\N	\N	2025-08-20 16:52:09.365403	2025-08-20 16:52:09.365403	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	admin	\N	f	\N	\N
1061	dana.hamdi@digitalpay.sa	$2b$10$c/BOV548OW.GWIAymwBcZeRl39b5e4MiorJPIeKI7EiKVUjnlDROy	bank_user	DigitalPay	\N	2025-10-09 15:57:21.968766	2025-10-22 12:59:26.426157	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	/uploads/bank-logos/bank-logo-1761161094218-j616mv3pjjr.png	\N	\N	f	\N	\N
1062	ziad.hilabi@digitalpay.sa	$2b$10$vA7pL3tXJeMSb2wxrju/r.5LN1jZ6HRWRMBLkEVkUSTqTgERUsq1m	bank_user	DigitalPay	\N	2025-10-09 15:59:28.390041	2025-10-23 12:43:28.657204	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1032	mrmohammed@almonajem.com	$2b$10$yna8AQuqDp4AhiyRjwTwYeFH0dfbfKBedj2S1dL68vO9.X6uadkCS	bank_employee	spab 	\N	2025-09-11 12:18:26.718241	2025-09-11 12:18:26.718241	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1083	Aaa@nesbah.com	$2b$10$ZQ5r/Z61sS15CbaKHgvWcO1CPWnu.aGO2ZiW2sdYC55AaYBkDldhC	business_user	فرع شركة نايت فرانك ميدل ايست المحدودة	\N	2025-10-20 15:41:14.947574	2025-10-20 15:44:07.10306	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1034	testsimple1@nesbah.com	$2b$10$test.hash.for.testing.purposes.only	business_user	Test Company 1	\N	2025-09-20 16:07:47.147249	2025-09-20 16:07:47.147249	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
1008	admin@nesbah.com	$2b$12$56kmM4sAn0m6z5lJKff2tu7PfZ8jH1zO8qc88I.ntf6p7o1gWrzZ6	admin_user	System Administrator	2026-04-20 10:39:28.716623	2025-09-02 08:19:40.891992	2025-09-21 22:09:57.595453	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	super_admin	{"all_permissions": true}	f	ERKEIRS6F44HUTRBKRGVAP3PONYVGT3TO54VUW2TPM7DORKGG5KQ	\N
1010	bank2@nesbah.com	$2b$10$TI2JqkvKXbIF55o2AguWAObc0CDFKQbpcOTElu4Qf2OmgWTrwVQq6	bank_user	Nikitabank	\N	2025-09-03 18:13:55.078347	2025-09-09 15:42:10.654038	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
737	bank@nesbah.com	$2b$10$SuauakFuBNBcFHq0RshpL.mba7omSL.A5LxJxaINpi8ldVQtb5S7C	bank_user	Saudi National Bank	\N	2025-08-27 08:41:41.943145	2025-08-27 08:41:41.943145	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	/uploads/bank-logos/bank-logo-1756331767560-9l40upwweq.png	\N	\N	f	\N	\N
1012	pavel@nikitabank.com	$2b$10$NS0x4PIKfx2g58t9ZuanW.eiCcO7qSSJPsgMOoDvr3IXe.P9Bsk9S	bank_employee	Nikitabank	\N	2025-09-03 18:45:28.9466	2025-09-09 15:43:04.024722	active	pending	0	\N	0	\N	\N	\N	\N	\N	f	\N	\N	\N	f	\N	\N
\.


--
-- Data for Name: wathiq_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wathiq_data (id, cr_national_number, cr_number, trade_name, legal_form, registration_status, issue_date_gregorian, confirmation_date_gregorian, city, headquarter_district_name, headquarter_street_name, headquarter_building_number, has_ecommerce, store_url, cr_capital, cash_capital, in_kind_capital, avg_capital, management_structure, management_managers, activities, contact_info, sector, is_verified, verification_date, admin_notes, wathiq_raw, wathiq_fetched_at, created_at, updated_at) FROM stdin;
1	7024009669	4032250874	مطاعم فناء قرطبة لتقديم الوجبات	Establishment	active	2021-07-13	2026-06-09	AT TAIF	\N	\N	\N	f	\N	5000.00	\N	\N	\N	One or More Managers	["MUHANNAD ADEL MOHAMMED ALZAHRANI"]	{"Restaurants with service","Fast-food restaurants (including pizza)","eating places  Take -out","Coffee shops","Fresh juice and cold beverages serving"}	{"email": "adelmzahrani@hotmail.com"}	Restaurants with service, Fast-food restaurants (including pizza), eating places  Take -out, Coffee shops, Fresh juice and cold beverages serving	t	2025-11-15 09:50:35.078+00	\N	\N	2025-11-15 09:50:35.078+00	2025-11-15 09:50:35.078+00	2025-11-15 09:50:35.078+00
2	7009089074	1010432042	فرع شركة نايت فرانك ميدل ايست المحدودة	Foreign Company Branch	active	2015-03-30	2026-07-20	RIYADH	\N	\N	\N	f	\N	2000000.00	\N	\N	\N	One or More Managers	["تريو ستيفن لونغمير"]	{"remodeling or renovating existing residential and non residential structures","Building finishing","designing and programming special software","activities of real estate agents and brokers","property management","Public relations and communication","Providing higher management consulting services","building inspection services","providing services of energy design review","providing services of engineering design for energy efficiency standards","Inspection of electrical, mechanical and electronic manufacturing systems","Provision of marketing services on behalf of others","provision of maintenance services within facilities"}	{"email": "a.tubayri@stamp.sa"}	remodeling or renovating existing residential and non residential structures, Building finishing, designing and programming special software, activities of real estate agents and brokers, property management, Public relations and communication, Providing higher management consulting services, building inspection services, providing services of energy design review, providing services of engineering design for energy efficiency standards, Inspection of electrical, mechanical and electronic manufacturing systems, Provision of marketing services on behalf of others, provision of maintenance services within facilities	t	2025-10-20 12:41:14.905+00	Registration Status: Active | Issue Date: 2015-03-30 | Management Team: 1 members	\N	2025-10-20 15:41:14.947574+00	2025-10-20 15:41:14.947574+00	2025-10-20 15:41:14.947574+00
3	7025147799	1010850978	مؤسسة تركي عبدالله تركي العصيمي التجارية	Establishment	active	2022-12-31	2025-12-31	RIYADH	\N	\N	\N	t		5000.00	\N	\N	\N	Manager	["TURKI ABDULLAH TURKI ALOSAIMI"]	{"Retail sale of mobile phones' accessories!"}	{"email": "Ta559988@gmail.com"}	Retail sale of mobile phones' accessories	t	2025-12-04 20:43:28.009+00	Registration Status: Active | Issue Date: 2022-12-31 | Has E-commerce Activities: Yes | Management Team: 1 members	\N	2025-12-04 23:43:28.646227+00	2025-12-04 23:43:28.646227+00	2025-12-04 23:47:09.69454+00
4	7000025333	1010073368	البنك السعودي الفرنسي	Joint stock company	active	1989-09-04	2025-11-09	RIYADH	\N	\N	\N	f	\N	25000000000.00	25000000000.00	\N	25000000000.00	Governing Council	["MAZIN ABDULRAZZAK S ALROMAIH", "ABDULRAHMAN RASHED A ALRASHED", "TALAL IBRAHIM A ALMAIMAN", "KHALID MALIK R ALSHARIF", "BADER ABDULLAH M ALISSA", "ABDULATIF AHMAD A ALOTHMAN", "KHALID OMRAN M ALOMRAN", "RAYAN MOHAMMED H FAYEZ", "ABDULAZIZ MOHAMMED H ALJUDAIMI", "ABDULMAJID AHMED S ALHAGBANI", "BADER HAMAD I ALSALLOOM"]	{"National (local) commercial banks","Providing smart, secure, electronic payment services for sale points and outlets ATM Cash ,Deposit Machines"}	{"email": "Mazin@bsf.sa"}	National (local) commercial banks, Providing smart, secure, electronic payment services for sale points and outlets ATM Cash ,Deposit Machines	t	2025-09-09 22:55:29.936+00	Registration Status: Active | Legal Form: Joint stock company | Issue Date: 1989-09-04 | Management Team: 11 members	\N	2025-09-09 22:55:30.824728+00	2025-09-09 22:55:30.824728+00	2025-09-09 22:55:30.824728+00
5	7000025036	1122101585	الجمعية التعاونية متعددة الأغراض بمحافظة المجمعة	Establishment	active	2018-03-22	2025-11-22	AL MAJMA'AH	\N	\N	\N	f	\N	1507200.00	\N	\N	\N	Manager	["عبدالرحمن بن محمد بن ناصر التويجري"]	{"Drying and packing dates and manufacture of their products",Cooperatives,"Supermarkets for food and consumer goods","Retail sale of bottled gas","Public storages with a variety of goods","other activities of universities"}	{"email": "غير محدد"}	Drying and packing dates and manufacture of their products, Cooperatives, Supermarkets for food and consumer goods, Retail sale of bottled gas, Public storages with a variety of goods, other activities of universities	t	2025-12-04 21:43:00.833+00	\N	\N	2025-12-04 21:43:00.833+00	2025-12-04 21:43:00.833+00	2025-12-04 21:43:00.833+00
7	7000000000	1011023081	مؤسسة نوره طالع المطيري للمقاولات	Establishment	deleted	2014-12-19	2025-04-03	AL KHARJ	\N	\N	\N	f	\N	25000.00	\N	\N	\N	Manager	[]	{}	{"email": "غير محدد"}	testtest	t	2026-04-19 11:33:11.035553+00	\N	\N	2026-04-19 11:33:11.035553+00	2026-04-16 20:59:28.513625+00	2026-04-19 11:33:11.035553+00
6	7051664865	\N	nisbat aljumla Company Commercial	Limited liability company	active	2025-09-19	2026-09-18	RIYADH	\N	\N	\N	f	\N	5000.00	5000.00	0.00	5000.00	Manager	["RAKAN ADNAN SULAIMAN FADHEL"]	{"Wholesale of oleaginous fruits","Wholesale of flowers","Wholesale of indoor plants","Wholesale of agricultural Seedlings","Wholesale of birds","Wholesale of sheep","Wholesale of cows","Wholesale of fruit","Wholesale of vegetables","Wholesale of dates","Wholesale of dairy products","Wholesale of eggs and egg products","Wholesale of edible oils of vegetable origin","Wholesale of meat products","Wholesale of fishery products","Wholesale of chocolate and cocoa","Wholesale of coffee and tea products","Wholesale of spices","Wholesale of honey","Wholesale of bakery products","Wholesale of bottled water","Wholesale of soft drinks and juices","Wholesale of desalinated water","Wholesale of food & beverage"}	{"email": "rakan@qiratven.com"}	Wholesale of oleaginous fruits, Wholesale of flowers, Wholesale of indoor plants, Wholesale of agricultural Seedlings, Wholesale of birds, Wholesale of sheep, Wholesale of cows, Wholesale of fruit, Wholesale of vegetables, Wholesale of dates, Wholesale of dairy products, Wholesale of eggs and egg products, Wholesale of edible oils of vegetable origin, Wholesale of meat products, Wholesale of fishery products, Wholesale of chocolate and cocoa, Wholesale of coffee and tea products, Wholesale of spices, Wholesale of honey, Wholesale of bakery products, Wholesale of bottled water, Wholesale of soft drinks and juices, Wholesale of desalinated water, Wholesale of food & beverage	t	2026-04-18 17:13:22.990337+00	\N	\N	2026-04-18 17:13:22.990337+00	2026-04-16 13:36:39.349+00	2026-04-18 17:13:22.990337+00
11	7032786472	1131326434	Khadmah Masar Almusafir Laundry for clothes Establishment	Establishment	active	2023-02-01	2026-02-01	BURAIDAH	\N	\N	\N	f	\N	5000.00	\N	\N	\N	One or More Managers	["HASNA FADHEL NAFIL ALHARBI"]	{"Washing, ironing, dry-cleaning of all kind of clothes including fur and textiles, and laundry collection and delivery services"}	{"email": "alngore3@gmail.com"}	Washing, ironing, dry-cleaning of all kind of clothes including fur and textiles, and laundry collection and delivery services	t	2026-04-18 20:36:42.134667+00	\N	\N	2026-04-18 20:36:42.134667+00	2026-04-18 20:36:42.134667+00	2026-04-18 20:36:42.134667+00
\.


--
-- Name: admin_users_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_users_admin_id_seq', 11, true);


--
-- Name: application_offers_offer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.application_offers_offer_id_seq', 58, true);


--
-- Name: bank_application_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_application_views_id_seq', 12, true);


--
-- Name: bank_employee_audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_employee_audit_log_log_id_seq', 12, true);


--
-- Name: bank_employees_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_employees_employee_id_seq', 5, true);


--
-- Name: bank_offer_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_offer_submissions_id_seq', 15, true);


--
-- Name: pos_application_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pos_application_application_id_seq', 66, true);


--
-- Name: status_audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.status_audit_log_log_id_seq', 626, true);


--
-- Name: user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_user_id_seq', 1106, true);


--
-- Name: wathiq_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wathiq_data_id_seq', 12, true);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (admin_id);


--
-- Name: application_offers application_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_pkey PRIMARY KEY (offer_id);


--
-- Name: bank_application_views bank_application_views_application_id_bank_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_application_id_bank_user_id_key UNIQUE (application_id, bank_user_id);


--
-- Name: bank_application_views bank_application_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_pkey PRIMARY KEY (id);


--
-- Name: bank_employee_audit_log bank_employee_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employee_audit_log
    ADD CONSTRAINT bank_employee_audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: bank_employees bank_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT bank_employees_pkey PRIMARY KEY (employee_id);


--
-- Name: bank_offer_submissions bank_offer_submissions_application_id_bank_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_application_id_bank_user_id_key UNIQUE (application_id, bank_user_id);


--
-- Name: bank_offer_submissions bank_offer_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_pkey PRIMARY KEY (id);


--
-- Name: bank_users bank_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_users
    ADD CONSTRAINT bank_users_pkey PRIMARY KEY (user_id);


--
-- Name: business_users business_users_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_users
    ADD CONSTRAINT business_users_pk PRIMARY KEY (cr_national_number);


--
-- Name: pos_application pos_application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_application
    ADD CONSTRAINT pos_application_pkey PRIMARY KEY (application_id);


--
-- Name: status_audit_log status_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_audit_log
    ADD CONSTRAINT status_audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: bank_employees uk_bank_employees_user_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT uk_bank_employees_user_id UNIQUE (user_id);


--
-- Name: pos_application uq_pos_application_cr_national_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_application
    ADD CONSTRAINT uq_pos_application_cr_national_number UNIQUE (cr_national_number);


--
-- Name: users user_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pk PRIMARY KEY (user_id);


--
-- Name: wathiq_data wathiq_data_cr_national_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wathiq_data
    ADD CONSTRAINT wathiq_data_cr_national_number_key UNIQUE (cr_national_number);


--
-- Name: wathiq_data wathiq_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wathiq_data
    ADD CONSTRAINT wathiq_data_pkey PRIMARY KEY (id);


--
-- Name: idx_application_offers_bank_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_application_offers_bank_user_id ON public.application_offers USING btree (bank_user_id);


--
-- Name: idx_application_offers_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_application_offers_expires_at ON public.application_offers USING btree (expires_at);


--
-- Name: idx_application_offers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_application_offers_status ON public.application_offers USING btree (status);


--
-- Name: idx_application_offers_submitted_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_application_offers_submitted_application_id ON public.application_offers USING btree (submitted_application_id);


--
-- Name: idx_application_offers_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_application_offers_submitted_at ON public.application_offers USING btree (submitted_at);


--
-- Name: idx_application_offers_submitted_by_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_application_offers_submitted_by_user_id ON public.application_offers USING btree (submitted_by_user_id);


--
-- Name: idx_audit_log_bank_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_bank_user_id ON public.bank_employee_audit_log USING btree (bank_user_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_created_at ON public.bank_employee_audit_log USING btree (created_at);


--
-- Name: idx_audit_log_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_employee_id ON public.bank_employee_audit_log USING btree (employee_id);


--
-- Name: idx_bank_application_views_app_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_application_views_app_id ON public.bank_application_views USING btree (application_id);


--
-- Name: idx_bank_application_views_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_application_views_bank_id ON public.bank_application_views USING btree (bank_user_id);


--
-- Name: idx_bank_application_views_viewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_application_views_viewed_at ON public.bank_application_views USING btree (viewed_at);


--
-- Name: idx_bank_employees_bank_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_employees_bank_user_id ON public.bank_employees USING btree (bank_user_id);


--
-- Name: idx_bank_employees_last_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_employees_last_login ON public.bank_employees USING btree (last_login_at);


--
-- Name: idx_bank_employees_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_employees_user_id ON public.bank_employees USING btree (user_id);


--
-- Name: idx_bank_offer_submissions_app_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_offer_submissions_app_id ON public.bank_offer_submissions USING btree (application_id);


--
-- Name: idx_bank_offer_submissions_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_offer_submissions_bank_id ON public.bank_offer_submissions USING btree (bank_user_id);


--
-- Name: idx_bank_offer_submissions_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_offer_submissions_submitted_at ON public.bank_offer_submissions USING btree (submitted_at);


--
-- Name: idx_bank_users_logo_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_users_logo_url ON public.bank_users USING btree (logo_url);


--
-- Name: idx_business_users_cr_national_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_users_cr_national_number ON public.business_users USING btree (cr_national_number);


--
-- Name: idx_business_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_users_created_at ON public.business_users USING btree (created_at);


--
-- Name: idx_business_users_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_users_user_id ON public.business_users USING btree (user_id);


--
-- Name: idx_business_users_wathiq_data_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_users_wathiq_data_id ON public.business_users USING btree (wathiq_data_id);


--
-- Name: idx_offers_financing_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_financing_amount ON public.application_offers USING btree (approved_financing_amount);


--
-- Name: idx_offers_grace_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_grace_period ON public.application_offers USING btree (grace_period_months);


--
-- Name: idx_offers_interest_rate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_interest_rate ON public.application_offers USING btree (interest_rate);


--
-- Name: idx_offers_monthly_installment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_monthly_installment ON public.application_offers USING btree (monthly_installment_amount);


--
-- Name: idx_offers_processing_fee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_processing_fee ON public.application_offers USING btree (processing_fee);


--
-- Name: idx_offers_relationship_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_relationship_manager ON public.application_offers USING btree (relationship_manager_name);


--
-- Name: idx_offers_repayment_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offers_repayment_period ON public.application_offers USING btree (proposed_repayment_period_months);


--
-- Name: idx_pos_app_auction_end; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_auction_end ON public.pos_application USING btree (auction_end_time);


--
-- Name: idx_pos_app_avg_monthly_sales; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_avg_monthly_sales ON public.pos_application USING btree (avg_monthly_pos_sales);


--
-- Name: idx_pos_app_current_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_current_status ON public.pos_application USING btree (current_application_status);


--
-- Name: idx_pos_app_financing_amount; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_financing_amount ON public.pos_application USING btree (requested_financing_amount);


--
-- Name: idx_pos_app_offers_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_offers_count ON public.pos_application USING btree (offers_count);


--
-- Name: idx_pos_app_pos_provider_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_pos_provider_name ON public.pos_application USING btree (pos_provider_name);


--
-- Name: idx_pos_app_repayment_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_repayment_period ON public.pos_application USING btree (preferred_repayment_period_months);


--
-- Name: idx_pos_app_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_app_updated_at ON public.pos_application USING btree (updated_at);


--
-- Name: idx_pos_application_reference_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_pos_application_reference_number ON public.pos_application USING btree (reference_number) WHERE (reference_number IS NOT NULL);


--
-- Name: idx_pos_application_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_application_status ON public.pos_application USING btree (status);


--
-- Name: idx_pos_application_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_application_submitted_at ON public.pos_application USING btree (submitted_at);


--
-- Name: idx_pos_application_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_application_user_id ON public.pos_application USING btree (user_id);


--
-- Name: idx_pos_application_wathiq_data_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pos_application_wathiq_data_id ON public.pos_application USING btree (wathiq_data_id);


--
-- Name: idx_status_audit_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status_audit_admin ON public.status_audit_log USING btree (admin_user_id);


--
-- Name: idx_status_audit_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status_audit_application_id ON public.status_audit_log USING btree (application_id);


--
-- Name: idx_status_audit_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status_audit_timestamp ON public.status_audit_log USING btree ("timestamp");


--
-- Name: idx_users_account_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_account_status ON public.users USING btree (account_status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_last_login ON public.users USING btree (last_login_at);


--
-- Name: idx_users_logo_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_logo_url ON public.users USING btree (logo_url);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: idx_users_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_verification_status ON public.users USING btree (verification_status);


--
-- Name: idx_wathiq_data_cr_national_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wathiq_data_cr_national_number ON public.wathiq_data USING btree (cr_national_number);


--
-- Name: idx_wathiq_data_registration_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wathiq_data_registration_status ON public.wathiq_data USING btree (registration_status);


--
-- Name: idx_wathiq_data_trade_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wathiq_data_trade_name ON public.wathiq_data USING btree (trade_name);


--
-- Name: bank_users update_employee_logo; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_employee_logo AFTER UPDATE ON public.bank_users FOR EACH ROW EXECUTE FUNCTION public.update_employee_logo();


--
-- Name: application_offers application_offers_bank_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_bank_user_id_fkey FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: application_offers application_offers_submitted_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_submitted_application_id_fkey FOREIGN KEY (submitted_application_id) REFERENCES public.pos_application(application_id) ON DELETE CASCADE;


--
-- Name: application_offers application_offers_submitted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT application_offers_submitted_by_user_id_fkey FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_application_views bank_application_views_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.pos_application(application_id) ON DELETE CASCADE;


--
-- Name: bank_application_views bank_application_views_bank_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_application_views
    ADD CONSTRAINT bank_application_views_bank_user_id_fkey FOREIGN KEY (bank_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions bank_offer_submissions_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.pos_application(application_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions bank_offer_submissions_bank_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_bank_user_id_fkey FOREIGN KEY (bank_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions bank_offer_submissions_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT bank_offer_submissions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.application_offers(offer_id) ON DELETE CASCADE;


--
-- Name: bank_users bank_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_users
    ADD CONSTRAINT bank_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: business_users business_users_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_users
    ADD CONSTRAINT business_users_users_fk FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: business_users business_users_wathiq_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_users
    ADD CONSTRAINT business_users_wathiq_data_id_fkey FOREIGN KEY (wathiq_data_id) REFERENCES public.wathiq_data(id) ON DELETE SET NULL;


--
-- Name: application_offers fk_application_offers_bank_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_offers
    ADD CONSTRAINT fk_application_offers_bank_user_id FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_employee_audit_log fk_audit_log_bank; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employee_audit_log
    ADD CONSTRAINT fk_audit_log_bank FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_employee_audit_log fk_audit_log_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employee_audit_log
    ADD CONSTRAINT fk_audit_log_employee FOREIGN KEY (employee_id) REFERENCES public.bank_employees(employee_id) ON DELETE CASCADE;


--
-- Name: bank_employees fk_bank_employees_bank_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT fk_bank_employees_bank_user FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_employees fk_bank_employees_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_employees
    ADD CONSTRAINT fk_bank_employees_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions fk_bank_offer_submissions_bank_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT fk_bank_offer_submissions_bank_user FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: bank_offer_submissions fk_bank_offer_submissions_bank_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_offer_submissions
    ADD CONSTRAINT fk_bank_offer_submissions_bank_user_id FOREIGN KEY (bank_user_id) REFERENCES public.bank_users(user_id) ON DELETE CASCADE;


--
-- Name: pos_application pos_application_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_application
    ADD CONSTRAINT pos_application_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: pos_application pos_application_wathiq_data_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_application
    ADD CONSTRAINT pos_application_wathiq_data_id_fkey FOREIGN KEY (wathiq_data_id) REFERENCES public.wathiq_data(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;


--
-- PostgreSQL database dump complete
--

\unrestrict 4qxnJCkH9kCbbzZvO5A9sol1OxzgJE0I3SA5wZFu9cWzKmbP5147BjeXohc8eMs

