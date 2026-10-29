-- SMR HRMS & Payroll: Supabase schema, phase 1
-- Run once in Supabase: SQL Editor > New query > paste > Run.
--
-- Phase 1 design (read this before going live):
--   * The app keeps each module's data as one JSON document per key (app_store).
--     That is the same shape the prototype already uses, so everything keeps working.
--   * Because a document holds many employees, Postgres cannot hide one employee's row
--     from another user. So phase 1 is for STAFF accounts only (HR, payroll, finance,
--     administrator). Employee and manager self-service needs per-row tables (phase 2).
--   * Every write carries the version the writer last saw. If someone else saved in
--     between, the write is refused (version_conflict) instead of silently overwriting.

create extension if not exists pgcrypto;

-- Who can sign in and with which role ---------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  role       text not null default 'Pending'
             check (role in ('Pending','System Administrator','HR Director','HR Specialist',
                             'Payroll Specialist','Finance Manager')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- One JSON document per app key -----------------------------------------------------
create table if not exists public.app_store (
  k          text primary key check (k like 'smr\_%' escape '\' and length(k) <= 80),
  v          jsonb not null,
  ver        bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Helper checks (security definer so RLS on profiles cannot recurse) -------------------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.active and p.role <> 'Pending');
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.active and p.role = 'System Administrator');
$$;

-- New sign-ups start as Pending until an administrator gives them a role ------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Versioned write: refuses to overwrite a newer copy ---------------------------------------
create or replace function public.put_store(p_k text, p_v jsonb, p_ver bigint) returns bigint
language plpgsql security invoker set search_path = public as $$
declare cur bigint; nv bigint;
begin
  select ver into cur from public.app_store where k = p_k for update;
  if not found then
    if p_ver <> 0 then raise exception 'version_conflict' using errcode = 'P0001'; end if;
    insert into public.app_store (k, v, ver, updated_by) values (p_k, p_v, 1, auth.uid())
      returning ver into nv;
    return nv;
  end if;
  if cur <> p_ver then raise exception 'version_conflict' using errcode = 'P0001'; end if;
  update public.app_store
     set v = p_v, ver = cur + 1, updated_at = now(), updated_by = auth.uid()
   where k = p_k returning ver into nv;
  return nv;
end $$;

create or replace function public.del_store(p_k text) returns void
language sql security invoker set search_path = public as $$
  delete from public.app_store where k = p_k;
$$;

-- Row level security ---------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.app_store enable row level security;

drop policy if exists profiles_self_read   on public.profiles;
drop policy if exists profiles_admin_all   on public.profiles;
drop policy if exists store_staff_read     on public.app_store;
drop policy if exists store_staff_insert   on public.app_store;
drop policy if exists store_staff_update   on public.app_store;
drop policy if exists store_staff_delete   on public.app_store;

create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy store_staff_read   on public.app_store for select to authenticated using (public.is_staff());
create policy store_staff_insert on public.app_store for insert to authenticated with check (public.is_staff());
create policy store_staff_update on public.app_store for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy store_staff_delete on public.app_store for delete to authenticated using (public.is_staff());

-- Nothing is readable without signing in --------------------------------------------------------
revoke all on public.profiles  from anon;
revoke all on public.app_store from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.app_store to authenticated;
revoke all on function public.put_store(text, jsonb, bigint) from anon, public;
revoke all on function public.del_store(text) from anon, public;
grant execute on function public.put_store(text, jsonb, bigint) to authenticated;
grant execute on function public.del_store(text) to authenticated;

-- After creating the first user in Authentication > Users, make them the administrator:
--   update public.profiles set role = 'System Administrator', full_name = 'Your name'
--   where id = (select id from auth.users where email = 'you@company.com');
