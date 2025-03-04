import { PrismaClient } from '@prisma/client';

// PrismaClient는 싱글톤으로 관리
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications

// 전역 타입 선언
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Vercel의 서버리스 환경에서 최적화된 Prisma 클라이언트 설정
const prismaClientSingleton = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Vercel 서버리스 환경에서 연결 제한 시간 설정
    datasources: {
      db: {
        url: process.env.POSTGRES_URL,
      },
    },
  });

// 개발 환경에서는 핫 리로딩으로 인한 여러 인스턴스 생성 방지
export const prisma = global.prisma ?? prismaClientSingleton();

// 개발 환경에서만 전역 객체에 할당
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 연결 관리 헬퍼 함수
export async function connectPrisma() {
  try {
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('Prisma 연결 오류:', error);
    throw error;
  }
}

// 연결 해제 헬퍼 함수
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Prisma 연결 해제 오류:', error);
  }
}
