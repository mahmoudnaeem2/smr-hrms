# SMR HRMS security and technical audit

**Review date:** 31 October 2026  
**Repository:** `mahmoudnaeem2/smr-hrms`  
**Reviewed branch:** `main` (read-only review); remediation is isolated in `audit/security-review-2026-10-31`.

## Executive summary

The repository has a thoughtful prototype-to-cloud migration, uses Supabase Auth, separates employee portal reads/writes into database functions, and has a useful Playwright test suite. However, the current authorization model is not yet sufficient to treat the system as a production HR/payroll platform with confidential salary and employee data.

**Overall assessment: Critical risk for production use until the profile privilege-escalation issue and broad staff data access are resolved and verified against the live Supabase project.**

This is a static repository review. No live Supabase database, deployed Edge Function configuration, production data, or authenticated tenant was accessed. The SQL migration in this branch is a limited hardening change; it does not claim to remediate the architectural access-control issue below.

## Findings

### H-01 — HR Directors can bypass guarded profile-management RPCs and promote themselves

**Severity: Critical**  
**Evidence:** `supabase/001_init.sql` creates `profiles_admin_all FOR ALL` with `USING (public.is_admin())` and `WITH CHECK (public.is_admin())`. `supabase/002_portal.sql` later changes `is_admin()` to return true for both `System Administrator` and `HR Director`. The table also grants authenticated users INSERT/UPDATE/DELETE.  
**Impact:** An authenticated HR Director can update their own `profiles.role` directly through the Data API to `System Administrator`, bypassing `set_profile()` which explicitly blocks self-edit and reserves System Administrator role changes for an existing System Administrator. This defeats the intended separation of duties.  
**Remediation in this branch:** `supabase/007_security_hardening.sql` drops `profiles_admin_all`. Profile changes must use the guarded `set_profile()` RPC or the server-side `admin-users` Edge Function. The existing self-read policy remains.  
**Validation required:** In staging, verify HR Director cannot directly INSERT/UPDATE/DELETE profiles or promote themselves, while the approved account-management flows still work.

### H-02 — All active staff roles can read and write every app_store document

**Severity: High**  
**Evidence:** `supabase/001_init.sql` defines `store_staff_read/insert/update/delete` using only `public.is_staff()`. That helper returns true for every active non-Pending staff role. The app stores each module as a complete JSON document in `app_store`.  
**Impact:** HR Specialist, Payroll Specialist, Finance Manager, HR Director and System Administrator sessions can query the Supabase Data API directly and access or overwrite every stored document, regardless of front-end menu or role checks. Front-end checks such as `canSee()` are not a database security boundary. A Payroll Specialist may therefore access unrelated HR documents, and a staff role may be able to alter data outside its intended duties.  
**Recommendation:** Replace the shared, broad `app_store` access model with role-scoped tables or per-key authorization policies backed by trusted server-side role checks. For sensitive datasets (salary, payroll runs, bank/payment details, employee records), use explicit least-privilege grants and RLS policies. Add positive and negative tests for every role and operation. Do not attempt to solve this solely by hiding UI controls.

### M-01 — SECURITY DEFINER helper functions use a non-empty search_path

**Severity: Medium**  
**Evidence:** `supabase/001_init.sql` and later migrations define SECURITY DEFINER functions with `SET search_path = public`.  
**Impact:** SECURITY DEFINER routines run with the function owner's privileges. A non-empty search path increases the risk of object-name shadowing if an untrusted role can create objects in a searched schema.  
**Remediation in this branch:** `supabase/007_security_hardening.sql` pins the reviewed SECURITY DEFINER functions to an empty search path. Their application tables and auth helpers are schema-qualified. It also revokes PUBLIC/anon execution of the boolean `is_staff()` and `is_admin()` helpers while retaining authenticated execution needed by RLS and server routines.  
**Validation required:** Apply the migration to a staging Supabase project, then verify sign-in, profile administration, employee portal reads/writes, and all RLS policies.

### M-02 — RLS policy tests are missing

**Severity: Medium**  
**Evidence:** The repository has browser/Playwright tests under `tests/`, but no `supabase/tests/` pgTAP suite.  
**Impact:** There is no automated proof that anon, employee, manager, HR, payroll and finance roles can and cannot perform the intended database operations. Static policy inspection alone cannot establish the effective grants plus RLS behavior.  
**Recommendation:** Add pgTAP tests for SELECT/INSERT/UPDATE/DELETE against every exposed table and RPC. Include cross-employee access attempts, inactive users, Pending users, and each staff role. Run `supabase test db` in CI.

### M-03 — Employee portal receives every configured key marked as config

**Severity: Medium (data-minimization concern; validate intended disclosure)**  
**Evidence:** `supabase/002_portal.sql` seeds `portal_keys` with keys such as `smr_rules`, `smr_wkcfg`, `smr_perm`, `smr_wf`, and `smr_company_mine` as `kind='config'`. `portal_data()` returns the full JSON value for every config key to an Employee.  
**Impact:** Employee accounts receive the complete configuration documents, not a field-level projection. Depending on the contents, this may expose internal payroll-rule metadata, workflow configuration, permission settings or company details that the portal does not need.  
**Recommendation:** Review each key and return only the specific fields needed by the employee portal. Keep payroll rules, role/permission configuration and internal workflow settings server-side unless there is a documented business need to disclose them.

### M-04 — Failed leave email delivery is marked as already sent

**Severity: Medium (notification reliability)**  
**Evidence:** `supabase/functions/notify-leave/index.ts` inserts the unique `mail_log` row before calling the mail provider.  
**Impact:** If the provider call fails or times out after the log insert, a retry sees the existing key and returns “already sent”; the employee/approver may never receive the notification.  
**Recommendation:** Use a delivery state machine (pending/sent/failed) with retry-safe processing, or remove/mark the log row failed when sending fails. Keep idempotency, but only mark a message sent after provider acceptance.

### L-01 — The Department Manager role is not enabled for the employee portal

**Severity: Low / product-scope clarification**  
**Evidence:** `002_portal.sql` includes `Department Manager` in the profile role constraint, but `my_emp_no()` only returns an employee number for role `Employee`, and `is_staff()` excludes Department Manager.  
**Impact:** A Department Manager account cannot use the staff store or the Employee portal RPCs. This may be intentional because the setup guide says department managers come later, but the role is present in the database constraint and should not be assigned until its access model is implemented.  
**Recommendation:** Either remove/withhold assignment of this role until supported, or implement manager-scoped data access with explicit team membership checks and tests.

### L-02 — Public configuration file contains the Supabase publishable key

**Severity: Informational**  
**Evidence:** `config.json` contains the project URL and a `sb_publishable_...` key.  
**Impact:** A Supabase publishable/anon key is designed to be exposed in client applications; it is not a secret by itself. Security depends on Auth, grants and RLS. No service-role key was observed in the reviewed config file. This review did not perform a full historical secret scan.  
**Recommendation:** Keep service-role and mail-provider secrets only in Supabase Edge Function secrets or another server-side secret store. Continue treating RLS as mandatory.

## Positive controls observed

- New Auth users default to the Pending role in the initial schema.
- Employee self-service data is exposed through `portal_data()` and constrained writes through `portal_put()`, rather than direct client access to the staff store.
- The employee portal write routine attempts to preserve other employees' rows and restrict employee edits to their own pending requests / append-only punches.
- Admin account-management RPCs check the caller's role and prevent users from editing their own profile.
- The admin-users Edge Function keeps the service-role key server-side and verifies the caller's Supabase user.
- Payroll rules include draft/review/approval states and prevent a run using trial values from being finalized, according to the inspected payroll module.

## Remediation plan

1. Apply `supabase/007_security_hardening.sql` in a staging project and run the regression checks, including HR Director direct-profile-write denial.
2. Design a role-by-role data access matrix and replace broad staff access to `app_store` for sensitive datasets.
3. Add pgTAP RLS/RPC tests and run them in CI.
4. Minimize the employee portal configuration payload.
5. Make leave email delivery retry-safe.
6. Perform a live configuration review: Auth sign-up settings, RLS/grants on all exposed tables, deployed Edge Function JWT verification, secret storage, backups/PITR, and production mail restrictions.

## Verification status

- [x] Repository and default branch inspected.
- [x] SQL migrations and Edge Function source statically reviewed.
- [x] Separate audit branch created.
- [ ] Hardening migration applied to a Supabase staging database.
- [ ] pgTAP/RLS tests executed.
- [ ] Browser regression suite executed against a built artifact.
- [ ] Live Supabase configuration and deployed functions reviewed.
