import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 카페 설정 가져오기
export async function GET() {
  try {
    // 카페 설정 조회
    const cafeSettings = await supabase.getCafeSettings();

    // 설정이 없으면 기본값 반환
    if (!cafeSettings) {
      return NextResponse.json({
        openingHour: 10,
        closingHour: 14,
        openDays: [0], // 일요일만 영업
      });
    }

    return NextResponse.json({
      openingHour: cafeSettings.openingHour,
      closingHour: cafeSettings.closingHour,
      openDays: cafeSettings.openDays,
    });
  } catch (error) {
    console.error('카페 설정 조회 오류:', error);
    return NextResponse.json({ error: '카페 설정을 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

// 카페 설정 업데이트
export async function PUT(request: Request) {
  try {
    const { openingHour, closingHour, openDays } = await request.json();

    // 유효성 검사
    if (
      typeof openingHour !== 'number' ||
      typeof closingHour !== 'number' ||
      !Array.isArray(openDays)
    ) {
      return NextResponse.json({ error: '잘못된 입력 형식입니다.' }, { status: 400 });
    }

    // 시간 범위 검사
    if (openingHour < 0 || openingHour > 23 || closingHour < 0 || closingHour > 23) {
      return NextResponse.json(
        { error: '영업 시간은 0-23 사이의 값이어야 합니다.' },
        { status: 400 },
      );
    }

    // 요일 검사
    if (!openDays.every((day: number) => Number.isInteger(day) && day >= 0 && day <= 6)) {
      return NextResponse.json({ error: '영업일은 0-6 사이의 정수여야 합니다.' }, { status: 400 });
    }

    // 설정 업데이트
    const updatedSettings = await supabase.updateCafeSettings({
      openingHour,
      closingHour,
      openDays,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('카페 설정 업데이트 오류:', error);
    return NextResponse.json(
      { error: '카페 설정을 업데이트하는데 실패했습니다.' },
      { status: 500 },
    );
  }
}
