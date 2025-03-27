import { 마을저장소 } from './마을저장소';
import { 메뉴저장소 } from './메뉴저장소';
import { 주문저장소 } from './주문저장소';
import { 카페설정저장소 } from './카페설정저장소';
import { 마을주민저장소 } from './마을주민저장소';
import { 사용자저장소 } from './사용자저장소';

/**
 * 저장소 레지스트리
 * 모든 저장소 인스턴스를 중앙에서 관리
 */
export class 저장소등록기 {
  private static instance: 저장소등록기;
  private 저장소: Map<string, unknown> = new Map();

  private constructor() {
    this.초기화();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): 저장소등록기 {
    if (!저장소등록기.instance) {
      저장소등록기.instance = new 저장소등록기();
    }
    return 저장소등록기.instance;
  }

  /**
   * 저장소 등록
   */
  public 저장소등록(저장소이름: string, 저장소인스턴스: unknown): void {
    this.저장소.set(저장소이름, 저장소인스턴스);
  }

  /**
   * 저장소 조회
   */
  public 저장소가져오기<T>(저장소이름: string): T {
    const repository = this.저장소.get(저장소이름);
    if (!repository) {
      throw new Error(`저장소를 찾을 수 없습니다: ${저장소이름}`);
    }
    return repository as T;
  }

  /**
   * 모든 저장소 초기화
   */
  public 초기화(): void {
    // 각 저장소의 싱글톤 인스턴스 등록
    this.저장소등록('마을저장소', 마을저장소.인스턴스가져오기());
    this.저장소등록('메뉴저장소', 메뉴저장소.인스턴스가져오기());
    this.저장소등록('주문저장소', 주문저장소.인스턴스가져오기());
    this.저장소등록('카페설정저장소', 카페설정저장소.인스턴스가져오기());
    this.저장소등록('마을주민저장소', 마을주민저장소.인스턴스가져오기());
    this.저장소등록('사용자저장소', 사용자저장소.인스턴스가져오기());
  }
}
