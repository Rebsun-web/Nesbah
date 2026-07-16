-- Read-only pre-flight checks before applying 008 + 009.
-- Run against EACH database (dev, prod, prod-eu) to see current state and whether
-- the two prod instances are in sync. Nothing here mutates data.

\echo '== Connected to =='
SELECT current_database() AS db, inet_server_addr() AS host, version();

\echo '== users.email / users.password nullability (009 needed if NOT NULL = YES) =='
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('email','password')
ORDER BY column_name;

\echo '== update_employee_logo trigger body (008 needed if it uses != instead of IS DISTINCT FROM) =='
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_employee_logo';

\echo '== Prior migration markers (wathiq_data = 005/006 applied) =='
SELECT to_regclass('public.wathiq_data') AS wathiq_data_table,
       to_regclass('public.bank_employees') AS bank_employees_table;

\echo '== Row counts (compare across instances to detect drift) =='
SELECT
  (SELECT count(*) FROM users)          AS users,
  (SELECT count(*) FROM bank_users)     AS bank_users,
  (SELECT count(*) FROM bank_employees) AS bank_employees,
  (SELECT count(*) FROM pos_application) AS applications;

\echo '== Bank entities missing a logo on the users row (logo dual-write gap) =='
SELECT count(*) AS bank_users_without_users_logo
FROM bank_users bu
JOIN users u ON u.user_id = bu.user_id
WHERE u.user_type = 'bank_user' AND u.logo_url IS NULL AND bu.logo_url IS NOT NULL;
