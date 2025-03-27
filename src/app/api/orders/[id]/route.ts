import { NextResponse } from 'next/server';
import { 주문저장소가져오기, 메뉴저장소가져오기 } from '@/repositories';
import { Order } from '@/lib/supabase';

/**
 * 일반 사용자용 주문 상세 조회 API
 */
export async function GET({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) {
      return NextResponse.json({ error: '유효하지 않은 주문 ID입니다.' }, { status: 400 });
    }

    // 저장소 인스턴스 가져오기
    const 주문저장소 = 주문저장소가져오기();

    try {
      // 주문 상세 정보 조회 - 특정 ID의 주문만 조회하도록 개선
      const 주문 = await 주문저장소.주문상세가져오기(id);

      if (!주문) {
        return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
      }

      // 응답 형식 변환
      const 형식화된주문 = {
        id: 주문.id,
        villageId: 주문.villageId,
        villageName: 주문.village.name,
        memberName: 주문.memberName,
        isCustomName: 주문.isCustomName,
        menuItemId: 주문.menuItemId,
        menuItemName: 주문.menuItem.name,
        temperature: 주문.temperature,
        isMild: 주문.isMild,
        status: 주문.status,
        createdAt: 주문.createdAt,
        updatedAt: 주문.updatedAt,
      };

      return NextResponse.json(형식화된주문);
    } catch (error) {
      console.error('주문 조회 오류:', error);
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '주문 상세 정보를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
}

/**
 * 주문 업데이트 API
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    // 요청 본문 파싱
    const body = await request.json();
    const { menuItemId } = body;

    // 필수 파라미터 확인
    if (!menuItemId) {
      return NextResponse.json({ error: '메뉴 아이템 ID는 필수 파라미터입니다.' }, { status: 400 });
    }

    // 저장소 인스턴스 가져오기
    const 주문저장소 = 주문저장소가져오기();
    const 메뉴저장소 = 메뉴저장소가져오기();

    try {
      // 메뉴 항목 존재 여부 확인
      await 메뉴저장소.메뉴항목상세가져오기(menuItemId);
    } catch (error) {
      console.error('메뉴 항목 조회 오류:', error);
      return NextResponse.json({ error: '존재하지 않는 메뉴 항목입니다.' }, { status: 400 });
    }

    // 현재 주문 조회
    const 주문목록 = await 주문저장소.주문목록가져오기();
    const 현재주문 = 주문목록.find((order: Order) => order.id === id);

    if (!현재주문) {
      return NextResponse.json({ error: '해당 ID의 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 주문 상태 업데이트 로직 구현
    // 주의: OrderService에 주문 업데이트 기능이 없어 상태 변경 기능만 사용
    // 실제 서비스 구현 시 주문 업데이트 기능 추가 필요

    // 임시 구현: 상태만 업데이트
    await 주문저장소.주문상태변경하기(id, 현재주문.status);

    // 주문 다시 조회
    const 업데이트된주문목록 = await 주문저장소.주문목록가져오기();
    const 업데이트된주문 = 업데이트된주문목록.find((order: Order) => order.id === id);

    if (!업데이트된주문) {
      return NextResponse.json(
        { error: '주문 업데이트 후 조회 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    // 업데이트된 주문 정보 반환
    const 형식화된주문 = {
      id: 업데이트된주문.id,
      villageId: 업데이트된주문.villageId,
      villageName: 업데이트된주문.village.name,
      memberName: 업데이트된주문.memberName,
      isCustomName: 업데이트된주문.isCustomName,
      menuItemId: 업데이트된주문.menuItemId,
      menuItemName: 업데이트된주문.menuItem.name,
      temperature: 업데이트된주문.temperature,
      isMild: 업데이트된주문.isMild,
      status: 업데이트된주문.status,
      createdAt: 업데이트된주문.createdAt,
      updatedAt: 업데이트된주문.updatedAt,
    };

    return NextResponse.json(형식화된주문);
  } catch (error) {
    console.error('주문 업데이트 API 오류:', error);
    return NextResponse.json({ error: '주문 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 주문 삭제 API
 */
export async function DELETE({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    // 저장소 인스턴스 가져오기
    const 주문저장소 = 주문저장소가져오기();

    try {
      // 주문 삭제
      await 주문저장소.주문삭제하기(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('주문 삭제 오류:', error);
      return NextResponse.json({ error: '주문 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
  } catch (error) {
    console.error('주문 삭제 API 오류:', error);
    return NextResponse.json({ error: '주문 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
