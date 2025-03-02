import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
