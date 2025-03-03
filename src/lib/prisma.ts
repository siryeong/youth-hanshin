import { PrismaClient } from '@prisma/client';

// PrismaClient는 싱글톤으로 관리
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications

// 전역 타입 선언
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 개발 환경에서는 핫 리로딩으로 인한 여러 인스턴스 생성 방지
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// 개발 환경에서만 전역 객체에 할당
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
