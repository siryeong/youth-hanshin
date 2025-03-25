import { NextResponse } from 'next/server';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 카페 설정 가져오기 API
 */
export async function GET() {
  try {
    const cafeSettingsService = ServiceRegistry.getCafeSettingsService();

    // 카페 설정 조회
    const cafeSettings = await cafeSettingsService.getCafeSettings();

    // 설정이 없으면 기본값 반환
    if (!cafeSettings) {
      return NextResponse.json({
        openingTime: '10:00:00',
        closingTime: '14:00:00',
        openDays: [0], // 일요일만 영업
      });
    }

    return NextResponse.json(cafeSettings);
  } catch (error) {
    console.error('카페 설정 조회 오류:', error);
    return NextResponse.json({ error: '카페 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

/**
 * 카페 설정 업데이트 API
 */
export async function PUT(request: Request) {
  try {
    const { openingTime, closingTime, openDays } = await request.json();

    // 유효성 검사
    if (typeof openingTime !== 'string' || typeof closingTime !== 'string' || !Array.isArray(openDays)) {
      return NextResponse.json({ error: '잘못된 입력 형식입니다.' }, { status: 400 });
    }

    // 시간 형식 검사 (HH:MM:SS 또는 HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
    if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
      return NextResponse.json({ error: '시간 형식이 올바르지 않습니다. HH:MM:SS 또는 HH:MM 형식이어야 합니다.' }, { status: 400 });
    }

    // 요일 검사
    if (!openDays.every((day: number) => Number.isInteger(day) && day >= 0 && day <= 6)) {
      return NextResponse.json({ error: '영업일은 0-6 사이의 정수여야 합니다.' }, { status: 400 });
    }

    const cafeSettingsService = ServiceRegistry.getCafeSettingsService();

    // 설정 업데이트
    const updatedSettings = await cafeSettingsService.updateCafeSettings({
      openingTime,
      closingTime,
      openDays,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('카페 설정 업데이트 오류:', error);
    return NextResponse.json({ error: '카페 설정을 업데이트하는데 실패했습니다.' }, { status: 500 });
  }
}
