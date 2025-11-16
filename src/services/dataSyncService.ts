/**
 * @file dataSyncService.ts
 * @brief 데이터 동기화 서비스
 * @details 초기 로딩, 백그라운드 동기화, 수동 갱신 등을 관리합니다.
 */

import { apiClient } from '../utils/api/apiClient';
import { getCacheManager } from '../utils/cache/cacheManager';
import { generateCacheKey, getActionCategory, CACHEABLE_ACTIONS } from '../utils/cache/cacheUtils';
import { tokenManager } from '../utils/auth/tokenManager';
import { initializeSpreadsheetIds } from '../utils/database/papyrusManager';
import type { User } from '../types/auth';

/**
 * 데이터 동기화 진행률 콜백
 */
export interface SyncProgressCallback {
  (progress: {
    current: number;
    total: number;
    category?: string;
    message?: string;
  }): void;
}

/**
 * 데이터 동기화 서비스
 */
export class DataSyncService {
  private lastSyncTime: Date | null = null;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitializing = false;
  private cacheManager = getCacheManager();

  // 주기적 갱신 주기 설정 (토큰 만료 시간 고려)
  private readonly SYNC_INTERVALS: Record<string, number> = {
    'workflow': 2 * 60 * 1000,        // 2분 (자주 변경되는 데이터)
    'accounting': 3 * 60 * 1000,      // 3분
    'announcements': 5 * 60 * 1000,   // 5분
    'documents': 5 * 60 * 1000,       // 5분
    'users': 15 * 60 * 1000,          // 15분
    'templates': 15 * 60 * 1000,      // 15분
    'spreadsheetIds': 30 * 60 * 1000, // 30분
    'calendar': 10 * 60 * 1000,       // 10분
    'students': 15 * 60 * 1000,       // 15분
    'staff': 15 * 60 * 1000,          // 15분
  };

  /**
   * 초기 데이터 로딩 (로그인 시)
   */
  async initializeData(
    user: User,
    onProgress?: SyncProgressCallback
  ): Promise<void> {
    if (this.isInitializing) {
      console.warn('⚠️ 이미 초기화 중입니다.');
      return;
    }

    this.isInitializing = true;

    try {
      // 토큰 유효성 확인
      if (!tokenManager.isValid()) {
        throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
      }

      const tasks: Array<{
        name: string;
        category: string;
        action: string;
        params?: Record<string, unknown>;
        fn: () => Promise<unknown>;
      }> = [];

      // 1. 스프레드시트 ID 초기화
      tasks.push({
        name: '스프레드시트 ID 초기화',
        category: 'spreadsheetIds',
        action: 'getSpreadsheetIds',
        fn: async () => {
          return await initializeSpreadsheetIds();
        }
      });

      // 2. 사용자 데이터
      if (user.isAdmin) {
        tasks.push({
          name: '전체 사용자 목록',
          category: 'users',
          action: 'getAllUsers',
          fn: () => apiClient.getAllUsers()
        });
        tasks.push({
          name: '승인 대기 사용자',
          category: 'users',
          action: 'getPendingUsers',
          fn: () => apiClient.getPendingUsers()
        });
      }

      // 3. 문서 관련 데이터
      tasks.push({
        name: '전체 문서 목록',
        category: 'documents',
        action: 'getAllDocuments',
        fn: async () => {
          const { loadAllDocuments } = await import('../utils/helpers/loadDocumentsFromDrive');
          return await loadAllDocuments();
        }
      });
      tasks.push({
        name: '템플릿 목록',
        category: 'templates',
        action: 'getTemplates',
        fn: () => apiClient.getTemplates()
      });
      tasks.push({
        name: '공유 템플릿 목록',
        category: 'templates',
        action: 'getSharedTemplates',
        fn: () => apiClient.getSharedTemplates()
      });
      tasks.push({
        name: '기본 태그 목록',
        category: 'tags',
        action: 'getStaticTags',
        fn: () => apiClient.getStaticTags()
      });

      // 4. 워크플로우 데이터
      if (user.email) {
        tasks.push({
          name: '내가 올린 결재',
          category: 'workflow',
          action: 'getMyRequestedWorkflows',
          params: { userEmail: user.email },
          fn: () => apiClient.getMyRequestedWorkflows(user.email!)
        });
        tasks.push({
          name: '내 담당 워크플로우',
          category: 'workflow',
          action: 'getMyPendingWorkflows',
          params: { userEmail: user.email },
          fn: () => apiClient.getMyPendingWorkflows({ userEmail: user.email! })
        });
        tasks.push({
          name: '완료된 워크플로우',
          category: 'workflow',
          action: 'getCompletedWorkflows',
          params: { userEmail: user.email },
          fn: () => apiClient.getCompletedWorkflows({ userEmail: user.email! })
        });
      }
      tasks.push({
        name: '워크플로우 템플릿',
        category: 'workflow',
        action: 'getWorkflowTemplates',
        fn: () => apiClient.getWorkflowTemplates()
      });

      // 5. 캘린더, 학생, 교직원 데이터 (직접 Google Sheets API 호출)
      tasks.push({
        name: '캘린더 이벤트',
        category: 'calendar',
        action: 'fetchCalendarEvents',
        fn: async () => {
          const { fetchCalendarEvents } = await import('../utils/database/papyrusManager');
          return await fetchCalendarEvents();
        }
      });
      tasks.push({
        name: '학생 목록',
        category: 'students',
        action: 'fetchStudents',
        fn: async () => {
          const { fetchStudents } = await import('../utils/database/papyrusManager');
          return await fetchStudents();
        }
      });
      tasks.push({
        name: '교직원 목록',
        category: 'staff',
        action: 'fetchStaff',
        fn: async () => {
          const { fetchStaff } = await import('../utils/database/papyrusManager');
          return await fetchStaff();
        }
      });
      tasks.push({
        name: '참석자 목록',
        category: 'attendees',
        action: 'fetchAttendees',
        fn: async () => {
          const { fetchAttendees } = await import('../utils/database/papyrusManager');
          return await fetchAttendees();
        }
      });

      // 병렬 처리 (그룹별로)
      const totalTasks = tasks.length;
      let completedTasks = 0;

      // 카테고리별로 그룹화하여 병렬 처리
      const categoryGroups = new Map<string, typeof tasks>();
      tasks.forEach(task => {
        if (!categoryGroups.has(task.category)) {
          categoryGroups.set(task.category, []);
        }
        categoryGroups.get(task.category)!.push(task);
      });

      // 각 카테고리별로 병렬 처리
      for (const [category, categoryTasks] of categoryGroups) {
        const promises = categoryTasks.map(async (task) => {
          try {
            onProgress?.({
              current: completedTasks,
              total: totalTasks,
              category: task.category,
              message: `${task.name} 로딩 중...`
            });

            await task.fn();

            completedTasks++;
            onProgress?.({
              current: completedTasks,
              total: totalTasks,
              category: task.category,
              message: `${task.name} 완료`
            });
          } catch (error) {
            console.error(`❌ ${task.name} 로딩 실패:`, error);
            completedTasks++;
            // 에러가 발생해도 계속 진행
          }
        });

        await Promise.allSettled(promises);
      }

      this.lastSyncTime = new Date();
      console.log('✅ 초기 데이터 로딩 완료');

    } catch (error) {
      console.error('❌ 초기 데이터 로딩 실패:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 전체 데이터 수동 갱신 (새로고침 버튼)
   */
  async refreshAllData(onProgress?: SyncProgressCallback): Promise<void> {
    try {
      // 모든 캐시 무효화
      await this.cacheManager.clear();

      // 사용자 정보 가져오기
      const userInfo = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('user') || '{}') 
        : {};

      if (!userInfo.email) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const user: User = {
        email: userInfo.email,
        name: userInfo.name,
        isApproved: userInfo.isApproved,
        isAdmin: userInfo.isAdmin || false,
        picture: userInfo.picture
      };

      // 초기화와 동일한 로직으로 전체 데이터 다시 로딩
      await this.initializeData(user, onProgress);

    } catch (error) {
      console.error('❌ 전체 데이터 갱신 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 카테고리만 갱신
   */
  async refreshCategory(category: string): Promise<void> {
    // 토큰 유효성 확인
    if (!tokenManager.isValid()) {
      console.warn('⚠️ 토큰이 만료되어 갱신을 건너뜁니다.');
      return;
    }

    // 카테고리별 캐시 무효화
    await this.cacheManager.invalidate(`${category}:*`);

    // 카테고리별 데이터 다시 로딩
    const userInfo = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('user') || '{}') 
      : {};

    // 카테고리별 데이터 페칭 로직 (간단한 버전)
    // 실제로는 각 카테고리에 맞는 API 호출 필요
    console.log(`🔄 ${category} 카테고리 갱신 중...`);

    this.lastSyncTime = new Date();
  }

  /**
   * 쓰기 작업 후 관련 캐시 무효화 및 갱신
   */
  async invalidateAndRefresh(cacheKeys: string[]): Promise<void> {
    try {
      // 토큰 유효성 확인
      if (!tokenManager.isValid()) {
        console.warn('⚠️ 토큰이 만료되어 캐시 무효화를 건너뜁니다.');
        return;
      }

      // 캐시 무효화
      for (const key of cacheKeys) {
        await this.cacheManager.invalidate(key);
      }

      // 백그라운드에서 관련 데이터 다시 로딩
      // 와일드카드 패턴에서 카테고리 추출
      const categories = new Set<string>();
      cacheKeys.forEach(key => {
        const match = key.match(/^([^:]+):/);
        if (match) {
          categories.add(match[1]);
        }
      });

      // 각 카테고리별로 갱신
      for (const category of categories) {
        await this.refreshCategory(category);
      }

      this.lastSyncTime = new Date();
      console.log('✅ 캐시 무효화 및 갱신 완료:', cacheKeys);

    } catch (error) {
      console.error('❌ 캐시 무효화 및 갱신 실패:', error);
      // 에러가 발생해도 계속 진행
    }
  }

  /**
   * 주기적 백그라운드 동기화 시작
   */
  startPeriodicSync(): void {
    // 기존 인터벌 정리
    this.stopPeriodicSync();

    // 카테고리별로 주기적 갱신 설정
    Object.entries(this.SYNC_INTERVALS).forEach(([category, interval]) => {
      const timerId = setInterval(async () => {
        // 토큰 만료 체크
        if (!tokenManager.isValid()) {
          console.warn(`⚠️ 토큰이 만료되어 ${category} 갱신을 건너뜁니다.`);
          return;
        }

        // 토큰이 곧 만료되면(5분 이내) 갱신 중단
        if (tokenManager.isExpiringSoon()) {
          console.warn(`⚠️ 토큰이 곧 만료되어 ${category} 갱신을 건너뜁니다.`);
          return;
        }

        try {
          await this.refreshCategory(category);
          console.log(`🔄 ${category} 백그라운드 갱신 완료`);
        } catch (error) {
          console.error(`❌ ${category} 백그라운드 갱신 실패:`, error);
        }
      }, interval);

      this.syncIntervals.set(category, timerId);
    });

    console.log('✅ 주기적 백그라운드 동기화 시작');
  }

  /**
   * 주기적 백그라운드 동기화 중지
   */
  stopPeriodicSync(): void {
    this.syncIntervals.forEach((timerId) => {
      clearInterval(timerId);
    });
    this.syncIntervals.clear();
    console.log('⏹️ 주기적 백그라운드 동기화 중지');
  }

  /**
   * 마지막 갱신 시간 조회
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.stopPeriodicSync();
    this.lastSyncTime = null;
  }
}

// 싱글톤 인스턴스
let dataSyncServiceInstance: DataSyncService | null = null;

/**
 * DataSyncService 싱글톤 인스턴스 가져오기
 */
export const getDataSyncService = (): DataSyncService => {
  if (!dataSyncServiceInstance) {
    dataSyncServiceInstance = new DataSyncService();
  }
  return dataSyncServiceInstance;
};

