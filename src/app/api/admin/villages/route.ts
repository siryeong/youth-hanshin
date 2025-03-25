import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 관리자 전용 마을 목록 조회 API
 */
export async function GET() {
  try {
    const villageService = ServiceRegistry.getVillageService();

    // 마을 목록 조회 (멤버 수 포함)
    const villages = await villageService.getAllVillagesWithMemberCounts();

    return NextResponse.json(villages);
  } catch (error) {
    console.error('마을 목록 조회 오류:', error);
    return NextResponse.json({ error: '마을 목록을 조회하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 마을 생성 API (관리자 전용)
 */
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: '마을 이름은 필수입니다.' }, { status: 400 });
    }

    const villageService = ServiceRegistry.getVillageService();

    // 마을 생성
    const village = await villageService.createVillage(name);

    return NextResponse.json(village, { status: 201 });
  } catch (error) {
    console.error('마을 생성 오류:', error);
    return NextResponse.json({ error: '마을을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
