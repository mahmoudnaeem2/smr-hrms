-- SMR HRMS security hardening
-- Apply after 006_photos.sql.
--
-- The SECURITY DEFINER functions below already schema-qualify application tables
-- and Supabase auth helpers. An empty search_path prevents name resolution from
-- being influenced by objects in writable schemas.

alter function public.is_staff() set search_path = '';
alter function public.is_admin() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.my_emp_no() set search_path = '';
alter function public.portal_data() set search_path = '';
alter function public.portal_put(text, jsonb) set search_path = '';
alter function public.link_employee(text, text) set search_path = '';
alter function public.list_profiles() set search_path = '';
alter function public.set_profile(uuid, text, boolean, text) set search_path = '';

-- These helper functions are called by authenticated RLS policies and by
-- SECURITY DEFINER routines. They return only a boolean, but should not be
-- executable by anonymous or PUBLIC callers.
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
