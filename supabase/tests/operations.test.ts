import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('운영 권한·휴면 인원 보존·연간 편성·카페·전체 소식을 로컬 트랜잭션으로 검증한다', () => {
  const village = readFileSync('supabase/migrations/0010_villages.sql', 'utf8')
  const operations = readFileSync('supabase/migrations/0011_operations.sql', 'utf8')
  const sql = String.raw`
begin;
select to_regclass('public.villages_v2') is null as install_villages \gset
\if :install_villages
${village}
\endif
select to_regclass('public.roster_v2') is null as install_operations \gset
\if :install_operations
${operations}
\endif
create function pg_temp.id(n int) returns uuid language sql immutable as $$
  select ('f4000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;
create function pg_temp.check_that(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'CHECK FAILED: %', label; end if; end $$;
create function pg_temp.denied(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlerrm not like '%' || expected || '%' then raise; end if;
    return;
  end;
  raise exception 'UNEXPECTED ALLOW: %', statement;
end $$;

update public.cohorts_v2 set is_active = false where is_active;
insert into public.cohorts_v2 (id, name, year, is_active) values (pg_temp.id(201), '운영 검증 기수', 8000, true);
insert into auth.users (id, raw_user_meta_data, last_sign_in_at)
select pg_temp.id(n), '{"name":"운영 테스트"}', case when n = 4 then now() - interval '2 years' else now() end from generate_series(1, 6) n;
insert into public.profiles_v2 (id, auth_user_id, name, role, last_seen_at, birth_date)
select pg_temp.id(n), pg_temp.id(n), '운영 인원 ' || n,
  (case n when 1 then 'pastor' when 2 then 'staff' when 5 then 'admin' else 'youth' end)::public.app_role,
  case when n = 4 then now() - interval '2 years' else now() end, case when n = 4 then null else '2000-02-29'::date end
from generate_series(1, 5) n;
insert into public.profiles_v2 (id, name, created_at) values (pg_temp.id(7), '장기 미접속 직접 등록', now() - interval '2 years');
insert into public.villages_v2 (id, cohort_id, name) values (pg_temp.id(101), pg_temp.id(201), '운영 사랑'), (pg_temp.id(102), pg_temp.id(201), '운영 소망');

set local role anon;
select pg_temp.denied('select * from public.roster_v2', 'permission denied');
select pg_temp.denied('select * from public.announcements_v2', 'permission denied');
select pg_temp.denied('select public.create_cohort_v2(''불법'', 8001)', 'permission denied');
select pg_temp.denied('select * from public.cafe_orders_v2(null, current_date)', 'permission denied');
select pg_temp.denied('select price from public.menus_v2', 'permission denied');
select pg_temp.check_that((select count(*) from public.cafe_revision_v2) = 1, '게스트는 카페 변경 번호만 구독');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(3)::text, true);
set local role authenticated;
select pg_temp.check_that((select count(*) from public.roster_v2) = 0, '청년은 전체 명단 조회 차단');
select pg_temp.denied('select public.save_roster_member_v2(null, ''불법'', null, null, null)', 'MANAGER_REQUIRED');
select pg_temp.denied('select public.assign_members_v2(pg_temp.id(201), array[auth.uid()], pg_temp.id(101))', 'MANAGER_REQUIRED');
select pg_temp.denied('select public.create_village_v2(pg_temp.id(201), ''불법'')', 'MANAGER_REQUIRED');
select pg_temp.denied('select public.create_cohort_v2(''불법'', 8001)', 'MANAGER_REQUIRED');
select pg_temp.denied('select public.delete_village_v2(pg_temp.id(101))', 'MANAGER_REQUIRED');
select pg_temp.denied('select public.delete_roster_member_v2(pg_temp.id(4))', 'MANAGER_REQUIRED');
select pg_temp.denied('select public.set_member_role_v2(auth.uid(), ''staff'')', 'PASTOR_REQUIRED');
select pg_temp.denied('select * from public.cafe_orders_v2(pg_temp.id(201), current_date)', 'MANAGER_REQUIRED');
select pg_temp.denied('insert into public.announcements_v2 (title, body) values (''불법'', ''불법'')', 'row-level security');
select pg_temp.denied('insert into public.cafe_closures_v2 (closed_on) values (''8000-01-01'')', 'row-level security');
select pg_temp.denied('update public.profiles_v2 set role = ''staff'' where id = auth.uid()', 'permission denied');
select pg_temp.denied('update public.profiles_v2 set auth_user_id = auth.uid() where id = auth.uid()', 'permission denied');
select pg_temp.denied('insert into public.village_members_v2 (cohort_id, profile_id, is_leader) values (pg_temp.id(201), auth.uid(), true)', 'permission denied');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
select public.save_roster_member_v2(null, '수동 등록', 'female', null, '01000000000') as manual_id \gset
select pg_temp.check_that((select not has_account from public.roster_v2 where id = :'manual_id'), '카카오 계정 없이 인원 등록');
select pg_temp.check_that((select count(*) from public.village_members_v2 where profile_id = :'manual_id' and cohort_id = pg_temp.id(201)) = 1, '새 인원 현재 기수 미배정 등록');
select public.save_roster_member_v2(:'manual_id', '수정한 이름', null, '2001-01-01', null);
select pg_temp.check_that((select name = '수정한 이름' and phone is null from public.roster_v2 where id = :'manual_id'), '명단 수정');
select pg_temp.denied('select public.save_roster_member_v2(null, '' '', null, null, null)', 'profiles_v2_name_valid');
select pg_temp.denied('select public.save_roster_member_v2(null, ''오류'', null, null, ''bad'')', 'profiles_v2_phone_valid');
select pg_temp.check_that((select is_dormant from public.roster_v2 where id = pg_temp.id(4)), '1년 이상 미접속 표시');
select pg_temp.denied('select public.delete_roster_member_v2(pg_temp.id(4))', 'MANUAL_MEMBER_REQUIRED');
select pg_temp.denied('select public.delete_roster_member_v2(pg_temp.id(7))', 'MANUAL_MEMBER_REQUIRED');
select pg_temp.denied('select public.set_member_role_v2(pg_temp.id(3), ''staff'')', 'PASTOR_REQUIRED');
select pg_temp.denied('select public.set_village_leader_v2(pg_temp.id(201), pg_temp.id(3), true)', 'PASTOR_REQUIRED');
select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(3), pg_temp.id(4), :'manual_id'::uuid], pg_temp.id(101));
select pg_temp.check_that((select village_id = pg_temp.id(101) from public.village_members_v2 where cohort_id = pg_temp.id(201) and profile_id = pg_temp.id(4)), '장기 미접속자 배정 허용');
select pg_temp.denied('select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(999)], pg_temp.id(101))', 'INVALID_MEMBERS');
select pg_temp.denied('select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(3), null], pg_temp.id(101))', 'INVALID_MEMBERS');
select pg_temp.denied('select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(3)], pg_temp.id(999))', 'INVALID_VILLAGE');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;
select public.set_member_role_v2(pg_temp.id(3), 'staff');
select pg_temp.check_that((select role = 'staff' from public.roster_v2 where id = pg_temp.id(3)), '목회자 임원 지정');
select public.set_member_role_v2(pg_temp.id(3), 'youth');
select pg_temp.denied('select public.set_member_role_v2(pg_temp.id(3), ''pastor'')', 'INVALID_ROLE');
select pg_temp.denied('select public.set_member_role_v2(pg_temp.id(5), ''youth'')', 'INVALID_ROLE_TARGET');
select public.set_village_leader_v2(pg_temp.id(201), pg_temp.id(3), true);
select public.set_village_leader_v2(pg_temp.id(201), pg_temp.id(4), true);
select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(3)], pg_temp.id(101));
select pg_temp.check_that((select count(*) from public.village_members_v2 where village_id = pg_temp.id(101) and is_leader) = 2, '여러 이장·같은 마을 배정 시 이장 유지');
select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(3)], pg_temp.id(102));
select pg_temp.check_that((select not is_leader from public.village_members_v2 where profile_id = pg_temp.id(3) and cohort_id = pg_temp.id(201)), '이동 시 이장 해제');
select public.set_village_leader_v2(pg_temp.id(201), pg_temp.id(3), true);
select public.set_village_leader_v2(pg_temp.id(201), pg_temp.id(3), false);
select public.create_village_v2(pg_temp.id(201), '삭제용 마을') as removable_village \gset
select public.assign_members_v2(pg_temp.id(201), array[:'manual_id'::uuid], :'removable_village');
select public.delete_village_v2(:'removable_village');
select pg_temp.check_that((select village_id is null and not is_leader from public.village_members_v2 where profile_id = :'manual_id' and cohort_id = pg_temp.id(201)), '마을 삭제 시 인원 미배정');
select public.delete_roster_member_v2(:'manual_id');
select pg_temp.check_that(not exists (select 1 from public.roster_v2 where id = :'manual_id'), '직접 등록 명단 삭제');
reset role;

insert into public.attendance_v2 (village_id, profile_id, service_date, worship) values (pg_temp.id(101), pg_temp.id(4), '2026-09-06', true);
insert into public.menus_v2 (id, name, category, price, options) values (pg_temp.id(501), '과거 메뉴', 'coffee', 1000, '{"temperature":["ice"],"shot":2,"light":true,"syrup":false}');
insert into public.orders_v2 (id, cohort_id, profile_id, service_date) values (pg_temp.id(601), pg_temp.id(201), pg_temp.id(4), '2026-09-06');
insert into public.order_items_v2 (id, order_id, menu_id, menu_name, options, quantity) values (pg_temp.id(701), pg_temp.id(601), pg_temp.id(501), '과거 메뉴', '{"temperature":"ice","shot":1,"light":false,"syrup":false}', 2);
insert into public.order_items_v2 (id, order_id, menu_name, quantity, status) values (pg_temp.id(702), pg_temp.id(601), '취소 메뉴', 3, 'cancelled');
select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
select pg_temp.denied('select public.delete_village_v2(pg_temp.id(101))', 'VILLAGE_HAS_RECORDS');
select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(4)], pg_temp.id(102));
select pg_temp.check_that((select village_id = pg_temp.id(101) and quantity = 2 from public.cafe_orders_v2(pg_temp.id(201), '2026-09-06') where item_id = pg_temp.id(701)), '이동 후에도 주문 당시 마을로 집계');
select pg_temp.check_that((select count(*) from public.cafe_orders_v2(pg_temp.id(201), '2026-09-06')) = 2, '취소 상태를 포함한 운영 목록');
select pg_temp.check_that((select quantity = 2 from public.village_order_stats_v2(pg_temp.id(101), '2026-09-06')), '이장 통계 취소 제외');
update public.menus_v2 set name = '바뀐 메뉴', price = 2000 where id = pg_temp.id(501);
select pg_temp.denied('update public.menus_v2 set price = -1 where id = pg_temp.id(501)', 'menus_v2_price_valid');
select pg_temp.denied('update public.menus_v2 set options = ''{}'' where id = pg_temp.id(501)', 'menus_v2_options_valid');
select pg_temp.denied('update public.menus_v2 set options = ''{"temperature":[],"shot":0,"light":false,"syrup":false}'' where id = pg_temp.id(501)', 'menus_v2_options_valid');
delete from public.menus_v2 where id = pg_temp.id(501);
select pg_temp.check_that((select menu_name = '과거 메뉴' and quantity = 2 from public.cafe_orders_v2(pg_temp.id(201), '2026-09-06') where item_id = pg_temp.id(701)), '메뉴 삭제 후 주문 스냅샷 보관');
select revision as before_revision from public.cafe_revision_v2 \gset
insert into public.cafe_settings_v2 (id, weekday, opens_at, closes_at)
values (true, extract(isodow from timezone('Asia/Seoul', now()))::int, '00:00', '23:59:59')
on conflict (id) do update set id = excluded.id, weekday = excluded.weekday, opens_at = excluded.opens_at, closes_at = excluded.closes_at;
select pg_temp.denied('update public.cafe_settings_v2 set opens_at = ''14:00'', closes_at = ''10:00''', 'cafe_settings_v2_time_order');
insert into public.cafe_closures_v2 (closed_on, reason) values (timezone('Asia/Seoul', now())::date, '운영 검증') on conflict (closed_on) do update set closed_on = excluded.closed_on, reason = excluded.reason;
select pg_temp.check_that(not (public.cafe_status()->>'is_open')::boolean, '휴무는 주문을 닫음');
select pg_temp.denied('select public.place_order(''[]'')', 'ORDER_WINDOW_CLOSED');
delete from public.cafe_closures_v2 where closed_on = timezone('Asia/Seoul', now())::date;
select pg_temp.check_that((select revision > :before_revision from public.cafe_revision_v2), '카페 변경 알림');
select village_revision as before_news from public.profiles_v2 where id = pg_temp.id(2) \gset
insert into public.announcements_v2 (title, body) values ('전체 안내', '처음 내용') returning id as news_id \gset
update public.announcements_v2 set body = '수정 내용' where id = :'news_id';
select pg_temp.check_that((select village_revision > :before_news from public.profiles_v2 where id = pg_temp.id(2)), '소식 변경 알림');
select pg_temp.denied('insert into public.announcements_v2 (title, body) values ('' '', ''본문'')', 'check constraint');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(3)::text, true);
set local role authenticated;
select pg_temp.check_that((select body = '수정 내용' from public.announcements_v2 where id = :'news_id'), '청년 전체 소식 조회');
update public.announcements_v2 set body = '변조' where id = :'news_id';
delete from public.announcements_v2 where id = :'news_id';
select pg_temp.check_that((select body = '수정 내용' from public.announcements_v2 where id = :'news_id'), '청년 소식 수정·삭제 차단');
select pg_temp.check_that((select count(*) from public.menus_v2) = 0, '청년 메뉴 가격 비노출');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
delete from public.announcements_v2 where id = :'news_id';
select public.create_cohort_v2('다음 기수', 8001) as next_cohort \gset
select pg_temp.check_that((select village_id is null from public.village_members_v2 where cohort_id = :'next_cohort' and profile_id = pg_temp.id(4)), '휴면 인원도 다음 기수 편성 대상');
select pg_temp.check_that((select village_id = pg_temp.id(102) from public.village_members_v2 where cohort_id = pg_temp.id(201) and profile_id = pg_temp.id(4)), '지난 기수 배정 보관');
select pg_temp.check_that((select worship from public.attendance_v2 where village_id = pg_temp.id(101) and profile_id = pg_temp.id(4) and service_date = '2026-09-06'), '지난 기수 출석 보관');
select pg_temp.check_that((select count(*) from public.cafe_orders_v2(pg_temp.id(201), '2026-09-06')) = 2, '지난 기수 주문 보관');
select pg_temp.denied('select public.assign_members_v2(pg_temp.id(201), array[pg_temp.id(4)], null)', 'COHORT_READ_ONLY');
select pg_temp.denied('select public.create_village_v2(pg_temp.id(201), ''옛 마을'')', 'COHORT_READ_ONLY');
select pg_temp.denied('select public.assign_members_v2(public.active_cohort_id(), array[pg_temp.id(4)], pg_temp.id(102))', 'INVALID_VILLAGE');
select pg_temp.denied('select public.create_cohort_v2(''중복 연도'', 8001)', 'COHORT_YEAR_MUST_INCREASE');
select public.create_village_v2(:'next_cohort', '새 마을') as next_village \gset
select public.assign_members_v2(:'next_cohort', array[pg_temp.id(4)], :'next_village');
select pg_temp.check_that((select village_id = :'next_village' from public.village_members_v2 where cohort_id = :'next_cohort' and profile_id = pg_temp.id(4)), '장기 미접속자 다음 해 새로운 마을 배정');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(6)::text, true);
set local role authenticated;
select pg_temp.check_that((public.sync_my_profile_v2()).auth_user_id = auth.uid(), '새 카카오 가입자 인증 연결');
select pg_temp.check_that((select village_id is null from public.village_members_v2 where cohort_id = public.active_cohort_id() and profile_id = auth.uid()), '새 로그인 회원 현재 기수 등록');
reset role;
select pg_temp.check_that((select count(*) from auth.users where id = pg_temp.id(4)) = 1, '장기 미접속 카카오 계정 보존');
update auth.users set last_sign_in_at = now() where id = pg_temp.id(4);
select set_config('request.jwt.claim.sub', pg_temp.id(4)::text, true);
set local role authenticated;
select pg_temp.check_that((public.sync_my_profile_v2()).last_seen_at = now(), '재접속하면 마지막 접속 갱신');
select pg_temp.check_that((select village_id = :'next_village' from public.village_members_v2 where cohort_id = :'next_cohort' and profile_id = auth.uid()), '재접속 후에도 새 배정 유지');
reset role;
select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
select pg_temp.check_that((select not is_dormant from public.roster_v2 where id = pg_temp.id(4)), '재접속하면 장기 미접속 분류 해제');
reset role;
select 'OPERATIONS_CHECKS_PASSED';
rollback;
`
  const output = execFileSync('docker', ['--config', `${process.cwd()}/.local/docker`, '--host', 'unix:///var/run/docker.sock',
    'exec', '-i', 'supabase_db_youth-hanshin-v2', 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'],
  { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  expect(output).toContain('OPERATIONS_CHECKS_PASSED')
})
