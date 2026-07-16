-- 009_bank_entity_optional_login.sql
-- Allow bank/financing-partner entities to exist WITHOUT login credentials.
--
-- New model: a bank is an entity (users row of type 'bank_user' + bank_users
-- profile) with NO email/password. Login is provided only by bank_employees
-- created under the bank. Relaxing NOT NULL is backward-compatible — existing
-- rows keep their values; only new entity rows store NULL.
--
-- Login safety: unified-login already filters `AND u.password IS NOT NULL`, so a
-- NULL-password entity row can never authenticate.
--
-- FRAGILE: alters the core `users` table. Apply to dev first, verify all login
-- flows, then apply to prod during a maintenance window.

ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
