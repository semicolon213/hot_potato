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
import type { User } from '../types/app';

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
  private isAppActive = true; // 앱 활성 상태
  private currentPage: string | null = null; // 현재 페이지
  private lastSyncByCategory: Map<string, number> = new Map(); // 카테고리별 마지막 갱신 시간

  // 주기적 갱신 주기 설정 (스마트 갱신: 페이지 활성 시에만 갱신)
  // 429 에러 방지를 위해 주기를 더 늘림
  private readonly SYNC_INTERVALS: Record<string, number> = {
    'workflow': 5 * 60 * 1000,        // 5분 (페이지 활성 시에만, 실시간성 중요하지만 API 제한 고려)
    'accounting': 10 * 60 * 1000,     // 10분 (페이지 활성 시에만)
    'announcements': 15 * 60 * 1000,  // 15분 (페이지 활성 시에만)
    'documents': 15 * 60 * 1000,      // 15분 (페이지 활성 시에만)
    'users': 30 * 60 * 1000,          // 30분 (관리자용, 항상 갱신)
    'templates': 30 * 60 * 1000,      // 30분 (페이지 활성 시에만)
    'spreadsheetIds': 60 * 60 * 1000, // 60분 (시스템 데이터, 항상 갱신)
    'calendar': 15 * 60 * 1000,       // 15분 (페이지 활성 시에만)
    'students': 30 * 60 * 1000,       // 30분 (페이지 활성 시에만)
    'staff': 30 * 60 * 1000,          // 30분 (페이지 활성 시에만)
  };
  
  // 429 에러 발생 시 카테고리별 일시 중지 시간 (밀리초)
  private pausedCategories: Map<string, number> = new Map();
  // 429 에러 발생 횟수 추적
  private error429Count: Map<string, number> = new Map();

  // 페이지별 활성화 카테고리 매핑 (해당 페이지에 있을 때만 갱신)
  private readonly PAGE_CATEGORY_MAP: Record<string, string[]> = {
    'dashboard': ['announcements', 'calendar', 'workflow'],
    'workflow': ['workflow'],
    'accounting': ['accounting'],
    'announcements': ['announcements'],
    'documents': ['documents', 'templates'],
    'students': ['students'],
    'staff': ['staff'],
    'calendar': ['calendar'],
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
   * 특정 카테고리만 갱신 (백그라운드에서 실제 데이터 가져오기)
   */
  async refreshCategory(category: string, background: boolean = true): Promise<void> {
    // 429 에러로 인해 일시 중지된 카테고리인지 확인
    const pausedUntil = this.pausedCategories.get(category);
    if (pausedUntil && Date.now() < pausedUntil) {
      const remainingMinutes = Math.ceil((pausedUntil - Date.now()) / (60 * 1000));
      console.log(`⏸️ ${category} 카테고리는 429 에러로 인해 ${remainingMinutes}분 동안 일시 중지됩니다.`);
      return;
    }

    // 일시 중지 시간이 지났으면 해제
    if (pausedUntil && Date.now() >= pausedUntil) {
      this.pausedCategories.delete(category);
      this.error429Count.delete(category);
      console.log(`▶️ ${category} 카테고리 일시 중지 해제`);
    }

    // 토큰 유효성 확인
    if (!tokenManager.isValid()) {
      console.warn('⚠️ 토큰이 만료되어 갱신을 건너뜁니다.');
      return;
    }

    // 카테고리별 캐시 무효화
    await this.cacheManager.invalidate(`${category}:*`);

    // 백그라운드에서 실제 데이터 가져오기
    if (background) {
      // 비동기로 백그라운드에서 실행 (응답 지연 없음)
      this.fetchCategoryDataInBackground(category).catch((error) => {
        this.handle429Error(category, error);
      });
    } else {
      // 동기 실행 (즉시 데이터 가져오기)
      try {
        await this.fetchCategoryDataInBackground(category);
      } catch (error) {
        this.handle429Error(category, error);
        throw error;
      }
    }

    this.lastSyncTime = new Date();
    this.lastSyncByCategory.set(category, Date.now());
  }

  /**
   * 429 에러 처리: 카테고리별 일시 중지
   */
  private handle429Error(category: string, error: any): void {
    const errorMessage = error?.message || error?.toString() || '';
    const is429Error = error?.status === 429 || 
                      error?.code === 429 || 
                      errorMessage.includes('429') ||
                      errorMessage.includes('호출 제한') ||
                      errorMessage.includes('Quota exceeded');

    if (is429Error) {
      const currentCount = (this.error429Count.get(category) || 0) + 1;
      this.error429Count.set(category, currentCount);

      // 연속 발생 횟수에 따라 일시 중지 시간 증가 (최소 30분, 최대 2시간)
      const pauseMinutes = Math.min(30 + (currentCount - 1) * 15, 120);
      const pauseUntil = Date.now() + (pauseMinutes * 60 * 1000);
      this.pausedCategories.set(category, pauseUntil);

      console.warn(`⚠️ ${category} 카테고리에서 429 에러 발생 (${currentCount}회). ${pauseMinutes}분 동안 일시 중지됩니다.`);
      
      // 사용자에게 알림 (DataSyncStatus 컴포넌트에서 처리)
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('sync429Error', {
          detail: { category, pauseMinutes }
        }));
      }
    } else {
      // 429가 아니면 에러 카운터 리셋
      this.error429Count.delete(category);
    }
  }

  /**
   * 백그라운드에서 카테고리별 데이터 가져오기
   */
  private async fetchCategoryDataInBackground(category: string): Promise<void> {
    const userInfo = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('user') || '{}') 
      : {};

    try {
      switch (category) {
        case 'users':
          if (userInfo.isAdmin) {
            await Promise.all([
              apiClient.getAllUsers(),
              apiClient.getPendingUsers()
            ]);
          }
          break;

        case 'documents':
          {
            const { loadAllDocuments } = await import('../utils/helpers/loadDocumentsFromDrive');
            await loadAllDocuments();
          }
          break;

        case 'templates':
          await Promise.all([
            apiClient.getTemplates(),
            apiClient.getSharedTemplates(),
            apiClient.getStaticTags()
          ]);
          break;

        case 'workflow':
          if (userInfo.email) {
            await Promise.all([
              apiClient.getMyRequestedWorkflows(userInfo.email),
              apiClient.getMyPendingWorkflows({ userEmail: userInfo.email }),
              apiClient.getCompletedWorkflows({ userEmail: userInfo.email }),
              apiClient.getWorkflowTemplates()
            ]);
          }
          break;

        case 'accounting':
          await apiClient.getLedgerList();
          break;

        case 'announcements':
          {
            const { fetchAnnouncements } = await import('../utils/database/papyrusManager');
            if (userInfo.studentId && userInfo.userType) {
              await fetchAnnouncements(userInfo.studentId, userInfo.userType);
            }
          }
          break;

        case 'calendar':
          {
            const { fetchCalendarEvents } = await import('../utils/database/papyrusManager');
            await fetchCalendarEvents();
          }
          break;

        case 'students':
          {
            const { fetchStudents } = await import('../utils/database/papyrusManager');
            await fetchStudents();
          }
          break;

        case 'staff':
          {
            const { fetchStaff, fetchAttendees } = await import('../utils/database/papyrusManager');
            await Promise.all([
              fetchStaff(),
              fetchAttendees()
            ]);
          }
          break;

        case 'spreadsheetIds':
          await initializeSpreadsheetIds();
          break;

        default:
          console.log(`⚠️ ${category} 카테고리에 대한 백그라운드 갱신 로직이 없습니다.`);
      }

      console.log(`✅ ${category} 백그라운드 갱신 완료`);
    } catch (error) {
      console.error(`❌ ${category} 백그라운드 갱신 중 오류:`, error);
      throw error;
    }
  }

  /**
   * 쓰기 작업 후 관련 캐시 무효화 및 백그라운드 갱신
   * 비동기로 실행되어 응답 지연 없음
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

      // 각 카테고리별로 백그라운드 갱신 (비동기, 응답 지연 없음)
      const refreshPromises = Array.from(categories).map(category => 
        this.refreshCategory(category, true).catch((error) => {
          console.error(`❌ ${category} 백그라운드 갱신 실패:`, error);
        })
      );

      // 모든 갱신을 백그라운드에서 병렬로 실행 (응답 대기 안 함)
      Promise.allSettled(refreshPromises).then(() => {
        this.lastSyncTime = new Date();
        console.log('✅ 캐시 무효화 및 백그라운드 갱신 완료:', cacheKeys);
      });

    } catch (error) {
      console.error('❌ 캐시 무효화 및 갱신 실패:', error);
      // 에러가 발생해도 계속 진행
    }
  }

  /**
   * 앱 활성 상태 설정
   */
  setAppActive(isActive: boolean): void {
    this.isAppActive = isActive;
    if (!isActive) {
      console.log('⏸️ 앱이 비활성화되어 백그라운드 갱신을 일시 중지합니다.');
    } else {
      console.log('▶️ 앱이 활성화되어 백그라운드 갱신을 재개합니다.');
      // 활성화 시 즉시 갱신 (필요한 카테고리만)
      this.syncActivePageCategories();
    }
  }

  /**
   * 현재 페이지 설정
   */
  setCurrentPage(page: string | null): void {
    this.currentPage = page;
    // 페이지 변경 시 해당 페이지의 카테고리 즉시 갱신
    if (page) {
      this.syncActivePageCategories();
    }
  }

  /**
   * 현재 활성 페이지의 카테고리만 갱신
   */
  private async syncActivePageCategories(): Promise<void> {
    if (!this.currentPage || !this.isAppActive) {
      return;
    }

    const categories = this.PAGE_CATEGORY_MAP[this.currentPage] || [];
    const now = Date.now();

    for (const category of categories) {
      const interval = this.SYNC_INTERVALS[category];
      const lastSync = this.lastSyncByCategory.get(category) || 0;
      
      // 마지막 갱신 후 충분한 시간이 지났는지 확인
      if (now - lastSync >= interval) {
        try {
          // 백그라운드로 갱신 (응답 대기 안 함)
          this.refreshCategory(category, true);
          this.lastSyncByCategory.set(category, now);
        } catch (error) {
          console.error(`❌ ${category} 갱신 실패:`, error);
        }
      }
    }
  }

  /**
   * 주기적 백그라운드 동기화 시작 (스마트 갱신: 페이지 활성 시에만)
   */
  startPeriodicSync(): void {
    // 기존 인터벌 정리
    this.stopPeriodicSync();

    // 앱 포커스/블러 이벤트 리스너 등록
    if (typeof window !== 'undefined') {
      const handleFocus = () => {
        this.setAppActive(true);
      };
      const handleBlur = () => {
        this.setAppActive(false);
      };
      const handleVisibilityChange = () => {
        this.setAppActive(!document.hidden);
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // 정리 함수 저장 (나중에 제거하기 위해)
      (this as any)._cleanupListeners = () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // 카테고리별로 주기적 갱신 설정 (스마트 갱신)
    Object.entries(this.SYNC_INTERVALS).forEach(([category, interval]) => {
      const timerId = setInterval(async () => {
        // 앱이 비활성화되어 있으면 스킵
        if (!this.isAppActive) {
          return;
        }

        // 현재 페이지에서 사용하는 카테고리인지 확인
        const shouldSync = !this.currentPage || 
          (this.PAGE_CATEGORY_MAP[this.currentPage]?.includes(category) ?? false) ||
          category === 'spreadsheetIds' || // 시스템 데이터는 항상 갱신
          category === 'users'; // 사용자 데이터는 항상 갱신 (관리자용)

        if (!shouldSync) {
          return; // 해당 페이지에서 사용하지 않는 카테고리는 스킵
        }

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

        // 429 에러로 인해 일시 중지된 카테고리인지 확인
        const pausedUntil = this.pausedCategories.get(category);
        if (pausedUntil && Date.now() < pausedUntil) {
          return; // 일시 중지 중이면 스킵
        }

        // 마지막 갱신 시간 확인 (중복 갱신 방지)
        const lastSync = this.lastSyncByCategory.get(category) || 0;
        const now = Date.now();
        if (now - lastSync < interval * 0.8) {
          // 아직 갱신 주기가 지나지 않았으면 스킵 (80% 이상 경과해야 갱신)
          return;
        }

        try {
          // 백그라운드로 갱신 (응답 대기 안 함)
          this.refreshCategory(category, true);
          this.lastSyncByCategory.set(category, now);
          console.log(`🔄 ${category} 백그라운드 갱신 시작`);
        } catch (error) {
          console.error(`❌ ${category} 백그라운드 갱신 실패:`, error);
        }
      }, interval);

      this.syncIntervals.set(category, timerId);
    });

    console.log('✅ 스마트 주기적 백그라운드 동기화 시작 (페이지 활성 시에만 갱신)');
  }

  /**
   * 주기적 백그라운드 동기화 중지
   */
  stopPeriodicSync(): void {
    this.syncIntervals.forEach((timerId) => {
      clearInterval(timerId);
    });
    this.syncIntervals.clear();

    // 이벤트 리스너 정리
    if ((this as any)._cleanupListeners) {
      (this as any)._cleanupListeners();
      (this as any)._cleanupListeners = null;
    }

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

