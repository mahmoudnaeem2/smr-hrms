-- SMR HRMS & Payroll: Supabase schema, phase 4 (leave progress for employees, email log)
-- Run after 003_admin.sql. Safe to run again.

alter table public.portal_keys drop constraint if exists portal_keys_kind_check;
alter table public.portal_keys add constraint portal_keys_kind_check check (kind in ('config','rows','map','emp','runs','decs'));
insert into public.portal_keys (k, kind, fld, writable) values ('smr_dec_mine','decs','no',false)
  on conflict (k) do update set kind = excluded.kind, writable = false;

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
    elsif r.kind = 'decs' then
      -- approval progress of the employee's own leave requests only (keys look like L<request id>)
      if jsonb_typeof(r.v) = 'object' then
        select coalesce(jsonb_object_agg(x.key, x.value), '{}'::jsonb) into v
          from jsonb_each(r.v) x
         where x.key like 'L%'
           and exists (select 1 from public.app_store l, jsonb_array_elements(l.v) q
                        where l.k = 'smr_lr' and jsonb_typeof(l.v) = 'array'
                          and q->>'no' = me and q->>'id' = substr(x.key, 2));
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

-- One row per email already sent, so the same message is never sent twice.
create table if not exists public.mail_log (
  key text primary key,
  sent_at timestamptz not null default now(),
  to_addr text
);
alter table public.mail_log enable row level security;
revoke all on public.mail_log from anon, authenticated;
