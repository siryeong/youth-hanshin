/**
 * 간단한 메모리 캐시 구현
 * 서비스 레이어에서 자주 사용되는 데이터를 캐싱하여 성능 향상
 */

type CacheItem<T> = {
  value: T;
  expiry: number | null; // null은 만료 없음을 의미
};

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * 캐시에서 값을 가져옴
   * @param key 캐시 키
   * @returns 캐시된 값 또는 undefined (캐시 미스)
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);

    // 캐시 항목이 없거나 만료된 경우
    if (!item || (item.expiry !== null && Date.now() > item.expiry)) {
      if (item) this.cache.delete(key); // 만료된 항목 제거
      return undefined;
    }

    return item.value as T;
  }

  /**
   * 캐시에 값을 저장
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttlMs 캐시 유효 시간(밀리초), 기본값 5분, null이면 만료 없음
   */
  set<T>(key: string, value: T, ttlMs: number | null = 5 * 60 * 1000): void {
    const expiry = ttlMs === null ? null : Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  /**
   * 캐시에서 항목 제거
   * @param key 캐시 키
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 특정 패턴으로 시작하는 모든 캐시 항목 제거
   * @param keyPrefix 캐시 키 접두사
   */
  invalidateByPrefix(keyPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 모든 캐시 항목 제거
   */
  clear(): void {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스 생성
export const memoryCache = new MemoryCache();
