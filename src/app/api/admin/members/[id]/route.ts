import { NextRequest, NextResponse } from 'next/server';
import { VillageMemberService } from '@/services/village-member.service';
import { VillageService } from '@/services/village.service';

/**
 * 관리자 전용 멤버 상세 조회 API
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const villageMemberService = new VillageMemberService();

    // 멤버 정보 조회
    const member = await villageMemberService.getVillageMemberById(id);

    if (!member) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    const villageService = new VillageService();

    // 마을 정보 조회
    const village = await villageService.getVillageById(member.villageId);

    if (!village) {
      return NextResponse.json({ error: '해당 멤버의 마을 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 응답 형식 변환
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

/**
 * 관리자 전용 멤버 수정 API
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, villageId } = body;

    // 필수 필드 검증
    if (!name || !villageId) {
      return NextResponse.json({ error: '이름과 마을 ID는 필수 입력 사항입니다.' }, { status: 400 });
    }

    const villageMemberService = new VillageMemberService();
    const villageService = new VillageService();

    // 마을 존재 여부 확인
    const village = await villageService.getVillageById(villageId);

    if (!village) {
      return NextResponse.json({ error: '존재하지 않는 마을입니다.' }, { status: 400 });
    }

    // 멤버 존재 여부 확인
    const existingMember = await villageMemberService.getVillageMemberById(id);

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 수정
    const updatedMember = await villageMemberService.updateVillageMember(id, {
      name,
      villageId,
    });

    // 응답 형식 변환
    const formattedMember = {
      id: updatedMember.id,
      name: updatedMember.name,
      villageId: updatedMember.villageId,
      villageName: village.name,
    };

    return NextResponse.json(formattedMember);
  } catch (error) {
    console.error('멤버 수정 오류:', error);
    return NextResponse.json({ error: '멤버 수정에 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 관리자 전용 멤버 삭제 API
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 멤버 ID입니다.' }, { status: 400 });
    }

    const villageMemberService = new VillageMemberService();

    // 멤버 존재 여부 확인
    const existingMember = await villageMemberService.getVillageMemberById(id);

    if (!existingMember) {
      return NextResponse.json({ error: '해당 ID의 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 멤버 삭제
    await villageMemberService.deleteVillageMember(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('멤버 삭제 오류:', error);
    return NextResponse.json({ error: '멤버 삭제에 실패했습니다.' }, { status: 500 });
  }
}
