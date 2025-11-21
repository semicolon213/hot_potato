/**
 * @file cacheManager.ts
 * @brief 캐시 관리자 (Phase 1: 메모리 + localStorage)
 * @details 2단계 캐시 계층 구조로 데이터를 관리합니다.
 *          1단계: 메모리 캐시 (Map) - 빠른 접근
 *          2단계: localStorage - 영구 저장 (작은 데이터만)
 */

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
}

interface CacheConfig {
  maxMemoryCacheSize: number;
  maxLocalStorageSize: number;
  smallDataThreshold: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxMemoryCacheSize: 100, // 최대 100개 항목
  maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
  smallDataThreshold: 100 * 1024 // 100KB 이하
};

/**
 * 캐시 관리자 클래스
 */
export class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 캐시에서 데이터 가져오기
   * 조회 순서: 메모리 → localStorage → null
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. 메모리 캐시 확인
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      // 접근 시간 업데이트 (LRU)
      memoryEntry.timestamp = Date.now();
      return memoryEntry.data as T;
    }

    // 2. localStorage 확인 (작은 데이터만)
    const localStorageEntry = this.getFromLocalStorage(key);
    if (localStorageEntry && !this.isExpired(localStorageEntry)) {
      // 메모리 캐시에도 저장 (다음 접근 시 빠름)
      this.memoryCache.set(key, localStorageEntry);
      this.evictMemoryCacheIfNeeded();
      return localStorageEntry.data as T;
    }

    return null; // 캐시 미스 → API 호출 필요
  }

  /**
   * 캐시에 데이터 저장
   * 저장 위치: 메모리 (항상) + localStorage (작은 데이터만)
   */
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      version: 1
    };

    // 항상 메모리 캐시에 저장 (LRU로 관리)
    this.memoryCache.set(key, entry);
    this.evictMemoryCacheIfNeeded();

    // 작은 데이터는 localStorage에도 저장
    if (this.isSmallData(entry)) {
      this.saveToLocalStorage(key, entry);
    }
  }

  /**
   * 캐시 무효화 (특정 키 또는 패턴)
   */
  async invalidate(pattern: string): Promise<void> {
    // 와일드카드 패턴 지원
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      
      // 메모리 캐시에서 제거
      const keysToRemove: string[] = [];
      this.memoryCache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => this.memoryCache.delete(key));

      // localStorage에서 제거
      this.removeFromLocalStorageByPattern(pattern);
    } else {
      // 정확한 키 매칭
      this.memoryCache.delete(pattern);
      this.removeFromLocalStorage(pattern);
    }
  }

  /**
   * 모든 캐시 무효화
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.clearLocalStorage();
  }

  /**
   * 캐시 통계 정보
   */
  getStats(): {
    memoryCacheSize: number;
    localStorageSize: number;
    memoryCacheKeys: string[];
  } {
    return {
      memoryCacheSize: this.memoryCache.size,
      localStorageSize: this.getLocalStorageSize(),
      memoryCacheKeys: Array.from(this.memoryCache.keys())
    };
  }

  // ========== Private Methods ==========

  /**
   * 데이터가 작은지 확인 (100KB 이하)
   */
  private isSmallData(entry: CacheEntry): boolean {
    try {
      const dataSize = JSON.stringify(entry.data).length;
      return dataSize < this.config.smallDataThreshold;
    } catch {
      return false;
    }
  }

  /**
   * 캐시 항목이 만료되었는지 확인
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() >= entry.expiresAt;
  }

  /**
   * LRU 캐시 관리 - 메모리 캐시 크기 제한
   */
  private evictMemoryCacheIfNeeded(): void {
    if (this.memoryCache.size <= this.config.maxMemoryCacheSize) {
      return;
    }

    // 가장 오래된 항목 제거 (LRU)
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, entries.length - this.config.maxMemoryCacheSize);
    toRemove.forEach(([key]) => this.memoryCache.delete(key));
  }

  /**
   * localStorage에서 데이터 가져오기
   */
  private getFromLocalStorage(key: string): CacheEntry | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (!stored) return null;
      return JSON.parse(stored) as CacheEntry;
    } catch (error) {
      console.warn('localStorage에서 캐시 읽기 실패:', key, error);
      return null;
    }
  }

  /**
   * localStorage에 데이터 저장
   */
  private saveToLocalStorage(key: string, entry: CacheEntry): void {
    try {
      // localStorage 용량 체크
      const currentSize = this.getLocalStorageSize();
      const entrySize = JSON.stringify(entry).length;

      if (currentSize + entrySize > this.config.maxLocalStorageSize) {
        this.cleanupLocalStorage();
        // 정리 후에도 용량 초과하면 저장하지 않음
        const newSize = this.getLocalStorageSize();
        if (newSize + entrySize > this.config.maxLocalStorageSize) {
          console.warn('localStorage 용량 부족, 캐시 저장 건너뜀:', key);
          return;
        }
      }

      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('localStorage에 캐시 저장 실패:', key, error);
    }
  }

  /**
   * localStorage에서 데이터 제거
   */
  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('localStorage에서 캐시 제거 실패:', key, error);
    }
  }

  /**
   * localStorage에서 패턴으로 데이터 제거
   */
  private removeFromLocalStorageByPattern(pattern: string): void {
    try {
      const regex = new RegExp('^cache_' + pattern.replace(/\*/g, '.*') + '$');
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('localStorage 패턴 제거 실패:', pattern, error);
    }
  }

  /**
   * localStorage 용량 계산
   */
  private getLocalStorageSize(): number {
    let size = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          size += localStorage.getItem(key)?.length || 0;
        }
      }
    } catch (error) {
      console.warn('localStorage 용량 계산 실패:', error);
    }
    return size;
  }

  /**
   * localStorage 정리 (만료된 항목 제거)
   */
  private cleanupLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '{}') as CacheEntry;
            if (this.isExpired(entry)) {
              keysToRemove.push(key);
            }
          } catch {
            // 파싱 실패한 항목도 제거
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('localStorage 정리 실패:', error);
    }
  }

  /**
   * localStorage의 모든 캐시 항목 제거
   */
  private clearLocalStorage(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('localStorage 전체 삭제 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
let cacheManagerInstance: CacheManager | null = null;

/**
 * 캐시 매니저 싱글톤 인스턴스 가져오기
 */
export const getCacheManager = (): CacheManager => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
};

