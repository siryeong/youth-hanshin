import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

// 모든 마을 목록 가져오기 (일반 사용자용)
export async function GET() {
  try {
    // 서비스 레지스트리에서 VillageService 인스턴스 가져오기
    const villageService = ServiceRegistry.getVillageService();

    // 마을 데이터 가져오기
    const villages = await villageService.getAllVillages();

    // 모든 마을 정보 반환
    return NextResponse.json(villages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json({ error: '마을 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
