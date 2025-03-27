import { 기본저장소 } from './기본저장소';
import { CafeSetting } from '@/lib/supabase';

/**
 * 카페 설정 관련 데이터 저장소
 */
export class 카페설정저장소 extends 기본저장소 {
  private static instance: 카페설정저장소;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static 인스턴스가져오기(): 카페설정저장소 {
    if (!카페설정저장소.instance) {
      카페설정저장소.instance = new 카페설정저장소();
    }
    return 카페설정저장소.instance;
  }

  /**
   * 카페 설정 가져오기
   */
  public async 카페설정가져오기(): Promise<CafeSetting> {
    try {
      const { data, error } = await this.supabaseClient.from('cafe_settings').select('*').single();

      if (error) throw error;
      return {
        id: data.id,
        openingTime: data.opening_time,
        closingTime: data.closing_time,
        openDays: data.open_days,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.오류처리(error, '카페 설정 조회 중 오류가 발생했습니다');
    }
  }

  /**
   * 카페 설정 전체 업데이트
   */
  public async 카페설정업데이트(settings: Partial<CafeSetting>): Promise<CafeSetting> {
    try {
      const { data, error } = await this.supabaseClient
        .from('cafe_settings')
        .update({
          opening_time: settings.openingTime || '10:00:00',
          closing_time: settings.closingTime || '14:10:00',
          open_days: settings.openDays || [0],
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        openingTime: data.opening_time,
        closingTime: data.closing_time,
        openDays: data.open_days,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      return this.오류처리(error, '카페 설정 업데이트 중 오류가 발생했습니다');
    }
  }
}
