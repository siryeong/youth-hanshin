-- anon 은 order_items_v2 에 select 정책이 없고 postgres_changes 는 RLS 를 따르므로,
-- 이 publication 만으로는 게스트에게 이벤트가 가지 않는다(실측 확인). 2단계에서 로그인
-- 사용자에게 '본인 주문 항목만 읽는다' 정책이 생기면 그때부터 동작한다.
alter publication supabase_realtime add table public.order_items_v2;
