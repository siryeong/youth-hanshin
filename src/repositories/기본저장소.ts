import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * 모든 저장소의 기본 클래스
 * Supabase 클라이언트 및 공통 기능 제공
 */
export abstract class 기본저장소 {
  protected supabaseClient: SupabaseClient;

  constructor() {
    // Supabase 클라이언트 초기화
    this.supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    );
  }

  /**
   * 오류 처리 공통 메서드
   * 오류 로깅 및 적절한 예외 처리
   */
  protected 오류처리<T>(error: unknown, message: string): T {
    console.error(`${message}:`, error);
    throw new Error(message);
  }
}
