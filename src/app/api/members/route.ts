import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 마을 멤버 목록 조회 API
 */
export async function GET() {
  try {
    const villageMemberService = ServiceRegistry.getVillageMemberService();
    const members = await villageMemberService.getAllMembersWithVillages();

    // 응답 형식 변환 - API 호환성을 위한 속성명 매핑
    const formattedMembers = members.map((member) => ({
      id: member.id,
      name: member.name,
      villageId: member.villageId,
      villageName: member.villageName,
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('멤버 목록 조회 오류:', error);
    return NextResponse.json({ error: '멤버 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}
