insert into public.cohorts_v2 (name, year, is_active) values ('3기', 2026, true);

insert into public.cafe_settings_v2 (weekday, opens_at, closes_at) values (7, '10:00', '14:30');

-- 2025 한신교회 DRINKS MENU 그대로. ICE 는 커피·논커피에서 +1,000, COLD DRINKS 는 ICE 전용이라 추가금이 없다.
insert into public.menus_v2 (category, name, price, ice_price_delta, options, sort_order) values
  ('coffee', '아메리카노', 1000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 1),
  ('coffee', '카페라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 2),
  ('coffee', '카푸치노', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 3),
  ('coffee', '바닐라라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 4),
  ('coffee', '카페모카', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 5),
  ('coffee', '카라멜 마끼아또', 2000, 1000, '{"temperature":["hot","ice"],"shot":2,"light":true,"syrup":true}', 6),
  ('non_coffee', '초코라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 1),
  ('non_coffee', '녹차라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 2),
  ('non_coffee', '단호박라떼', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 3),
  ('non_coffee', '유자차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 4),
  ('non_coffee', '생강차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 5),
  ('non_coffee', '자몽차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 6),
  ('non_coffee', '캐모마일', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 7),
  ('non_coffee', '루이보스', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 8),
  ('non_coffee', '녹차', 2000, 1000, '{"temperature":["hot","ice"],"shot":0,"light":true,"syrup":false}', 9),
  ('cold', '레몬 아이스티', 2000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 1),
  ('cold', '복숭아 아이스티', 2000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 2),
  ('cold', '아샷추', 2000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 3),
  ('cold', '카프리썬', 1000, 0, '{"temperature":["ice"],"shot":0,"light":false,"syrup":false}', 4);
