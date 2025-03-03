import { getDbClient, getSupabaseClient, getDatabaseType } from './db-manager';
import { prisma } from './prisma';

// 타입 정의는 db-manager.ts로 이동했으므로 여기서는 재내보내기만 합니다.
export type { Village, VillageMember, MenuCategory, MenuItem, Order } from './db-manager';

// 하위 호환성을 위해 supabase 객체 내보내기
export const supabase = getSupabaseClient();

// 현재 사용 중인 데이터베이스 타입 내보내기
export const databaseType = getDatabaseType();

// 데이터베이스 클라이언트 내보내기
export const dbClient = getDbClient();

// Prisma 클라이언트 내보내기
export { prisma };
