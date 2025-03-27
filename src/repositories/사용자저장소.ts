import { 기본저장소 } from './기본저장소';

/**
 * 사용자 정보 타입
 */
export interface 사용자 {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * 사용자 저장소 클래스
 */
export class 사용자저장소 extends 기본저장소 {
  private static instance: 사용자저장소;

  private constructor() {
    super();
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static 인스턴스가져오기(): 사용자저장소 {
    if (!사용자저장소.instance) {
      사용자저장소.instance = new 사용자저장소();
    }
    return 사용자저장소.instance;
  }

  /**
   * 이메일로 사용자 조회
   */
  public async 이메일로사용자찾기(email: string): Promise<사용자 | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      // 데이터베이스 응답을 사용자 타입으로 변환
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        isAdmin: data.is_admin,
      };
    } catch (error) {
      console.error('이메일로 사용자 조회 오류:', error);
      return null;
    }
  }

  /**
   * 사용자 비밀번호 가져오기
   */
  public async 사용자비밀번호가져오기(email: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('password')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      return data.password;
    } catch (error) {
      console.error('사용자 비밀번호 조회 오류:', error);
      return null;
    }
  }
}
