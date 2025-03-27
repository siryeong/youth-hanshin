import { 기본저장소 } from './기본저장소';
import { Village, VillageMember } from '@/lib/supabase';

/**
 * 마을 관련 데이터 저장소
 */
export class 마을저장소 extends 기본저장소 {
  private static instance: 마을저장소;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static 인스턴스가져오기(): 마을저장소 {
    if (!마을저장소.instance) {
      마을저장소.instance = new 마을저장소();
    }
    return 마을저장소.instance;
  }

  /**
   * 모든 마을 목록 조회
   */
  public async 모든마을가져오기(): Promise<Village[]> {
    try {
      const { data, error } = await this.supabaseClient.from('villages').select('*').order('name');

      if (error) throw error;
      return data as Village[];
    } catch (error) {
      return this.오류처리(error, '마을 목록 조회 중 오류가 발생했습니다');
    }
  }

  /**
   * 특정 마을 상세 정보 조회
   */
  public async 마을정보가져오기(id: number): Promise<Village> {
    try {
      const { data, error } = await this.supabaseClient
        .from('villages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Village;
    } catch (error) {
      return this.오류처리(error, `ID ${id}번 마을 정보 조회 중 오류가 발생했습니다`);
    }
  }

  /**
   * 특정 마을의 멤버 목록 조회
   */
  public async 마을멤버가져오기(villageId: number): Promise<VillageMember[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('village_members')
        .select('*')
        .eq('village_id', villageId)
        .order('name');

      if (error) throw error;
      return data as VillageMember[];
    } catch (error) {
      return this.오류처리(error, `마을 ID ${villageId}번의 멤버 목록 조회 중 오류가 발생했습니다`);
    }
  }
}
