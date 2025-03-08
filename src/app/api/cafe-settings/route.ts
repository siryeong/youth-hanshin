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
