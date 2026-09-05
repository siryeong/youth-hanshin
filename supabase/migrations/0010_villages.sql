create table public.villages_v2 (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts_v2,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, cohort_id),
  unique (cohort_id, name)
);

create table public.village_members_v2 (
  cohort_id uuid not null references public.cohorts_v2,
  profile_id uuid not null references public.profiles_v2 on delete cascade,
  village_id uuid,
  is_leader boolean not null default false,
  primary key (cohort_id, profile_id),
  foreign key (village_id, cohort_id) references public.villages_v2 (id, cohort_id),
  check (village_id is not null or not is_leader)
);
create index village_members_v2_village_idx on public.village_members_v2 (village_id);
create index village_members_v2_profile_idx on public.village_members_v2 (profile_id);

create table public.attendance_v2 (
  village_id uuid not null references public.villages_v2,
  profile_id uuid not null references public.profiles_v2 on delete cascade,
  service_date date not null check (extract(dow from service_date) = 0),
  worship boolean not null default false,
  meeting boolean not null default false,
  primary key (village_id, profile_id, service_date)
);

create table public.village_posts_v2 (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references public.villages_v2,
  author_id uuid not null default auth.uid() references public.profiles_v2 on delete cascade,
  title text not null check (title = btrim(title) and char_length(title) between 1 and 120),
  body text not null check (body = btrim(body) and char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index village_posts_v2_village_idx on public.village_posts_v2 (village_id, created_at desc);

create table public.prayer_requests_v2 (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references public.villages_v2,
  author_id uuid not null default auth.uid() references public.profiles_v2 on delete cascade,
  body text not null check (body = btrim(body) and char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index prayer_requests_v2_village_idx on public.prayer_requests_v2 (village_id, created_at desc);

alter table public.villages_v2 enable row level security;
alter table public.village_members_v2 enable row level security;
alter table public.attendance_v2 enable row level security;
alter table public.village_posts_v2 enable row level security;
alter table public.prayer_requests_v2 enable row level security;

revoke all on public.villages_v2, public.village_members_v2, public.attendance_v2,
  public.village_posts_v2, public.prayer_requests_v2 from anon, authenticated;
grant select on public.villages_v2, public.village_members_v2, public.attendance_v2,
  public.village_posts_v2, public.prayer_requests_v2 to authenticated;
grant update (name) on public.villages_v2 to authenticated;
grant insert (village_id, title, body), update (title, body), delete on public.village_posts_v2 to authenticated;
grant insert (village_id, body), update (body), delete on public.prayer_requests_v2 to authenticated;

create function public.is_village_member_v2(p_village_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.village_members_v2
    where village_id = p_village_id and profile_id = auth.uid());
$$;

create function public.can_read_village_v2(p_village_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin_or_staff() or public.is_village_member_v2(p_village_id);
$$;

create function public.is_active_village_v2(p_village_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.villages_v2 v join public.cohorts_v2 c on c.id = v.cohort_id
    where v.id = p_village_id and c.is_active);
$$;

create function public.is_village_leader_v2(p_village_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_village_v2(p_village_id) and exists (
    select 1 from public.village_members_v2
    where village_id = p_village_id and profile_id = auth.uid() and is_leader);
$$;

revoke all on function public.is_village_member_v2(uuid), public.can_read_village_v2(uuid),
  public.is_active_village_v2(uuid), public.is_village_leader_v2(uuid) from public, anon, authenticated;
grant execute on function public.is_village_member_v2(uuid), public.can_read_village_v2(uuid),
  public.is_active_village_v2(uuid), public.is_village_leader_v2(uuid) to authenticated;

create policy "소속 마을과 관리자의 마을 조회" on public.villages_v2
  for select to authenticated using (public.can_read_village_v2(id));
create policy "이장의 마을명 변경" on public.villages_v2
  for update to authenticated using (public.is_village_leader_v2(id)) with check (public.is_village_leader_v2(id));
create policy "소속 마을 배정과 본인 미배정 조회" on public.village_members_v2
  for select to authenticated using (profile_id = auth.uid() or public.can_read_village_v2(village_id));
create policy "소속 마을 출석 조회" on public.attendance_v2
  for select to authenticated using (public.can_read_village_v2(village_id));
create policy "소속 마을 소식 조회" on public.village_posts_v2
  for select to authenticated using (public.can_read_village_v2(village_id));
create policy "이장의 소식 등록" on public.village_posts_v2
  for insert to authenticated with check (author_id = auth.uid() and public.is_village_leader_v2(village_id));
create policy "이장의 소식 수정" on public.village_posts_v2
  for update to authenticated using (public.is_village_leader_v2(village_id)) with check (public.is_village_leader_v2(village_id));
create policy "이장의 소식 삭제" on public.village_posts_v2
  for delete to authenticated using (public.is_village_leader_v2(village_id));
create policy "소속 마을과 관리자의 기도제목 조회" on public.prayer_requests_v2
  for select to authenticated using (public.can_read_village_v2(village_id));
create policy "마을원의 기도제목 등록" on public.prayer_requests_v2
  for insert to authenticated with check (author_id = auth.uid()
    and public.is_village_member_v2(village_id) and public.is_active_village_v2(village_id));
create policy "본인 기도제목 수정" on public.prayer_requests_v2
  for update to authenticated using (author_id = auth.uid()
    and public.is_village_member_v2(village_id) and public.is_active_village_v2(village_id))
  with check (author_id = auth.uid() and public.is_village_member_v2(village_id) and public.is_active_village_v2(village_id));
create policy "본인 기도제목 삭제" on public.prayer_requests_v2
  for delete to authenticated using (author_id = auth.uid()
    and public.is_village_member_v2(village_id) and public.is_active_village_v2(village_id));

create view public.village_members_public_v2 with (security_barrier = true) as
  select m.cohort_id, m.village_id, m.profile_id, m.is_leader, p.name,
    case when p.show_gender or public.is_admin_or_staff() then p.gender end as gender,
    case when p.show_birth_date or public.is_admin_or_staff() then p.birth_date end as birth_date,
    case when p.show_phone or public.is_admin_or_staff() then p.phone end as phone
  from public.village_members_v2 m join public.profiles_v2 p on p.id = m.profile_id
  where public.can_read_village_v2(m.village_id);

create view public.village_posts_public_v2 with (security_barrier = true) as
  select n.*, p.name as author_name
  from public.village_posts_v2 n join public.profiles_v2 p on p.id = n.author_id
  where public.can_read_village_v2(n.village_id);

create view public.prayer_requests_public_v2 with (security_barrier = true) as
  select n.*, p.name as author_name
  from public.prayer_requests_v2 n join public.profiles_v2 p on p.id = n.author_id
  where public.can_read_village_v2(n.village_id);

revoke all on public.village_members_public_v2, public.village_posts_public_v2,
  public.prayer_requests_public_v2 from anon, authenticated;
grant select on public.village_members_public_v2, public.village_posts_public_v2,
  public.prayer_requests_public_v2 to authenticated;

create function public.village_calendar_v2() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('today', today, 'sunday', sunday, 'editable_from', sunday - 21)
  from (select today, today - extract(dow from today)::int as sunday
    from (select timezone('Asia/Seoul', now())::date as today) d) s;
$$;

create function public.set_village_attendance_v2(
  p_village_id uuid, p_profile_id uuid, p_service_date date, p_kind text, p_present boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare v_sunday date := (public.village_calendar_v2()->>'sunday')::date;
begin
  if not public.is_village_leader_v2(p_village_id) then raise exception 'LEADER_REQUIRED'; end if;
  if p_service_date is null or extract(dow from p_service_date) <> 0
    or p_service_date not between v_sunday - 21 and v_sunday then
    raise exception 'ATTENDANCE_WINDOW_CLOSED';
  end if;
  if p_kind is null or p_kind not in ('worship', 'meeting') or p_present is null then
    raise exception 'INVALID_ATTENDANCE';
  end if;
  if not exists (select 1 from public.village_members_v2
    where village_id = p_village_id and profile_id = p_profile_id) then
    raise exception 'NOT_VILLAGE_MEMBER';
  end if;
  insert into public.attendance_v2 (village_id, profile_id, service_date, worship, meeting)
  values (p_village_id, p_profile_id, p_service_date,
    case when p_kind = 'worship' then p_present else false end,
    case when p_kind = 'meeting' then p_present else false end)
  on conflict (village_id, profile_id, service_date) do update set
    worship = case when p_kind = 'worship' then p_present else attendance_v2.worship end,
    meeting = case when p_kind = 'meeting' then p_present else attendance_v2.meeting end;
end $$;

create function public.clear_moved_leader_v2() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.village_id is distinct from old.village_id or new.cohort_id is distinct from old.cohort_id then
    new.is_leader := false;
  end if;
  return new;
end $$;
create trigger clear_moved_leader_v2 before update on public.village_members_v2
  for each row execute function public.clear_moved_leader_v2();

alter table public.orders_v2 add column village_id uuid references public.villages_v2;
create index orders_v2_village_idx on public.orders_v2 (village_id, service_date);

create function public.capture_order_village_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select village_id into new.village_id from public.village_members_v2
    where profile_id = new.profile_id and cohort_id = new.cohort_id;
  return new;
end $$;
create trigger capture_order_village_v2 before insert on public.orders_v2
  for each row execute function public.capture_order_village_v2();

create function public.village_order_stats_v2(p_village_id uuid, p_service_date date)
returns table (menu_name text, options jsonb, quantity bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_village_leader_v2(p_village_id) or public.is_admin_or_staff()) then
    raise exception 'LEADER_REQUIRED';
  end if;
  return query select i.menu_name, i.options, sum(i.quantity)
    from public.orders_v2 o join public.order_items_v2 i on i.order_id = o.id
    where o.village_id = p_village_id and o.service_date = p_service_date and i.status = 'ordered'
    group by i.menu_name, i.options order by i.menu_name, i.options;
end $$;

alter table public.profiles_v2 add column village_revision bigint not null default 0;

-- ponytail: 70명 규모에서는 본인 프로필의 변경 번호로 마을 전체를 재조회한다. 규모가 커지면 private Broadcast로 교체한다.
create function public.touch_villages_v2(p_village_ids uuid[], p_profile_ids uuid[] default '{}') returns void
language sql security definer set search_path = '' as $$
  update public.profiles_v2 set village_revision = village_revision + 1
  where id = any(p_profile_ids) or role in ('admin', 'pastor', 'staff') or id in (
    select profile_id from public.village_members_v2 where village_id = any(p_village_ids));
$$;

create function public.notify_village_change_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.touch_villages_v2(
    array[(to_jsonb(old)->>tg_argv[0])::uuid, (to_jsonb(new)->>tg_argv[0])::uuid],
    array[(to_jsonb(old)->>'profile_id')::uuid, (to_jsonb(new)->>'profile_id')::uuid]);
  return null;
end $$;
create trigger notify_village_v2 after insert or update or delete on public.villages_v2
  for each row execute function public.notify_village_change_v2('id');
create trigger notify_members_v2 after insert or update or delete on public.village_members_v2
  for each row execute function public.notify_village_change_v2('village_id');
create trigger notify_attendance_v2 after insert or update or delete on public.attendance_v2
  for each row execute function public.notify_village_change_v2('village_id');
create trigger notify_posts_v2 after insert or update or delete on public.village_posts_v2
  for each row execute function public.notify_village_change_v2('village_id');
create trigger notify_prayers_v2 after insert or update or delete on public.prayer_requests_v2
  for each row execute function public.notify_village_change_v2('village_id');

create function public.notify_village_profile_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.touch_villages_v2(array(select village_id from public.village_members_v2 where profile_id = new.id));
  return null;
end $$;
create trigger notify_village_profile_v2 after update of name, gender, birth_date, phone,
  show_gender, show_birth_date, show_phone, role on public.profiles_v2
  for each row execute function public.notify_village_profile_v2();

create function public.notify_village_order_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.touch_villages_v2(array(select village_id from public.orders_v2
    where id in (old.order_id, new.order_id)));
  return null;
end $$;
create trigger notify_village_order_v2 after insert or update or delete on public.order_items_v2
  for each row execute function public.notify_village_order_v2();

create function public.notify_village_cohort_v2() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.touch_villages_v2(array(select id from public.villages_v2 where cohort_id = new.id));
  return null;
end $$;
create trigger notify_village_cohort_v2 after update on public.cohorts_v2
  for each row execute function public.notify_village_cohort_v2();

revoke all on function public.village_calendar_v2(), public.set_village_attendance_v2(uuid, uuid, date, text, boolean),
  public.village_order_stats_v2(uuid, date), public.clear_moved_leader_v2(), public.capture_order_village_v2(),
  public.touch_villages_v2(uuid[], uuid[]), public.notify_village_change_v2(), public.notify_village_profile_v2(),
  public.notify_village_order_v2(), public.notify_village_cohort_v2() from public, anon, authenticated;
grant execute on function public.village_calendar_v2(), public.set_village_attendance_v2(uuid, uuid, date, text, boolean),
  public.village_order_stats_v2(uuid, date) to authenticated;
