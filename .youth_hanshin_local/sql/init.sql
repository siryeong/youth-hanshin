-- 마을 테이블
CREATE TABLE villages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 마을 주민 테이블
CREATE TABLE village_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, village_id)
);

-- 메뉴 카테고리 테이블
CREATE TABLE menu_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 메뉴 아이템 테이블
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES menu_categories(id),
  image_path VARCHAR(255),
  is_temperature_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 주문 테이블
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id),
  member_name VARCHAR(100) NOT NULL,
  is_custom_name BOOLEAN DEFAULT FALSE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  temperature VARCHAR(10) CHECK (temperature IN ('hot', 'ice', NULL)),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 삽입: 마을
INSERT INTO villages (name) VALUES 
  ('한신 1'), ('한신 2'), ('한신 3'), ('한신 4'), ('한신 5'), ('한신 6'), ('한신 7');

-- 초기 데이터 삽입: 마을 주민
INSERT INTO village_members (name, village_id) VALUES
  ('김영희', (SELECT id FROM villages WHERE name = '한신 1')),
  ('이철수', (SELECT id FROM villages WHERE name = '한신 1')),
  ('박지민', (SELECT id FROM villages WHERE name = '한신 1')),
  ('정민준', (SELECT id FROM villages WHERE name = '한신 2')),
  ('최서연', (SELECT id FROM villages WHERE name = '한신 2')),
  ('강도현', (SELECT id FROM villages WHERE name = '한신 3')),
  ('윤지우', (SELECT id FROM villages WHERE name = '한신 3')),
  ('장하은', (SELECT id FROM villages WHERE name = '한신 4')),
  ('송민수', (SELECT id FROM villages WHERE name = '한신 4')),
  ('이지훈', (SELECT id FROM villages WHERE name = '한신 5')),
  ('김하늘', (SELECT id FROM villages WHERE name = '한신 5')),
  ('박준호', (SELECT id FROM villages WHERE name = '한신 6')),
  ('최유진', (SELECT id FROM villages WHERE name = '한신 6')),
  ('정다은', (SELECT id FROM villages WHERE name = '한신 7')),
  ('김태민', (SELECT id FROM villages WHERE name = '한신 7'));

-- 초기 데이터 삽입: 메뉴 카테고리
INSERT INTO menu_categories (name) VALUES 
  ('coffee'), ('tea'), ('dessert');

-- 초기 데이터 삽입: 메뉴 아이템
INSERT INTO menu_items (name, description, category_id, image_path, is_temperature_required) VALUES
  ('아메리카노', '깊고 풍부한 에스프레소에 물을 더한 클래식한 커피', 
   (SELECT id FROM menu_categories WHERE name = 'coffee'), '/images/americano.jpg', TRUE),
  ('카페 라떼', '에스프레소와 스팀 밀크의 완벽한 조화', 
   (SELECT id FROM menu_categories WHERE name = 'coffee'), '/images/latte.jpg', TRUE),
  ('카푸치노', '에스프레소, 스팀 밀크, 그리고 풍성한 우유 거품의 조화', 
   (SELECT id FROM menu_categories WHERE name = 'coffee'), '/images/cappuccino.jpg', TRUE),
  ('녹차', '향긋한 녹차의 풍미를 느낄 수 있는 차', 
   (SELECT id FROM menu_categories WHERE name = 'tea'), '/images/green-tea.jpg', TRUE),
  ('얼그레이 티', '베르가못 오일의 향이 특징인 홍차', 
   (SELECT id FROM menu_categories WHERE name = 'tea'), '/images/earl-grey.jpg', TRUE),
  ('치즈케이크', '부드럽고 크리미한 뉴욕 스타일 치즈케이크', 
   (SELECT id FROM menu_categories WHERE name = 'dessert'), '/images/cheesecake.jpg', FALSE),
  ('초코 브라우니', '진한 초콜릿의 맛이 일품인 브라우니', 
   (SELECT id FROM menu_categories WHERE name = 'dessert'), '/images/brownie.jpg', FALSE); 