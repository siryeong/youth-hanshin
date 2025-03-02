import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// 환경 변수
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = isProduction || process.env.USE_SUPABASE === 'true';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// PostgreSQL 설정
const pgConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'youth_hanshin',
};

// 타입 정의
export type Village = {
  id: number;
  name: string;
  created_at?: string;
};

export type VillageMember = {
  id: number;
  name: string;
  village_id: number;
  created_at?: string;
};

export type MenuCategory = {
  id: number;
  name: string;
  created_at?: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  category_id: number;
  image_path: string;
  is_temperature_required: boolean;
  created_at?: string;
  updated_at?: string;
  // 조인된 필드
  category?: string;
};

export type Order = {
  id: number;
  village_id: number;
  member_name: string;
  is_custom_name: boolean;
  menu_item_id: number;
  temperature?: 'hot' | 'ice' | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  // 조인된 필드
  village?: string;
  menu_item?: string;
};

// PostgreSQL 연결 풀
let pgPool: Pool | null = null;

// Supabase 클라이언트
let supabaseClient: ReturnType<typeof createClient> | null = null;

// PostgreSQL 연결 초기화
const initPgPool = () => {
  if (!pgPool) {
    pgPool = new Pool(pgConfig);
  }
  return pgPool;
};

// Supabase 클라이언트 초기화
const initSupabaseClient = () => {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

// 현재 환경에 맞는 데이터베이스 클라이언트 가져오기
export const getDbClient = () => {
  if (useSupabase) {
    return initSupabaseClient();
  } else {
    return initPgPool();
  }
};

// PostgreSQL 쿼리 실행 함수
export async function pgQuery(text: string, params?: unknown[]) {
  const pool = initPgPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('실행된 PG 쿼리', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('PG 쿼리 오류', { text, error });
    throw error;
  }
}

// 데이터베이스 연결 종료
export async function closeConnections() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}

// 현재 사용 중인 데이터베이스 타입 반환
export const getDatabaseType = () => (useSupabase ? 'supabase' : 'postgres');

// Supabase 클라이언트 직접 접근 (필요한 경우)
export const getSupabaseClient = () => initSupabaseClient();
