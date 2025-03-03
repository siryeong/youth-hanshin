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
