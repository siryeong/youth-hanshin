import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 마을 멤버 상세 조회 API
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const villageMemberService = ServiceRegistry.getVillageMemberService();
    const villageService = ServiceRegistry.getVillageService();

    // 멤버 조회
    const member = await villageMemberService.getVillageMemberById(id);

    if (!member) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버의 마을 정보 가져오기
    const village = await villageService.getVillageById(member.villageId);

    if (!village) {
      return NextResponse.json({ error: '멤버의 마을 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환 - API 호환성을 위한 속성명 매핑
    const formattedMember = {
      id: member.id,
      name: member.name,
      villageId: member.villageId,
      villageName: village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 상세 조회 오류:', error);
    return NextResponse.json({ error: '멤버 상세 정보를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
