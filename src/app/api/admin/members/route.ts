import { NextRequest, NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 관리자 전용 멤버 목록 조회 API
 */
export async function GET() {
  try {
    const villageMemberService = ServiceRegistry.getVillageMemberService();

    // 마을 멤버 조회 (마을 정보 포함)
    const members = await villageMemberService.getAllMembersWithVillages();

    return NextResponse.json(members);
  } catch (error) {
    console.error('멤버 목록 조회 오류:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 멤버 추가 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, villageId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: '유효한 멤버 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!villageId || typeof villageId !== 'number') {
      return NextResponse.json({ error: '유효한 마을 ID를 입력해주세요.' }, { status: 400 });
    }

    const villageMemberService = ServiceRegistry.getVillageMemberService();
    const villageService = ServiceRegistry.getVillageService();

    // 마을 존재 여부 확인
    const village = await villageService.getVillageById(villageId);

    if (!village) {
      return NextResponse.json({ error: '해당 ID의 마을을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 추가
    const newMember = await villageMemberService.createVillageMember({
      name: name.trim(),
      villageId: villageId,
    });

    // 응답 형식 변환 (마을 이름 포함)
    const formattedMember = {
      id: newMember.id,
      name: newMember.name,
      villageId: newMember.villageId,
      villageName: village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 추가 오류:', error);
    return NextResponse.json({ error: '멤버 추가에 실패했습니다.' }, { status: 500 });
  }
}
