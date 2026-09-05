import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('마을·인증·주문 권한과 기수 보관을 로컬 PostgreSQL 트랜잭션에서 검증한다', () => {
  const migrations = ['0009_order_identity.sql', '0010_villages.sql'].map((file) => readFileSync(`supabase/migrations/${file}`, 'utf8'))
  const sql = String.raw`
begin;
${migrations[0]}
select to_regclass('public.villages_v2') is null as install_villages \gset
\if :install_villages
${migrations[1]}
\endif
create function pg_temp.id(n int) returns uuid language sql immutable as $$
  select ('f3000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
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

insert into auth.users (id, raw_user_meta_data, last_sign_in_at)
select pg_temp.id(n), jsonb_build_object('name', '인증 이름'), now() from generate_series(1, 8) n;
insert into auth.users (id, raw_user_meta_data, last_sign_in_at)
values (pg_temp.id(9), '{"name":"신규 청년","role":"admin"}', now());
insert into public.profiles_v2 (id, name, role, gender, birth_date, phone, show_gender)
select pg_temp.id(n), '테스트 ' || n,
  (case n when 4 then 'pastor' when 5 then 'staff' when 6 then 'admin' else 'youth' end)::public.app_role,
  'female', '2000-02-29', '01000000000', n = 2 from generate_series(1, 8) n;
update public.cohorts_v2 set is_active = false where is_active;
insert into public.cohorts_v2 (id, name, year, is_active)
values (pg_temp.id(201), 'P3 현재', 2026, true), (pg_temp.id(202), 'P3 이전', 2025, false);
insert into public.villages_v2 (id, cohort_id, name)
values (pg_temp.id(101), pg_temp.id(201), 'P3 사랑'), (pg_temp.id(102), pg_temp.id(201), 'P3 소망'),
  (pg_temp.id(103), pg_temp.id(202), 'P3 옛마을');
insert into public.village_members_v2 (cohort_id, profile_id, village_id, is_leader)
values (pg_temp.id(201), pg_temp.id(1), pg_temp.id(101), true),
  (pg_temp.id(201), pg_temp.id(2), pg_temp.id(101), false),
  (pg_temp.id(201), pg_temp.id(8), pg_temp.id(101), true),
  (pg_temp.id(201), pg_temp.id(3), pg_temp.id(102), true),
  (pg_temp.id(201), pg_temp.id(7), null, false),
  (pg_temp.id(202), pg_temp.id(1), pg_temp.id(103), true);
insert into public.village_posts_v2 (id, village_id, author_id, title, body)
values (pg_temp.id(301), pg_temp.id(101), pg_temp.id(8), '모임 안내', '첫 소식'),
  (pg_temp.id(302), pg_temp.id(102), pg_temp.id(3), '다른 마을', '다른 소식');
insert into public.prayer_requests_v2 (id, village_id, author_id, body)
values (pg_temp.id(401), pg_temp.id(101), pg_temp.id(1), '이장의 기도'),
  (pg_temp.id(402), pg_temp.id(102), pg_temp.id(3), '다른 마을 기도');

set local role anon;
select pg_temp.denied('select * from public.villages_v2', 'permission denied');
select pg_temp.denied('select * from public.village_members_public_v2', 'permission denied');
select pg_temp.denied('select * from public.prayer_requests_public_v2', 'permission denied');
select pg_temp.denied('select public.sync_my_profile_v2()', 'permission denied');
select pg_temp.denied('select public.village_calendar_v2()', 'permission denied');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(9)::text, true);
set local role authenticated;
select pg_temp.check_that((public.sync_my_profile_v2()).role = 'youth', '신규 프로필은 메타데이터 역할을 신뢰하지 않음');
select pg_temp.check_that((select not show_gender and not show_birth_date and not show_phone from public.profiles_v2 where id = auth.uid()), '신규 프로필 공개 기본값');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
select pg_temp.check_that((public.sync_my_profile_v2()).name = '테스트 2', '프로필 이름 유지');
select pg_temp.check_that((public.sync_my_profile_v2()).role = 'youth', '신규 역할 승격 금지');
select pg_temp.check_that((public.sync_my_profile_v2()).last_seen_at is not null, '마지막 로그인 기록');
select pg_temp.denied('update public.profiles_v2 set role = ''admin'' where id = auth.uid()', 'permission denied');
select pg_temp.denied('update public.profiles_v2 set village_revision = 999 where id = auth.uid()', 'permission denied');
select pg_temp.denied('update public.profiles_v2 set name = '''' where id = auth.uid()', 'profiles_v2_name_valid');
select pg_temp.denied('update public.profiles_v2 set phone = ''invalid'' where id = auth.uid()', 'profiles_v2_phone_valid');
select pg_temp.denied('update public.profiles_v2 set birth_date = ''9999-01-01'' where id = auth.uid()', 'profiles_v2_birth_date_valid');
select pg_temp.check_that((select count(*) from public.villages_v2) = 1, '본인 마을만 조회');
select pg_temp.check_that((select count(*) from public.village_members_public_v2) = 3, '본인 마을 명단만 조회');
select pg_temp.check_that((select count(*) from public.village_members_public_v2 where birth_date is not null or phone is not null) = 0, '비공개 정보 DB 마스킹');
select pg_temp.check_that((select count(*) from public.village_members_public_v2 where gender is not null) = 1, '성별만 공개');
select pg_temp.check_that((select count(*) from public.profiles_v2) = 1, '마을원 원본 프로필 차단');
select pg_temp.check_that((select count(*) from public.village_posts_public_v2) = 1, '다른 마을 소식 차단');
select pg_temp.check_that((select count(*) from public.prayer_requests_public_v2) = 1, '다른 마을 기도 차단');
select pg_temp.check_that(not has_table_privilege('authenticated', 'public.village_members_public_v2', 'INSERT,UPDATE,DELETE'), '명단 뷰 쓰기 권한 회수');
select pg_temp.check_that(not has_table_privilege('authenticated', 'public.village_posts_public_v2', 'INSERT,UPDATE,DELETE'), '소식 뷰 쓰기 권한 회수');
select pg_temp.check_that(not has_table_privilege('authenticated', 'public.prayer_requests_public_v2', 'INSERT,UPDATE,DELETE'), '기도 뷰 쓰기 권한 회수');
select pg_temp.denied('delete from public.village_members_public_v2', 'cannot delete');
select pg_temp.denied('update public.village_posts_public_v2 set body = ''변조''', 'cannot update');
select pg_temp.denied('delete from public.prayer_requests_public_v2', 'cannot delete');
select pg_temp.denied('insert into public.village_members_v2 (cohort_id, profile_id, village_id, is_leader) values (pg_temp.id(201), auth.uid(), pg_temp.id(102), true)', 'permission denied');
update public.villages_v2 set name = '불법 변경' where id = pg_temp.id(101);
select pg_temp.check_that((select name from public.villages_v2 where id = pg_temp.id(101)) = 'P3 사랑', '청년 마을명 변경 차단');
select pg_temp.denied('insert into public.village_posts_v2 (village_id, title, body) values (pg_temp.id(101), ''제목'', ''내용'')', 'row-level security');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), auth.uid(), current_date, ''worship'', true)', 'LEADER_REQUIRED');
select pg_temp.denied('select * from public.village_order_stats_v2(pg_temp.id(101), current_date)', 'LEADER_REQUIRED');
select pg_temp.denied('select public.touch_villages_v2(array[pg_temp.id(101)])', 'permission denied');
select pg_temp.denied('insert into public.prayer_requests_v2 (village_id, author_id, body) values (pg_temp.id(101), pg_temp.id(1), ''위조'')', 'permission denied');
select pg_temp.denied('insert into public.prayer_requests_v2 (village_id, body) values (pg_temp.id(102), ''침입'')', 'row-level security');
insert into public.prayer_requests_v2 (village_id, body) values (pg_temp.id(101), '내 기도');
update public.prayer_requests_v2 set body = '수정한 내 기도' where author_id = auth.uid();
update public.prayer_requests_v2 set body = '남의 기도 변조' where id = pg_temp.id(401);
delete from public.prayer_requests_v2 where id = pg_temp.id(401);
select pg_temp.check_that((select body from public.prayer_requests_v2 where id = pg_temp.id(401)) = '이장의 기도', '남의 기도 수정 삭제 차단');
select pg_temp.check_that((select body from public.prayer_requests_v2 where author_id = auth.uid()) = '수정한 내 기도', '본인 기도 수정');
delete from public.prayer_requests_v2 where author_id = auth.uid();
select pg_temp.check_that(not exists (select 1 from public.prayer_requests_v2 where author_id = auth.uid()), '본인 기도 삭제');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;
update public.villages_v2 set name = 'P3 새 이름' where id = pg_temp.id(101);
select pg_temp.check_that((select name from public.villages_v2 where id = pg_temp.id(101)) = 'P3 새 이름', '이장 마을명 변경');
update public.village_posts_v2 set body = '다른 이장도 수정' where id = pg_temp.id(301);
select pg_temp.check_that((select body from public.village_posts_v2 where id = pg_temp.id(301)) = '다른 이장도 수정', '여러 이장 소식 관리');
insert into public.village_posts_v2 (village_id, title, body) values (pg_temp.id(101), '새 소식', '소식 내용');
delete from public.village_posts_v2 where title = '새 소식';
select pg_temp.check_that(not exists(select 1 from public.village_posts_v2 where title = '새 소식'), '소식 삭제');
select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>'sunday')::date, 'worship', true);
select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>'sunday')::date, 'meeting', true);
select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>'sunday')::date, 'worship', false);
select pg_temp.check_that((select not worship and meeting from public.attendance_v2 where profile_id = pg_temp.id(2)), '다른 출석 항목 보존');
select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>'sunday')::date - 21, 'worship', true);
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>''sunday'')::date - 28, ''worship'', true)', 'ATTENDANCE_WINDOW_CLOSED');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>''sunday'')::date + 7, ''worship'', true)', 'ATTENDANCE_WINDOW_CLOSED');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>''sunday'')::date - 1, ''worship'', true)', 'ATTENDANCE_WINDOW_CLOSED');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), null, ''worship'', true)', 'ATTENDANCE_WINDOW_CLOSED');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(3), (public.village_calendar_v2()->>''sunday'')::date, ''worship'', true)', 'NOT_VILLAGE_MEMBER');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>''sunday'')::date, ''invalid'', true)', 'INVALID_ATTENDANCE');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(103), pg_temp.id(1), (public.village_calendar_v2()->>''sunday'')::date, ''worship'', true)', 'LEADER_REQUIRED');
select pg_temp.denied('insert into public.attendance_v2 (village_id, profile_id, service_date) values (pg_temp.id(101), pg_temp.id(1), current_date)', 'permission denied');
update public.villages_v2 set name = '옛마을 변경' where id = pg_temp.id(103);
select pg_temp.check_that((select name from public.villages_v2 where id = pg_temp.id(103)) = 'P3 옛마을', '지난 기수 읽기 전용');
reset role;

update public.cafe_settings_v2 set weekday = extract(isodow from timezone('Asia/Seoul', now())), opens_at = '00:00', closes_at = '24:00' where id;
delete from public.cafe_closures_v2 where closed_on = timezone('Asia/Seoul', now())::date;
insert into public.orders_v2 (id, cohort_id, profile_id, service_date)
values (pg_temp.id(501), pg_temp.id(201), pg_temp.id(2), timezone('Asia/Seoul', now())::date),
  (pg_temp.id(502), pg_temp.id(201), pg_temp.id(3), timezone('Asia/Seoul', now())::date);
insert into public.orders_v2 (id, cohort_id, guest_token, service_date)
values (pg_temp.id(503), pg_temp.id(201), pg_temp.id(900), timezone('Asia/Seoul', now())::date);
insert into public.order_items_v2 (id, order_id, menu_name, options, quantity)
values (pg_temp.id(601), pg_temp.id(501), '테스트 음료', '{"temperature":"hot","shot":0,"light":false,"syrup":false}', 2),
  (pg_temp.id(602), pg_temp.id(501), '테스트 음료', '{"temperature":"hot","shot":0,"light":false,"syrup":false}', 3),
  (pg_temp.id(603), pg_temp.id(502), '다른 마을 음료', '{}', 9),
  (pg_temp.id(604), pg_temp.id(503), '게스트 음료', '{}', 1);
select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;
select pg_temp.check_that((select quantity from public.village_order_stats_v2(pg_temp.id(101), timezone('Asia/Seoul', now())::date)) = 5, '메뉴 옵션별 수량 집계');
select pg_temp.denied('select * from public.village_order_stats_v2(pg_temp.id(102), current_date)', 'LEADER_REQUIRED');
reset role;
select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
select pg_temp.denied('select public.cancel_order_item(pg_temp.id(604), pg_temp.id(900))', 'NOT_YOUR_ORDER');
select pg_temp.denied('select public.get_guest_orders(pg_temp.id(900))', 'permission denied');
select public.cancel_order_item(pg_temp.id(601), pg_temp.id(900));
select pg_temp.check_that((select status from public.order_items_v2 where id = pg_temp.id(601)) = 'cancelled', '회원 본인 주문 취소');
reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select public.cancel_order_item(pg_temp.id(604), pg_temp.id(900));
reset role;
select pg_temp.check_that((select status from public.order_items_v2 where id = pg_temp.id(604)) = 'cancelled', '게스트 취소 유지');
select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;
select pg_temp.check_that((select quantity from public.village_order_stats_v2(pg_temp.id(101), timezone('Asia/Seoul', now())::date)) = 3, '취소 주문 집계 제외');
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
do $$ declare order_id uuid; begin
  select public.place_order(jsonb_build_array(jsonb_build_object('menu_id', id, 'quantity', 1,
    'options', jsonb_build_object('temperature', options->'temperature'->>0, 'shot', 0, 'light', false, 'syrup', false))), pg_temp.id(900))
  into order_id from public.menus_public_v2 where name = '아메리카노';
  perform pg_temp.check_that(exists(select 1 from public.orders_v2 o where o.id = order_id and o.profile_id = auth.uid()
    and o.guest_token is null and o.village_id = pg_temp.id(101)), '회원 주문은 게스트 토큰을 무시하고 소속 마을 기록');
end $$;
reset role;

select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
create temp table revisions as select id, village_revision from public.profiles_v2;
select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, true);
set local role authenticated;
update public.profiles_v2 set show_phone = true where id = auth.uid();
reset role;
select pg_temp.check_that((select p.village_revision > r.village_revision from public.profiles_v2 p join revisions r using (id) where p.id = pg_temp.id(1)), '공개 설정 변경 시 같은 마을 갱신');
select pg_temp.check_that((select p.village_revision = r.village_revision from public.profiles_v2 p join revisions r using (id) where p.id = pg_temp.id(3)), '공개 설정 변경을 다른 마을에 전달하지 않음');
select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, true);
set local role authenticated;
select pg_temp.check_that((select phone from public.village_members_public_v2 where village_id = pg_temp.id(101) and profile_id = pg_temp.id(2)) = '01000000000', '공개 설정 변경을 명단에 반영');
reset role;
update revisions r set village_revision = p.village_revision from public.profiles_v2 p where p.id = r.id;
update public.village_members_v2 set village_id = pg_temp.id(102), is_leader = true where cohort_id = pg_temp.id(201) and profile_id = pg_temp.id(1);
select pg_temp.check_that((select not is_leader from public.village_members_v2 where cohort_id = pg_temp.id(201) and profile_id = pg_temp.id(1)), '이동 시 이장 해제');
select pg_temp.check_that((select bool_and(p.village_revision > r.village_revision) from public.profiles_v2 p join revisions r using (id) where p.id in (pg_temp.id(1),pg_temp.id(2),pg_temp.id(3))), '이동 당사자와 양쪽 마을 갱신');
select pg_temp.check_that((select is_leader from public.village_members_v2 where cohort_id = pg_temp.id(202) and profile_id = pg_temp.id(1)), '지난 기수 배정 보존');
set local role authenticated;
select pg_temp.check_that(not exists(select 1 from public.villages_v2 where id = pg_temp.id(101)), '이전 마을 접근 해제');
select pg_temp.denied('select public.set_village_attendance_v2(pg_temp.id(101), pg_temp.id(2), (public.village_calendar_v2()->>''sunday'')::date, ''worship'', true)', 'LEADER_REQUIRED');
reset role;
update public.village_members_v2 set village_id = pg_temp.id(102) where cohort_id = pg_temp.id(201) and profile_id = pg_temp.id(2);
select pg_temp.check_that((select village_id from public.orders_v2 where id = pg_temp.id(501)) = pg_temp.id(101), '주문 당시 마을 보존');
select pg_temp.check_that((select count(*) from public.attendance_v2 where village_id = pg_temp.id(101)) = 2, '이동 후 출석 기록 보존');

select set_config('request.jwt.claim.sub', pg_temp.id(7)::text, true);
set local role authenticated;
select pg_temp.check_that((select count(*) from public.villages_v2) = 0, '미배정 사용자 마을 조회 없음');
select pg_temp.check_that((select count(*) from public.village_members_v2) = 1, '본인 미배정 상태 조회');
reset role;
do $$ declare n int; begin
  for n in 4..6 loop
    perform set_config('request.jwt.claim.sub', pg_temp.id(n)::text, true);
    set local role authenticated;
    perform pg_temp.check_that((select count(*) from public.villages_v2) >= 3, '전체 관리자 모든 마을 조회');
    perform pg_temp.check_that((select count(*) from public.prayer_requests_public_v2) >= 2, '전체 관리자 기도제목 조회');
    perform pg_temp.check_that((select phone from public.village_members_public_v2 where village_id = pg_temp.id(102) and profile_id = pg_temp.id(2)) = '01000000000', '전체 관리자 비공개 정보 조회');
    reset role;
  end loop;
end $$;
select 'VILLAGE_CHECKS_PASSED';
rollback;
`
  const output = execFileSync('docker', ['--config', `${process.cwd()}/.local/docker`, '--host', 'unix:///var/run/docker.sock',
    'exec', '-i', 'supabase_db_youth-hanshin-v2', 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'],
  { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  expect(output).toContain('VILLAGE_CHECKS_PASSED')
})
