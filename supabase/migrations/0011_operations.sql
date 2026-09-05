create function public.is_pastor_v2() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles_v2 where id = auth.uid() and role = 'pastor');
$$;

alter table public.profiles_v2 drop constraint profiles_v2_id_fkey;
alter table public.profiles_v2 alter column id set default gen_random_uuid();
alter table public.profiles_v2 add column auth_user_id uuid unique references auth.users on delete cascade;
update public.profiles_v2 set auth_user_id = id;
alter table public.profiles_v2 add constraint profiles_v2_auth_identity check (auth_user_id is null or auth_user_id = id);

create view public.roster_v2 with (security_barrier = true) as
  select id, name, gender, birth_date, phone, role, last_seen_at, created_at,
    auth_user_id is not null as has_account,
    coalesce(last_seen_at, created_at) <= now() - interval '1 year' as is_dormant
  from public.profiles_v2 where public.is_admin_or_staff();
revoke all on public.roster_v2 from anon, authenticated;
grant select on public.roster_v2 to authenticated;

create function public.save_roster_member_v2(p_id uuid, p_name text, p_gender text, p_birth_date date, p_phone text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin_or_staff() then raise exception 'MANAGER_REQUIRED'; end if;
  if p_id is null then
    insert into public.profiles_v2 (name, gender, birth_date, phone)
    values (btrim(p_name), p_gender, p_birth_date, nullif(p_phone, '')) returning id into v_id;
  else
    update public.profiles_v2 set name = btrim(p_name), gender = p_gender,
      birth_date = p_birth_date, phone = nullif(p_phone, '') where id = p_id returning id into v_id;
    if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  end if;
  return v_id;
end $$;

create function public.delete_roster_member_v2(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin_or_staff() then raise exception 'MANAGER_REQUIRED'; end if;
  delete from public.profiles_v2 where id = p_id and auth_user_id is null
    and coalesce(last_seen_at, created_at) > now() - interval '1 year';
  if not found then raise exception 'MANUAL_MEMBER_REQUIRED'; end if;
end $$;

create function public.set_member_role_v2(p_id uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_pastor_v2() then raise exception 'PASTOR_REQUIRED'; end if;
  if p_role is null or p_role not in ('staff', 'youth') then raise exception 'INVALID_ROLE'; end if;
  update public.profiles_v2 set role = p_role
    where id = p_id and role in ('staff', 'youth') and auth_user_id is not null;
  if not found then raise exception 'INVALID_ROLE_TARGET'; end if;
end $$;

create function public.lock_cohort_v2(p_cohort_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin_or_staff() then raise exception 'MANAGER_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('cohort_operations_v2', 0));
  if not exists (select 1 from public.cohorts_v2 where id = p_cohort_id and is_active) then
    raise exception 'COHORT_READ_ONLY';
  end if;
end $$;

create function public.create_cohort_v2(p_name text, p_year integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin_or_staff() then raise exception 'MANAGER_REQUIRED'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80
    or p_year is null or p_year not between 1900 and 9999 then raise exception 'INVALID_COHORT'; end if;
  perform pg_advisory_xact_lock(hashtextextended('cohort_operations_v2', 0));
  if exists (select 1 from public.cohorts_v2 where year >= p_year) then raise exception 'COHORT_YEAR_MUST_INCREASE'; end if;
  update public.cohorts_v2 set is_active = false where is_active;
  insert into public.cohorts_v2 (name, year, is_active) values (btrim(p_name), p_year, true) returning id into v_id;
  insert into public.village_members_v2 (cohort_id, profile_id) select v_id, id from public.profiles_v2;
  return v_id;
end $$;

create function public.create_village_v2(p_cohort_id uuid, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public.lock_cohort_v2(p_cohort_id);
  insert into public.villages_v2 (cohort_id, name) values (p_cohort_id, btrim(p_name)) returning id into v_id;
  return v_id;
end $$;

create function public.delete_village_v2(p_village_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_cohort uuid;
begin
  select cohort_id into v_cohort from public.villages_v2 where id = p_village_id;
  perform public.lock_cohort_v2(v_cohort);
  if exists (select 1 from public.attendance_v2 where village_id = p_village_id)
    or exists (select 1 from public.orders_v2 where village_id = p_village_id)
    or exists (select 1 from public.village_posts_v2 where village_id = p_village_id)
    or exists (select 1 from public.prayer_requests_v2 where village_id = p_village_id) then
    raise exception 'VILLAGE_HAS_RECORDS';
  end if;
  update public.village_members_v2 set village_id = null where village_id = p_village_id;
  delete from public.villages_v2 where id = p_village_id;
end $$;

create function public.assign_members_v2(p_cohort_id uuid, p_profile_ids uuid[], p_village_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.lock_cohort_v2(p_cohort_id);
  if p_profile_ids is null or cardinality(p_profile_ids) = 0
    or exists (select 1 from unnest(p_profile_ids) as ids(profile_id) where ids.profile_id is null
      or not exists (select 1 from public.profiles_v2 p where p.id = ids.profile_id)) then raise exception 'INVALID_MEMBERS'; end if;
  if p_village_id is not null and not exists (select 1 from public.villages_v2
    where id = p_village_id and cohort_id = p_cohort_id) then raise exception 'INVALID_VILLAGE'; end if;
  insert into public.village_members_v2 (cohort_id, profile_id, village_id)
    select p_cohort_id, id, p_village_id from (select distinct unnest(p_profile_ids) as id) ids
  on conflict (cohort_id, profile_id) do update set village_id = excluded.village_id;
end $$;

create function public.set_village_leader_v2(p_cohort_id uuid, p_profile_id uuid, p_is_leader boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_pastor_v2() then raise exception 'PASTOR_REQUIRED'; end if;
  perform public.lock_cohort_v2(p_cohort_id);
  if p_is_leader is null then raise exception 'INVALID_LEADER'; end if;
  update public.village_members_v2 set is_leader = p_is_leader
    where cohort_id = p_cohort_id and profile_id = p_profile_id and village_id is not null;
  if not found then raise exception 'ASSIGNED_MEMBER_REQUIRED'; end if;
end $$;

create or replace function public.sync_my_profile_v2() returns public.profiles_v2
language plpgsql security definer set search_path = '' as $$
declare v_name text; v_signed_in_at timestamptz; v_profile public.profiles_v2;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select coalesce(nullif(btrim(raw_user_meta_data->>'full_name'), ''),
    nullif(btrim(raw_user_meta_data->>'name'), ''), nullif(btrim(raw_user_meta_data->>'user_name'), ''), '청년'),
    last_sign_in_at into strict v_name, v_signed_in_at from auth.users where id = auth.uid();
  insert into public.profiles_v2 (id, auth_user_id, name, last_seen_at)
  values (auth.uid(), auth.uid(), btrim(left(v_name, 80)), v_signed_in_at)
  on conflict (id) do update set last_seen_at = excluded.last_seen_at
    where profiles_v2.last_seen_at is distinct from excluded.last_seen_at;
  select * into v_profile from public.profiles_v2 where id = auth.uid();
  return v_profile;
end $$;

create function public.enroll_profile_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('cohort_operations_v2', 0));
  insert into public.village_members_v2 (cohort_id, profile_id)
    select id, new.id from public.cohorts_v2 where is_active;
  perform public.touch_villages_v2('{}');
  return null;
end $$;
create trigger enroll_profile_v2 after insert on public.profiles_v2 for each row execute function public.enroll_profile_v2();

create or replace function public.notify_village_cohort_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles_v2 set village_revision = village_revision + 1;
  return null;
end $$;

create function public.cafe_orders_v2(p_cohort_id uuid, p_service_date date)
returns table (item_id uuid, order_id uuid, village_id uuid, village_name text, profile_id uuid,
  person_name text, menu_name text, options jsonb, quantity int, status public.order_item_status, ordered_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin_or_staff() then raise exception 'MANAGER_REQUIRED'; end if;
  return query select i.id, o.id, o.village_id, coalesce(v.name, '미배정·게스트'), o.profile_id,
    coalesce(p.name, '게스트'), i.menu_name, i.options, i.quantity, i.status, o.created_at
    from public.orders_v2 o join public.order_items_v2 i on i.order_id = o.id
    left join public.profiles_v2 p on p.id = o.profile_id left join public.villages_v2 v on v.id = o.village_id
    where o.cohort_id is not distinct from p_cohort_id and o.service_date = p_service_date
    order by v.name nulls last, p.name nulls last, o.created_at, i.created_at, i.id;
end $$;

alter table public.cafe_settings_v2 add constraint cafe_settings_v2_time_order check (opens_at < closes_at);
alter table public.menus_v2
  add constraint menus_v2_name_valid check (name = btrim(name) and char_length(name) between 1 and 80),
  add constraint menus_v2_price_valid check (price >= 0 and ice_price_delta >= 0),
  add constraint menus_v2_options_valid check (coalesce(
    jsonb_typeof(options) = 'object' and options ?& array['temperature', 'shot', 'light', 'syrup']
    and options - array['temperature', 'shot', 'light', 'syrup'] = '{}'
    and options->'temperature' in ('["ice"]'::jsonb, '["hot"]'::jsonb, '["ice","hot"]'::jsonb, '["hot","ice"]'::jsonb)
    and jsonb_typeof(options->'shot') = 'number' and (options->>'shot')::numeric between 0 and 9
    and mod((options->>'shot')::numeric, 1) = 0
    and jsonb_typeof(options->'light') = 'boolean' and jsonb_typeof(options->'syrup') = 'boolean', false));
revoke all on public.menus_v2, public.cafe_settings_v2, public.cafe_closures_v2 from anon, authenticated;
grant select on public.menus_v2 to authenticated;
grant select on public.cafe_settings_v2, public.cafe_closures_v2 to anon, authenticated;
grant insert (category, name, price, ice_price_delta, options, is_active, sort_order),
  update (category, name, price, ice_price_delta, options, is_active, sort_order), delete on public.menus_v2 to authenticated;
grant insert (id, weekday, opens_at, closes_at), update (id, weekday, opens_at, closes_at) on public.cafe_settings_v2 to authenticated;
grant insert (closed_on, reason), update (closed_on, reason), delete on public.cafe_closures_v2 to authenticated;
create policy "관리자 메뉴 등록" on public.menus_v2 for insert to authenticated with check (public.is_admin_or_staff());
create policy "관리자 메뉴 수정" on public.menus_v2 for update to authenticated using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "관리자 메뉴 삭제" on public.menus_v2 for delete to authenticated using (public.is_admin_or_staff());
create policy "관리자 주문 시간 등록" on public.cafe_settings_v2 for insert to authenticated with check (public.is_admin_or_staff());
create policy "관리자 주문 시간 수정" on public.cafe_settings_v2 for update to authenticated using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "관리자 휴무 등록" on public.cafe_closures_v2 for insert to authenticated with check (public.is_admin_or_staff());
create policy "관리자 휴무 수정" on public.cafe_closures_v2 for update to authenticated using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "관리자 휴무 해제" on public.cafe_closures_v2 for delete to authenticated using (public.is_admin_or_staff());

create table public.announcements_v2 (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references public.profiles_v2 on delete set null,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 120),
  body text not null check (body = btrim(body) and char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
alter table public.announcements_v2 enable row level security;
revoke all on public.announcements_v2 from anon, authenticated;
grant select, insert (title, body), update (title, body), delete on public.announcements_v2 to authenticated;
create policy "회원 전체 소식 조회" on public.announcements_v2 for select to authenticated
  using (exists (select 1 from public.profiles_v2 where id = auth.uid()));
create policy "관리자 전체 소식 등록" on public.announcements_v2 for insert to authenticated
  with check (public.is_admin_or_staff() and author_id = auth.uid());
create policy "관리자 전체 소식 수정" on public.announcements_v2 for update to authenticated
  using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "관리자 전체 소식 삭제" on public.announcements_v2 for delete to authenticated using (public.is_admin_or_staff());
create trigger notify_announcements_v2 after insert or update or delete on public.announcements_v2
  for each statement execute function public.notify_village_cohort_v2();

create table public.cafe_revision_v2 (id boolean primary key default true check (id), revision bigint not null default 0);
insert into public.cafe_revision_v2 (id) values (true);
alter table public.cafe_revision_v2 enable row level security;
revoke all on public.cafe_revision_v2 from anon, authenticated;
grant select on public.cafe_revision_v2 to anon, authenticated;
create policy "카페 변경 번호 조회" on public.cafe_revision_v2 for select to anon, authenticated using (true);
alter publication supabase_realtime add table public.cafe_revision_v2;
create function public.notify_cafe_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.cafe_revision_v2 set revision = revision + 1;
  return null;
end $$;
create trigger notify_menus_v2 after insert or update or delete on public.menus_v2 for each statement execute function public.notify_cafe_v2();
create trigger notify_settings_v2 after insert or update or delete on public.cafe_settings_v2 for each statement execute function public.notify_cafe_v2();
create trigger notify_closures_v2 after insert or update or delete on public.cafe_closures_v2 for each statement execute function public.notify_cafe_v2();

revoke all on function public.is_pastor_v2(), public.save_roster_member_v2(uuid, text, text, date, text),
  public.delete_roster_member_v2(uuid), public.set_member_role_v2(uuid, public.app_role), public.lock_cohort_v2(uuid),
  public.create_cohort_v2(text, integer), public.create_village_v2(uuid, text), public.delete_village_v2(uuid),
  public.assign_members_v2(uuid, uuid[], uuid), public.set_village_leader_v2(uuid, uuid, boolean),
  public.enroll_profile_v2(), public.cafe_orders_v2(uuid, date), public.notify_cafe_v2() from public, anon, authenticated;
grant execute on function public.is_pastor_v2(), public.save_roster_member_v2(uuid, text, text, date, text),
  public.delete_roster_member_v2(uuid), public.set_member_role_v2(uuid, public.app_role),
  public.create_cohort_v2(text, integer), public.create_village_v2(uuid, text), public.delete_village_v2(uuid),
  public.assign_members_v2(uuid, uuid[], uuid), public.set_village_leader_v2(uuid, uuid, boolean),
  public.cafe_orders_v2(uuid, date) to authenticated;
