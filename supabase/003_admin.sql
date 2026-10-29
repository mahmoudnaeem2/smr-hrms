-- SMR HRMS & Payroll: Supabase schema, phase 3 (manage accounts inside the app)
-- Run after 002_portal.sql. Safe to run again.
-- Only an active System Administrator or HR Director can use these functions.
-- Nobody can change their own account here, and only a System Administrator can
-- grant or change the System Administrator role.

create or replace function public.list_profiles() returns table
  (id uuid, email text, full_name text, role text, active boolean, emp_no text, last_sign_in_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.full_name, p.role, p.active, p.emp_no, u.last_sign_in_at, u.created_at
      from public.profiles p join auth.users u on u.id = p.id
     order by u.created_at;
end $$;

create or replace function public.set_profile(p_id uuid, p_role text, p_active boolean, p_emp_no text default null) returns void
language plpgsql security definer set search_path = public as $$
declare me_role text; target_role text; nm text;
begin
  if not public.is_admin() then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_id = auth.uid() then raise exception 'cannot_edit_self' using errcode = '42501'; end if;
  if p_role not in ('Pending','System Administrator','HR Director','HR Specialist','Payroll Specialist','Finance Manager','Employee') then
    raise exception 'bad_role' using errcode = '22023'; end if;
  select role into me_role from public.profiles where id = auth.uid();
  select role into target_role from public.profiles where id = p_id;
  if target_role is null then raise exception 'no_such_user' using errcode = 'P0002'; end if;
  if me_role <> 'System Administrator' and (p_role = 'System Administrator' or target_role = 'System Administrator') then
    raise exception 'admin_only' using errcode = '42501'; end if;
  if p_role = 'Employee' then
    select e->>'name' into nm from public.app_store s, jsonb_array_elements(s.v) e
     where s.k = 'smr_emp' and jsonb_typeof(s.v) = 'array' and e->>'no' = p_emp_no limit 1;
    if nm is null then raise exception 'no_such_employee' using errcode = 'P0002'; end if;
    if exists (select 1 from public.profiles where emp_no = p_emp_no and id <> p_id) then
      raise exception 'emp_already_linked' using errcode = '23505'; end if;
    update public.profiles set role = p_role, active = p_active, emp_no = p_emp_no, full_name = nm where id = p_id;
  else
    update public.profiles set role = p_role, active = p_active, emp_no = null where id = p_id;
  end if;
end $$;

revoke all on function public.list_profiles() from anon, public;
revoke all on function public.set_profile(uuid, text, boolean, text) from anon, public;
grant execute on function public.list_profiles() to authenticated;
grant execute on function public.set_profile(uuid, text, boolean, text) to authenticated;
