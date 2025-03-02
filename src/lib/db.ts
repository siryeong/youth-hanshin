import { Pool } from 'pg';

// 데이터베이스 연결 설정
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'youth_hanshin',
});

// 쿼리 실행 함수
export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('실행된 쿼리', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('쿼리 오류', { text, error });
    throw error;
  }
}

// 데이터베이스 연결 종료
export async function end() {
  await pool.end();
}

// 데이터베이스 연결 테스트
export async function testConnection() {
  try {
    const res = await query('SELECT NOW()');
    return { connected: true, timestamp: res.rows[0].now };
  } catch (error) {
    console.error('데이터베이스 연결 오류', error);
    return { connected: false, error };
  }
}
