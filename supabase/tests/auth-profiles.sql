begin;
insert into auth.users (id, raw_user_meta_data, last_sign_in_at) values
  ('f2000000-0000-4000-8000-000000000001', '{"name":"테스트 청년", "role":"admin"}', '2026-09-01T00:00:00Z'),
  ('f2000000-0000-4000-8000-000000000002', '{"name":"다른 청년"}', '2026-09-01T00:00:00Z');

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001", "role":"authenticated"}';
do $$
declare p public.profiles_v2;
begin
  p := public.sync_my_profile_v2();
  assert p.name = '테스트 청년' and p.role = 'youth', 'Metadata must not grant a role';
  assert not p.show_gender and not p.show_birth_date and not p.show_phone, 'Privacy defaults';
  assert p.last_seen_at = '2026-09-01T00:00:00Z'::timestamptz, 'Use the server login timestamp';
end $$;

update public.profiles_v2 set name = '수정한 이름', gender = 'female', birth_date = '2000-02-29',
  phone = '01012345678', show_gender = true, show_birth_date = true, show_phone = true
where id = auth.uid();

do $$
declare p public.profiles_v2;
begin
  p := public.sync_my_profile_v2();
  assert p.name = '수정한 이름' and p.show_phone and p.birth_date = '2000-02-29', 'Sync preserves edits';
  assert p.last_seen_at = '2026-09-01T00:00:00Z'::timestamptz, 'Refetch is not a new login';
  begin
    update public.profiles_v2 set role = 'admin' where id = auth.uid();
    raise exception 'Role escalation was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles_v2 set last_seen_at = now() where id = auth.uid();
    raise exception 'Login timestamp tampering was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles_v2 set name = ' ' where id = auth.uid();
    raise exception 'Blank name was allowed';
  exception when check_violation then null; end;
  begin
    update public.profiles_v2 set phone = 'invalid' where id = auth.uid();
    raise exception 'Invalid phone was allowed';
  exception when check_violation then null; end;
  begin
    update public.profiles_v2 set gender = 'invalid' where id = auth.uid();
    raise exception 'Invalid gender was allowed';
  exception when check_violation then null; end;
  begin
    update public.profiles_v2 set birth_date = '9999-01-01' where id = auth.uid();
    raise exception 'Future birthday was allowed';
  exception when check_violation then null; end;
end $$;

set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000002", "role":"authenticated"}';
do $$
declare n int;
begin
  perform public.sync_my_profile_v2();
  assert (select count(*) = 1 from public.profiles_v2), 'Youth reads only self';
  update public.profiles_v2 set show_phone = false where id = 'f2000000-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'Cannot edit another profile';
end $$;

reset role;
update auth.users set last_sign_in_at = '2026-09-02T00:00:00Z' where id = 'f2000000-0000-4000-8000-000000000001';
update public.profiles_v2 set role = 'staff' where id = 'f2000000-0000-4000-8000-000000000001';
insert into public.cohorts_v2 (id, name, year) values
  ('f2000000-0000-4000-8000-000000000010', '테스트 지난 기수', 2025),
  ('f2000000-0000-4000-8000-000000000011', '테스트 현재 기수', 2026);
insert into public.orders_v2 (id, profile_id, cohort_id, service_date) values
  ('f2000000-0000-4000-8000-000000000020', 'f2000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000010', '2025-01-05'),
  ('f2000000-0000-4000-8000-000000000021', 'f2000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000011', timezone('Asia/Seoul', now())::date),
  ('f2000000-0000-4000-8000-000000000022', 'f2000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000011', timezone('Asia/Seoul', now())::date);
insert into public.order_items_v2 (id, order_id, menu_name) values
  ('f2000000-0000-4000-8000-000000000030', 'f2000000-0000-4000-8000-000000000020', '지난 주문'),
  ('f2000000-0000-4000-8000-000000000031', 'f2000000-0000-4000-8000-000000000021', '오늘 주문'),
  ('f2000000-0000-4000-8000-000000000032', 'f2000000-0000-4000-8000-000000000022', '다른 사람 주문');
update public.cafe_settings_v2 set weekday = extract(isodow from timezone('Asia/Seoul', now()))::int,
  opens_at = '00:00', closes_at = '24:00' where id;

set local role authenticated;
set local request.jwt.claims = '{"sub":"f2000000-0000-4000-8000-000000000001", "role":"authenticated"}';
do $$
declare p public.profiles_v2; v_order uuid;
begin
  p := public.sync_my_profile_v2();
  assert p.role = 'staff' and p.name = '수정한 이름', 'Sync preserves assigned role';
  assert p.last_seen_at = '2026-09-02T00:00:00Z'::timestamptz, 'New login updates timestamp';
  assert (select count(*) = 2 from public.orders_v2), 'Only own orders across cohorts';
  assert (select count(*) = 2 from public.order_items_v2), 'Only own items';
  assert (select count(distinct cohort_id) = 2 from public.orders_v2), 'Historical cohort retained';
  perform public.cancel_order_item('f2000000-0000-4000-8000-000000000031');
  assert (select status = 'cancelled' from public.order_items_v2 where id = 'f2000000-0000-4000-8000-000000000031');
  begin
    perform public.cancel_order_item('f2000000-0000-4000-8000-000000000030');
    raise exception 'Historical cancellation was allowed';
  exception when raise_exception then
    if sqlerrm <> 'NOT_YOUR_ORDER' then raise; end if;
  end;
  begin
    perform public.cancel_order_item('f2000000-0000-4000-8000-000000000032');
    raise exception 'Other user cancellation was allowed';
  exception when raise_exception then
    if sqlerrm <> 'NOT_YOUR_ORDER' then raise; end if;
  end;
  v_order := public.place_order((select jsonb_build_array(jsonb_build_object(
    'menu_id', id, 'options', '{"temperature":"hot","shot":0,"light":false,"syrup":false}'::jsonb, 'quantity', 1
  )) from public.menus_v2 where name = '아메리카노' limit 1));
  assert (select profile_id = auth.uid() and guest_token is null from public.orders_v2 where id = v_order), 'Member order ownership';
end $$;

set local role anon;
set local request.jwt.claims = '{}';
do $$
begin
  begin
    perform public.sync_my_profile_v2();
    raise exception 'Guest profile creation was allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.profiles_v2;
    raise exception 'Guest profile read was allowed';
  exception when insufficient_privilege then null; end;
  assert (select count(*) = 0 from public.orders_v2), 'Guest cannot read member orders';
  perform public.place_order((select jsonb_build_array(jsonb_build_object(
    'menu_id', id, 'options', '{"temperature":"hot","shot":0,"light":false,"syrup":false}'::jsonb, 'quantity', 1
  )) from public.menus_public_v2 where name = '아메리카노' limit 1), 'f2000000-0000-4000-8000-000000000040');
  assert (select count(*) = 1 from public.get_guest_orders('f2000000-0000-4000-8000-000000000040')), 'Guest ordering still works';
end $$;
reset role;
rollback;
