-- Supabase 스키마 정의

-- 타임스탬프 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON "users" ("email");

-- 마을 테이블
CREATE TABLE IF NOT EXISTS "villages" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 마을 주민 테이블
CREATE TABLE IF NOT EXISTS "village_members" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "village_id" INTEGER NOT NULL REFERENCES "villages" ("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 메뉴 카테고리 테이블
CREATE TABLE IF NOT EXISTS "menu_categories" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 메뉴 아이템 테이블
CREATE TABLE IF NOT EXISTS "menu_items" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL REFERENCES "menu_categories" ("id") ON DELETE CASCADE,
    "image_path" TEXT,
    "is_temperature_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 주문 테이블
CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL PRIMARY KEY,
    "village_id" INTEGER NOT NULL REFERENCES "villages" ("id") ON DELETE CASCADE,
    "member_name" TEXT NOT NULL,
    "is_custom_name" BOOLEAN NOT NULL DEFAULT false,
    "menu_item_id" INTEGER NOT NULL REFERENCES "menu_items" ("id") ON DELETE CASCADE,
    "temperature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 타임스탬프 자동 업데이트 트리거 설정
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villages_updated_at
BEFORE UPDATE ON "villages"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_village_members_updated_at
BEFORE UPDATE ON "village_members"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
BEFORE UPDATE ON "menu_categories"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON "menu_items"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON "orders"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 


-- 카페 설정 테이블
CREATE TABLE IF NOT EXISTS "cafe_settings" (
    "id" SERIAL PRIMARY KEY,
    "opening_hour" INTEGER NOT NULL DEFAULT 10,
    "closing_hour" INTEGER NOT NULL DEFAULT 14,
    "open_days" INTEGER[] NOT NULL DEFAULT '{0}',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 타임스탬프 자동 업데이트 트리거 설정
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 카페 설정 테이블에 대한 트리거 설정
CREATE TRIGGER update_cafe_settings_updated_at
BEFORE UPDATE ON "cafe_settings"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 