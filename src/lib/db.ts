import { prisma } from './prisma';

// 데이터베이스 연결 테스트
export async function testConnection() {
  try {
    // Prisma를 사용하여 현재 시간 조회
    const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;
    return { connected: true, timestamp: result[0].now };
  } catch (error) {
    console.error('데이터베이스 연결 오류', error);
    return { connected: false, error };
  }
}

// 데이터베이스 연결 종료 (필요한 경우)
export async function end() {
  await prisma.$disconnect();
}

// Vercel 서버리스 환경에서 연결 관리를 위한 함수
export async function connectDb() {
  try {
    // 연결 상태 확인
    await prisma.$connect();
    return { connected: true };
  } catch (error) {
    console.error('데이터베이스 연결 오류', error);
    return { connected: false, error };
  }
}

// 기존 코드와의 호환성을 위한 쿼리 함수
export async function query(text: string, params?: unknown[]) {
  console.warn('query 함수는 더 이상 사용되지 않습니다. Prisma 클라이언트를 직접 사용하세요.');
  const start = Date.now();
  try {
    // 직접 SQL 쿼리 실행
    const result = await prisma.$queryRawUnsafe(text, ...(params || []));
    const duration = Date.now() - start;
    console.log('실행된 쿼리', { text, duration });
    return { rows: result, rowCount: Array.isArray(result) ? result.length : 0 };
  } catch (error) {
    console.error('쿼리 오류', { text, error });
    throw error;
  }
}
