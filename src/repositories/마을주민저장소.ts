import { 기본저장소 } from './기본저장소';
import { Village, VillageMember } from '@/lib/supabase';

/**
 * 마을 주민 관련 데이터 저장소
 */
export class 마을주민저장소 extends 기본저장소 {
  private static instance: 마을주민저장소;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static 인스턴스가져오기(): 마을주민저장소 {
    if (!마을주민저장소.instance) {
      마을주민저장소.instance = new 마을주민저장소();
    }
    return 마을주민저장소.instance;
  }

  /**
   * 모든 마을 주민 목록 조회
   */
  public async 마을주민목록가져오기(): Promise<
    {
      id: number;
      name: string;
      villageId: number;
      villageName: string;
    }[]
  > {
    try {
      // 마을 주민 조회
      const { data: members, error } = await this.supabaseClient
        .from('village_members')
        .select('*')
        .order('village_id', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // 마을 정보 조회
      const { data: villages, error: villagesError } = await this.supabaseClient
        .from('villages')
        .select('id, name');

      if (villagesError) throw villagesError;

      // 마을 ID를 키로 하는 맵 생성
      const villageMap = new Map<number, string>();
      (villages as Village[]).forEach((village: Village) => {
        villageMap.set(village.id as number, village.name as string);
      });
      // 응답 형식 변환
      return (members as VillageMember[]).map((member: VillageMember) => ({
        id: member.id as number,
        name: member.name as string,
        villageId: member.villageId as number,
        villageName: villageMap.get(member.villageId as number) || '',
      }));
    } catch (error) {
      return this.오류처리(error, '마을 주민 목록 조회 중 오류가 발생했습니다');
    }
  }

  /**
   * 특정 마을 주민 상세 정보 조회
   */
  public async 마을주민상세가져오기(id: number): Promise<{
    id: number;
    name: string;
    villageId: number;
    villageName: string;
  }> {
    try {
      const { data, error } = await this.supabaseClient
        .from('village_members')
        .select('*, village:villages(name)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Supabase 결과를 일관된 형식으로 변환
      const member = data as Record<string, unknown>;
      const village = (member.village as Record<string, unknown>) || {};

      return {
        id: member.id as number,
        name: member.name as string,
        villageId: member.village_id as number,
        villageName: (village.name as string) || '',
      };
    } catch (error) {
      return this.오류처리(error, `마을 주민 ID ${id}번 조회 중 오류가 발생했습니다`);
    }
  }

  /**
   * 마을별 주민 목록 조회
   */
  public async 마을별주민목록가져오기(villageId: number): Promise<
    {
      id: number;
      name: string;
      villageId: number;
    }[]
  > {
    try {
      const { data, error } = await this.supabaseClient
        .from('village_members')
        .select('id, name, village_id')
        .eq('village_id', villageId)
        .order('name');

      if (error) throw error;

      // 데이터베이스 응답 구조에 맞게 변환 후 반환
      return (data as Record<string, unknown>[]).map((member) => ({
        id: member.id as number,
        name: member.name as string,
        villageId: member.village_id as number,
      }));
    } catch (error) {
      return this.오류처리(error, `마을 ID ${villageId}번의 주민 목록 조회 중 오류가 발생했습니다`);
    }
  }

  /**
   * 마을 주민 생성
   */
  public async 마을주민생성하기(memberData: { name: string; villageId: number }): Promise<{
    id: number;
    name: string;
    villageId: number;
  }> {
    try {
      const { data, error } = await this.supabaseClient
        .from('village_members')
        .insert({
          name: memberData.name,
          village_id: memberData.villageId,
        })
        .select()
        .single();

      if (error) throw error;

      const member = data as Record<string, unknown>;
      return {
        id: member.id as number,
        name: member.name as string,
        villageId: member.village_id as number,
      };
    } catch (error) {
      return this.오류처리(error, '마을 주민 생성 중 오류가 발생했습니다');
    }
  }

  /**
   * 마을 주민 정보 업데이트
   */
  public async 마을주민업데이트하기(
    id: number,
    memberData: { name?: string; villageId?: number },
  ): Promise<{
    id: number;
    name: string;
    villageId: number;
  }> {
    try {
      const updateData: Record<string, unknown> = {};
      if (memberData.name !== undefined) updateData.name = memberData.name;
      if (memberData.villageId !== undefined) updateData.village_id = memberData.villageId;

      const { data, error } = await this.supabaseClient
        .from('village_members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const member = data as Record<string, unknown>;
      return {
        id: member.id as number,
        name: member.name as string,
        villageId: member.village_id as number,
      };
    } catch (error) {
      return this.오류처리(error, `마을 주민 ID ${id}번 업데이트 중 오류가 발생했습니다`);
    }
  }

  /**
   * 마을 주민 삭제
   */
  public async 마을주민삭제하기(id: number): Promise<void> {
    try {
      const { error } = await this.supabaseClient.from('village_members').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      this.오류처리(error, `마을 주민 ID ${id}번 삭제 중 오류가 발생했습니다`);
    }
  }
}
