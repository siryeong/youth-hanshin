-- Supabase 는 새 뷰에도 ALTER DEFAULT PRIVILEGES 로 anon·authenticated 에 ALL 을 준다.
-- 이 뷰는 소유자 권한으로 돌기 때문에(그래야 가격 없는 목록을 게스트가 읽는다)
-- 쓰기 권한이 남아 있으면 menus_v2 의 RLS 를 그대로 우회한다. 읽기만 남긴다.
revoke all on public.menus_public_v2 from anon, authenticated;
grant select on public.menus_public_v2 to anon, authenticated;
