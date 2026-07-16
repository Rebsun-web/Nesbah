-- 008_fix_employee_logo_trigger.sql
-- Fix bank-logo propagation to employees.
--
-- The trigger function used `NEW.logo_url != OLD.logo_url`. In Postgres any
-- comparison involving NULL yields NULL (treated as false), so when the old
-- logo was NULL (the normal case right after a bank is created) or a logo was
-- cleared to NULL, the UPDATE never ran and employee logos silently went stale.
-- `IS DISTINCT FROM` is the NULL-safe comparison.

CREATE OR REPLACE FUNCTION public.update_employee_logo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            IF NEW.logo_url IS DISTINCT FROM OLD.logo_url THEN
                UPDATE bank_employees
                SET logo_url = NEW.logo_url
                WHERE bank_user_id = NEW.user_id;
            END IF;
            RETURN NEW;
        END;
        $$;
