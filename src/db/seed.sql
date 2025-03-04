-- Supabase 초기 데이터 삽입
-- 최종 업데이트: 2024-03-04

-- 마을 데이터 삽입
INSERT INTO "villages" ("name") VALUES
('1마을'),
('2마을'),
('3마을'),
('4마을'),
('5마을'),
('6마을'),
('7마을'),
('8마을'),
('9마을'),
('10마을'),
('11마을'),
('12마을')
ON CONFLICT DO NOTHING;

-- 메뉴 카테고리 삽입
INSERT INTO "menu_categories" ("name") VALUES
('커피'),
('논커피'),
('티'),
('에이드'),
('스무디'),
('디저트')
ON CONFLICT DO NOTHING;

-- 메뉴 아이템 삽입 (카테고리 ID는 실제 데이터베이스의 ID와 일치해야 함)
INSERT INTO "menu_items" ("name", "description", "category_id", "image_path", "is_temperature_required") VALUES
-- 커피 (카테고리 ID: 1)
('아메리카노', '깔끔한 에스프레소와 물의 조화', 1, '/images/menu/americano.jpg', true),
('카페라떼', '에스프레소와 우유의 부드러운 조화', 1, '/images/menu/latte.jpg', true),
('바닐라라떼', '바닐라 시럽이 들어간 달콤한 라떼', 1, '/images/menu/vanilla-latte.jpg', true),
('카푸치노', '에스프레소와 우유 거품의 클래식한 조화', 1, '/images/menu/cappuccino.jpg', true),
('카라멜 마끼아또', '카라멜 시럽이 들어간 달콤한 마끼아또', 1, '/images/menu/caramel-macchiato.jpg', true),

-- 논커피 (카테고리 ID: 2)
('초콜릿', '진한 초콜릿의 달콤함', 2, '/images/menu/chocolate.jpg', true),
('녹차라떼', '부드러운 녹차와 우유의 조화', 2, '/images/menu/green-tea-latte.jpg', true),
('고구마라떼', '달콤한 고구마와 우유의 조화', 2, '/images/menu/sweet-potato-latte.jpg', true),

-- 티 (카테고리 ID: 3)
('얼그레이', '베르가못 향이 특징인 홍차', 3, '/images/menu/earl-grey.jpg', true),
('캐모마일', '은은한 향의 허브티', 3, '/images/menu/chamomile.jpg', true),
('페퍼민트', '상쾌한 민트향의 허브티', 3, '/images/menu/peppermint.jpg', true),

-- 에이드 (카테고리 ID: 4)
('레몬에이드', '상큼한 레몬의 맛', 4, '/images/menu/lemon-ade.jpg', false),
('자몽에이드', '새콤달콤한 자몽의 맛', 4, '/images/menu/grapefruit-ade.jpg', false),
('청포도에이드', '달콤한 청포도의 맛', 4, '/images/menu/green-grape-ade.jpg', false),

-- 스무디 (카테고리 ID: 5)
('딸기 스무디', '신선한 딸기의 달콤함', 5, '/images/menu/strawberry-smoothie.jpg', false),
('망고 스무디', '열대과일 망고의 달콤함', 5, '/images/menu/mango-smoothie.jpg', false),
('블루베리 스무디', '새콤달콤한 블루베리의 맛', 5, '/images/menu/blueberry-smoothie.jpg', false),

-- 디저트 (카테고리 ID: 6)
('치즈케이크', '부드러운 치즈의 풍미', 6, '/images/menu/cheesecake.jpg', false),
('초코 브라우니', '진한 초콜릿의 달콤함', 6, '/images/menu/brownie.jpg', false),
('크로플', '바삭한 크로플의 식감', 6, '/images/menu/croffle.jpg', false)
ON CONFLICT DO NOTHING;

-- 샘플 마을 주민 데이터 삽입
INSERT INTO "village_members" ("name", "village_id") VALUES
-- 1마을 주민
('김철수', 1),
('이영희', 1),
('박지민', 1),
-- 2마을 주민
('정민준', 2),
('한소희', 2),
('윤서연', 2),
-- 3마을 주민
('최준호', 3),
('강다은', 3),
('임현우', 3)
ON CONFLICT DO NOTHING;

-- 샘플 주문 데이터 삽입
INSERT INTO "orders" ("village_id", "member_name", "is_custom_name", "menu_item_id", "temperature", "status") VALUES
-- 1마을 주문
(1, '김철수', false, 1, 'hot', 'completed'),
(1, '이영희', false, 5, 'iced', 'completed'),
(1, '박지민', false, 12, NULL, 'completed'),
(1, '손님', true, 3, 'hot', 'completed'),

-- 2마을 주문
(2, '정민준', false, 2, 'iced', 'completed'),
(2, '한소희', false, 7, 'hot', 'completed'),
(2, '윤서연', false, 15, NULL, 'completed'),
(2, '손님', true, 18, NULL, 'completed'),

-- 3마을 주문
(3, '최준호', false, 4, 'hot', 'completed'),
(3, '강다은', false, 9, 'hot', 'completed'),
(3, '임현우', false, 13, NULL, 'completed'),

-- 진행 중인 주문
(1, '김철수', false, 6, 'iced', 'pending'),
(2, '정민준', false, 8, 'hot', 'pending'),
(3, '최준호', false, 14, NULL, 'pending'),
(1, '손님', true, 19, NULL, 'pending'),

-- 준비 중인 주문
(2, '한소희', false, 10, 'iced', 'preparing'),
(3, '강다은', false, 11, 'hot', 'preparing'),
(1, '박지민', false, 16, NULL, 'preparing')
ON CONFLICT DO NOTHING;

-- 관리자 사용자 추가 (비밀번호는 해싱된 값으로 대체해야 함)
INSERT INTO "users" ("name", "email", "password", "is_admin") VALUES
('관리자', 'admin@example.com', 'hashed_password_here', true)
ON CONFLICT (email) DO NOTHING;