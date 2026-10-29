-- SMR HRMS & Payroll: Supabase schema, phase 6 (employee profile pictures)
-- Run after 005_employee_sync.sql. Safe to run again.
-- An employee can set or remove their own picture (a small JPEG, at most about 50 KB). Staff keep full access through app_store.

alter table public.portal_keys drop constraint if exists portal_keys_kind_check;
alter table public.portal_keys add constraint portal_keys_kind_check check (kind in ('config','rows','map','emp','runs','decs','photo'));
insert into public.portal_keys (k, kind, fld, writable) values ('smr_photos_mine','photo','no',true)
  on conflict (k) do update set kind = 'photo', writable = true;

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
          from jsonb_each(r.v) x where x.key = me or x.key like me || '|%';
      end if;
    elsif r.kind = 'photo' then
      if jsonb_typeof(r.v) = 'object' and r.v ? me then v := jsonb_build_object(me, r.v -> me); else v := '{}'::jsonb; end if;
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
  elsif pk.kind = 'photo' then
    -- profile pictures: an object keyed by employee number. An employee can only set or remove their own, as a small JPEG.
    if jsonb_typeof(p_v) <> 'object' then raise exception 'bad_value' using errcode = '22023'; end if;
    stored := coalesce(stored, '{}'::jsonb);
    res := stored - me;
    if jsonb_typeof(p_v -> me) = 'string' and (p_v ->> me) like 'data:image/jpeg;base64,%' and length(p_v ->> me) <= 70000 then
      res := res || jsonb_build_object(me, p_v -> me);
    elsif p_v ? me and jsonb_typeof(p_v -> me) is distinct from 'null' and stored ? me then
      res := res || jsonb_build_object(me, stored -> me);   -- invalid picture: keep the old one
    end if;
  else
    raise exception 'key_not_writable' using errcode = '42501';
  end if;

  insert into public.app_store (k, v, ver, updated_by) values (p_k, res, 1, auth.uid())
  on conflict (k) do update set v = excluded.v, ver = public.app_store.ver + 1, updated_at = now(), updated_by = auth.uid();
end $$;
