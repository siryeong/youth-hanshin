import { NextResponse } from 'next/server';
import { VillageService } from '@/services/village.service';

// 모든 마을 목록 가져오기 (일반 사용자용)
export async function GET() {
  try {
    const villageService = new VillageService();

    // 마을 데이터 가져오기
    const villages = await villageService.getAllVillages();

    // 모든 마을 정보 반환
    return NextResponse.json(villages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json({ error: '마을 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
