import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 카페 설정 가져오기
 */
export async function GET() {
  try {
    // 서비스 레지스트리에서 CafeSettingService 인스턴스 가져오기
    const cafeSettingService = ServiceRegistry.getCafeSettingService();

    // 카페 설정 조회
    const cafeSettings = await cafeSettingService.getCafeSettings();

    // 설정이 없으면 기본값 반환
    if (!cafeSettings) {
      return NextResponse.json({
        openingTime: '10:00:00',
        closingTime: '14:00:00',
        openDays: [0], // 일요일만 영업
      });
    }

    return NextResponse.json({
      openingTime: cafeSettings.openingTime,
      closingTime: cafeSettings.closingTime,
      openDays: cafeSettings.openDays,
    });
  } catch (error) {
    console.error('카페 설정 조회 오류:', error);
    return NextResponse.json({ error: '카페 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 카페 설정 업데이트
 */
export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    // 입력 값 검증
    if (!data.openingTime || !data.closingTime || !Array.isArray(data.openDays)) {
      return NextResponse.json(
        {
          error: '유효하지 않은 입력입니다. openingTime, closingTime, openDays를 모두 제공해야 합니다.',
        },
        { status: 400 },
      );
    }

    // 서비스 레지스트리에서 CafeSettingService 인스턴스 가져오기
    const cafeSettingService = ServiceRegistry.getCafeSettingService();

    // 시간 형식 변환
    const updatedSettings = await cafeSettingService.updateCafeSettings({
      openingTime: new Date(`1970-01-01T${data.openingTime}`),
      closingTime: new Date(`1970-01-01T${data.closingTime}`),
      openDays: data.openDays,
    });

    return NextResponse.json({
      openingTime: updatedSettings.openingTime,
      closingTime: updatedSettings.closingTime,
      openDays: updatedSettings.openDays,
    });
  } catch (error) {
    console.error('카페 설정 업데이트 오류:', error);
    return NextResponse.json({ error: '카페 설정 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
