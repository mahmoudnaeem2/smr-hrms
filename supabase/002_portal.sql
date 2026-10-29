-- SMR HRMS & Payroll: Supabase schema, phase 2 (employee self-service)
-- Run after 001_init.sql. Safe to run again.
--
-- An employee can sign in and use "My Portal". The SERVER decides what they get:
--   * portal_data()  returns ONLY the caller's own rows plus non-personal settings.
--   * portal_put()   lets the caller change ONLY their own leave requests, HR requests
--                    and attendance punches, under strict rules (new requests start as
--                    Pending; an employee can never approve or edit a decided request).
--   * Staff tables stay closed: employees have no access to app_store at all.

alter table public.profiles add column if not exists emp_no text;
create unique index if not exists profiles_emp_no_key on public.profiles (emp_no) where emp_no is not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Pending','System Administrator','HR Director','HR Specialist',
                  'Payroll Specialist','Finance Manager','Department Manager','Employee'));

-- Staff = may read and write the whole store. Employees and managers are NOT staff.
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.active
                   and p.role not in ('Pending','Employee','Department Manager'));
$$;

-- What an employee is allowed to see, and which keys they may write ----------------------
create table if not exists public.portal_keys (
  k        text primary key,
  kind     text not null check (kind in ('config','rows','map','emp','runs')),
  fld      text not null default 'no',
  writable boolean not null default false
);
alter table public.portal_keys enable row level security;
drop policy if exists portal_keys_read on public.portal_keys;
create policy portal_keys_read on public.portal_keys for select to authenticated using (true);
revoke all on public.portal_keys from anon;
grant select on public.portal_keys to authenticated;

insert into public.portal_keys (k, kind, fld, writable) values
  ('smr_depts','config','no',false), ('smr_wkcfg','config','no',false), ('smr_rules','config','no',false),
  ('smr_lpol','config','no',false),  ('smr_lnpol','config','no',false), ('smr_hols','config','no',false),
  ('smr_lvacc','config','no',false), ('smr_comps','config','no',false), ('smr_perm','config','no',false),
  ('smr_wf','config','no',false),    ('smr_posl','config','no',false),  ('smr_dhead','config','no',false),
  ('smr_vth','config','no',false),   ('smr_varr','config','no',false),  ('smr_ccs','config','no',false),
  ('smr_company_mine','config','no',false),
  ('smr_emp','emp','no',false),
  ('smr_lr','rows','no',true),            ('smr_hrq_mine','rows','no',true),
  ('smr_loans_mine','rows','no',false),  ('smr_warns_mine','rows','no',false),
  ('smr_ladj_mine','rows','no',false),   ('smr_docrecv_mine','rows','no',false),
  ('smr_renew_mine','rows','no',false),  ('smr_salh_mine','rows','no',false),
  ('smr_salreq_mine','rows','no',false), ('smr_otx_mine','rows','no',false),
  ('smr_moves_mine','rows','no',false),
  ('smr_punch','map','no',true),
  ('smr_runs_mine','runs','no',false)
on conflict (k) do update set kind = excluded.kind, fld = excluded.fld, writable = excluded.writable;

create or replace function public.my_emp_no() returns text
language sql stable security definer set search_path = public as $$
  select p.emp_no from public.profiles p
   where p.id = auth.uid() and p.active and p.role = 'Employee' and p.emp_no is not null;
$$;

-- Own data only ----------------------------------------------------------------------------
create or replace function public.portal_data() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me text := public.my_emp_no(); out jsonb := '{}'::jsonb; r record; v jsonb;
begin
  if me is null then raise exception 'not_an_employee' using errcode = '42501'; end if;
  for r in select s.k, s.v, pk.kind, pk.fld
             from public.app_store s join public.portal_keys pk on pk.k = s.k loop
    v := null;
    if r.kind = 'config' then v := r.v;
    elsif r.kind in ('rows','emp') then
      if jsonb_typeof(r.v) = 'array' then
        select coalesce(jsonb_agg(e), '[]'::jsonb) into v
          from jsonb_array_elements(r.v) e where e->>r.fld = me;
      end if;
    elsif r.kind = 'map' then
      if jsonb_typeof(r.v) = 'object' then
        select coalesce(jsonb_object_agg(x.key, x.value), '{}'::jsonb) into v
          from jsonb_each(r.v) x where x.key like me || '|%';
      end if;
    elsif r.kind = 'runs' then
      if jsonb_typeof(r.v) = 'array' then
        select coalesce(jsonb_agg(
                 (run - 'exc' - 'hist' - 'results') || jsonb_build_object('exc','[]'::jsonb,'hist','[]'::jsonb,
                   'results', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(run->'results') x where x->>'no' = me))
               ), '[]'::jsonb) into v
          from jsonb_array_elements(r.v) run
         where run->>'status' in ('finalized','paid','reconciliation_required','reconciled')
           and exists (select 1 from jsonb_array_elements(run->'results') x where x->>'no' = me);
      end if;
    end if;
    if v is not null then out := out || jsonb_build_object(r.k, v); end if;
  end loop;
  return out;
end $$;

-- Own writes, under strict rules -------------------------------------------------------------
create or replace function public.portal_put(p_k text, p_v jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare me text := public.my_emp_no(); pk record; stored jsonb; res jsonb; e jsonb; old jsonb; mine jsonb := '[]'::jsonb; rec record;
begin
  if me is null then raise exception 'not_an_employee' using errcode = '42501'; end if;
  select * into pk from public.portal_keys where k = p_k and writable;
  if not found then raise exception 'key_not_writable' using errcode = '42501'; end if;
  select v into stored from public.app_store where k = p_k for update;

  if pk.kind = 'rows' then
    if jsonb_typeof(p_v) <> 'array' then raise exception 'bad_value' using errcode = '22023'; end if;
    stored := coalesce(stored, '[]'::jsonb);
    for rec in select x from jsonb_array_elements(stored) x where x->>'no' = me loop mine := mine || jsonb_build_array(rec.x); end loop;
    res := '[]'::jsonb;
    -- existing rows: unchanged, or Pending -> Cancelled, or withdrawn while still Pending
    for rec in select x from jsonb_array_elements(mine) x loop
      old := rec.x; e := null;
      select n into e from jsonb_array_elements(p_v) n where n->>'id' = old->>'id' and n->>'no' = me limit 1;
      if e is not null then
        if (e - 'status') = (old - 'status') and old->>'status' = 'Pending' and e->>'status' in ('Pending','Cancelled') then
          res := res || jsonb_build_array(e);
        else res := res || jsonb_build_array(old); end if;
      elsif old->>'status' <> 'Pending' then
        res := res || jsonb_build_array(old);
      end if;
    end loop;
    -- brand new rows: own number, always Pending
    for rec in select n from jsonb_array_elements(p_v) n loop
      e := rec.n;
      continue when e->>'id' is null or e->>'no' is distinct from me;
      continue when exists (select 1 from jsonb_array_elements(mine) o where o->>'id' = e->>'id');
      res := res || jsonb_build_array(e || jsonb_build_object('status','Pending'));
    end loop;
    -- everyone else's rows pass through untouched
    for rec in select x from jsonb_array_elements(stored) x where x->>'no' is distinct from me loop res := res || jsonb_build_array(rec.x); end loop;

  elsif pk.kind = 'map' then
    if jsonb_typeof(p_v) <> 'object' then raise exception 'bad_value' using errcode = '22023'; end if;
    stored := coalesce(stored, '{}'::jsonb);
    res := coalesce((select jsonb_object_agg(x.key, x.value) from jsonb_each(stored) x where x.key not like me || '|%'), '{}'::jsonb);
    -- own punches are append-only
    for rec in select x.key as kk, x.value as vv from jsonb_each(p_v) x where x.key like me || '|%' loop
      old := stored -> rec.kk;
      if jsonb_typeof(rec.vv) <> 'array' then
        if old is not null then res := res || jsonb_build_object(rec.kk, old); end if;
      elsif old is null then
        if jsonb_array_length(rec.vv) <= 2 then res := res || jsonb_build_object(rec.kk, rec.vv); end if;
      elsif jsonb_array_length(rec.vv) >= jsonb_array_length(old)
        and (select coalesce(jsonb_agg(a order by i), '[]'::jsonb) from (select a, i from jsonb_array_elements(rec.vv) with ordinality t(a, i) order by i limit jsonb_array_length(old)) q) = old then
        res := res || jsonb_build_object(rec.kk, rec.vv);
      else
        res := res || jsonb_build_object(rec.kk, old);
      end if;
    end loop;
    for rec in select x.key as kk, x.value as vv from jsonb_each(stored) x where x.key like me || '|%' and not (p_v ? x.key) loop
      res := res || jsonb_build_object(rec.kk, rec.vv);
    end loop;
  else
    raise exception 'key_not_writable' using errcode = '42501';
  end if;

  insert into public.app_store (k, v, ver, updated_by) values (p_k, res, 1, auth.uid())
  on conflict (k) do update set v = excluded.v, ver = public.app_store.ver + 1, updated_at = now(), updated_by = auth.uid();
end $$;

revoke all on function public.my_emp_no() from anon, public;
revoke all on function public.portal_data() from anon, public;
revoke all on function public.portal_put(text, jsonb) from anon, public;
grant execute on function public.my_emp_no() to authenticated;
grant execute on function public.portal_data() to authenticated;
grant execute on function public.portal_put(text, jsonb) to authenticated;

-- Link accounts to employees ---------------------------------------------------------------------
-- Automatic: when an Auth user is created and an employee has the same work email,
-- the account becomes that employee's portal account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare emp jsonb;
begin
  select e into emp from public.app_store s, jsonb_array_elements(s.v) e
   where s.k = 'smr_emp' and jsonb_typeof(s.v) = 'array' and lower(e->>'email') = lower(new.email) limit 1;
  if emp is not null then
    insert into public.profiles (id, full_name, role, emp_no)
    values (new.id, coalesce(emp->>'name', split_part(new.email,'@',1)), 'Employee', emp->>'no')
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, full_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

-- Manual: link an existing Auth user to an employee number (administrator or HR Director).
create or replace function public.link_employee(p_email text, p_emp_no text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid; nm text;
begin
  if not public.is_admin() then raise exception 'not_allowed' using errcode = '42501'; end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'no_such_user' using errcode = 'P0002'; end if;
  select e->>'name' into nm from public.app_store s, jsonb_array_elements(s.v) e
   where s.k = 'smr_emp' and e->>'no' = p_emp_no limit 1;
  if nm is null then raise exception 'no_such_employee' using errcode = 'P0002'; end if;
  update public.profiles set role = 'Employee', emp_no = p_emp_no, full_name = nm, active = true where id = uid;
end $$;
revoke all on function public.link_employee(text, text) from anon, public;
grant execute on function public.link_employee(text, text) to authenticated;

-- The HR Director may also manage profiles, not only the System Administrator.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.active and p.role in ('System Administrator','HR Director'));
$$;
