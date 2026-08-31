alter table public.cohorts_v2       enable row level security;
alter table public.profiles_v2      enable row level security;
alter table public.menus_v2         enable row level security;
alter table public.cafe_settings_v2 enable row level security;
alter table public.cafe_closures_v2 enable row level security;
alter table public.orders_v2        enable row level security;
alter table public.order_items_v2   enable row level security;

create function public.is_admin_or_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles_v2
    where id = auth.uid() and role in ('admin', 'pastor', 'staff')
  );
$$;

-- 가격이 없는 공개 뷰. 뷰 소유자 권한으로 읽으므로 menus 의 RLS 를 우회한다.
create view public.menus_public_v2 as
  select id, category, name, options, sort_order
  from public.menus_v2
  where is_active
  order by sort_order;

grant select on public.menus_public_v2 to anon, authenticated;

create policy "관리자만 메뉴 원본을 읽는다" on public.menus_v2
  for select to authenticated using (public.is_admin_or_staff());

create policy "주문 시간은 누구나 읽는다" on public.cafe_settings_v2
  for select to anon, authenticated using (true);

create policy "휴무일은 누구나 읽는다" on public.cafe_closures_v2
  for select to anon, authenticated using (true);

create policy "본인 주문만 읽는다" on public.orders_v2
  for select to authenticated using (profile_id = auth.uid());

create policy "본인 주문 항목만 읽는다" on public.order_items_v2
  for select to authenticated using (
    exists (select 1 from public.orders_v2 o where o.id = order_id and o.profile_id = auth.uid())
  );

create policy "본인 프로필만 읽는다" on public.profiles_v2
  for select to authenticated using (id = auth.uid() or public.is_admin_or_staff());

create policy "기수는 로그인 사용자가 읽는다" on public.cohorts_v2
  for select to authenticated using (true);
