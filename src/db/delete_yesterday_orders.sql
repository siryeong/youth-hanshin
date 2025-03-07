-- 참고: 이 쿼리는 오늘 날짜 이전의 모든 주문을 삭제합니다.
-- 즉, 어제까지의 모든 주문 내역이 삭제됩니다.
-- 주의: 실행 전에 반드시 백업을 확인하세요. 삭제된 데이터는 복구할 수 없습니다.

-- =====================================================
-- 매일 아침 9시에 실행하는 크론 스케줄 설정
-- =====================================================

-- pg_cron 확장이 설치되어 있는지 확인
-- Supabase에서는 기본적으로 pg_cron 확장이 제공됩니다.
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 크론 작업 생성
-- 매일 아침 9시(KST)에 실행 (UTC 기준 0시)
-- 참고: 서버 시간이 UTC인 경우 KST(한국 시간)는 UTC+9이므로 
-- 한국 시간 9시는 UTC 기준 0시입니다.
-- 서버 시간대가 다른 경우 적절히 조정하세요.

-- 크론 로그 테이블 생성
CREATE TABLE IF NOT EXISTS cron_logs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  affected_rows INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 작업이 있으면 삭제
-- SELECT cron.unschedule('delete_old_orders');

-- 새 작업 스케줄링
SELECT cron.schedule(
  'delete_old_orders',                -- 작업 이름
  '0 0 * * *',                        -- 크론 표현식: 매일 00:00 UTC (한국 시간 09:00)
  $$
  -- 어제까지의 모든 주문 내역 삭제
  DELETE FROM orders WHERE created_at < CURRENT_DATE;
  
  -- 로그 테이블에 실행 기록 남기기
  INSERT INTO cron_logs (job_name, executed_at, affected_rows)
  VALUES ('delete_old_orders', NOW(), (SELECT COUNT(*) FROM orders WHERE created_at < CURRENT_DATE));
  $$
);

-- 현재 스케줄된 작업 확인
SELECT * FROM cron.job; 