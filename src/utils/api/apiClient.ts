import { API_CONFIG, API_ACTIONS } from '../../config/api';

// API 응답 타입 정의
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// API 요청 옵션 타입 정의
interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// API 클라이언트 클래스
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    // CSP 문제 해결을 위해 Vite 프록시 사용
    const isDev = typeof window !== 'undefined' && import.meta && import.meta.env ? import.meta.env.DEV : false;
    this.baseUrl = isDev ? '/api' : API_CONFIG.APP_SCRIPT_URL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
    this.defaultRetries = API_CONFIG.MAX_RETRIES;
    
    console.log('API 클라이언트 초기화 (프록시 사용):', {
      baseUrl: this.baseUrl,
      isDev,
      timeout: this.defaultTimeout,
      retries: this.defaultRetries
    });
  }

  // 캐시에서 데이터 가져오기
  private getCachedData(key: string, maxAge: number = 300000): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      console.log('프론트엔드 캐시에서 데이터 로드:', key);
      return cached.data;
    }
    return null;
  }

  // 캐시에 데이터 저장
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // 공통 API 호출 메서드
  async request<T = any>(
    action: string,
    data: any = {},
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      headers = {}
    } = options;

    // 캐시 가능한 요청인지 확인 (읽기 전용 액션, 로그인/관리자 관련 제외)
    const cacheableActions: string[] = []; // 모든 액션을 실시간으로 처리
    const cacheKey = `${action}_${JSON.stringify(data)}`;
    
    if (cacheableActions.includes(action)) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // 웹앱용 요청 데이터 형식
    const requestData = {
      action,
      ...data
    };

    const requestOptions: RequestInit = {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      body: JSON.stringify(requestData)
    };

    // 타임아웃 설정 (더 관대한 설정)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`API 요청 타임아웃 (${timeout}ms):`, action);
      controller.abort();
    }, timeout);
    requestOptions.signal = controller.signal;

    let lastError: Error | null = null;

    // 재시도 로직
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`API 요청 시도 ${attempt + 1}/${retries + 1}:`, {
          action,
          data: requestData,
          url: this.baseUrl
        });

        const response = await fetch(this.baseUrl, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        // 성공한 응답을 캐시에 저장
        if (cacheableActions.includes(action) && result.success) {
          this.setCachedData(cacheKey, result);
        }
        
        console.log(`API 응답 성공:`, {
          action,
          success: result.success,
          message: result.message
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`API 요청 실패 (시도 ${attempt + 1}/${retries + 1}):`, error);

        if (attempt < retries) {
          // 지수 백오프로 재시도 간격 설정
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('API 요청 실패');
  }

  // 사용자 관리 API
  async getAllUsers() {
    return this.request(API_ACTIONS.GET_ALL_USERS);
  }

  async getPendingUsers() {
    return this.request(API_ACTIONS.GET_PENDING_USERS);
  }

  async approveUserWithGroup(studentId: string, groupRole: string) {
    return this.request(API_ACTIONS.APPROVE_USER_WITH_GROUP, { studentId, groupRole });
  }

  async rejectUser(studentId: string) {
    return this.request(API_ACTIONS.REJECT_USER, { studentId });
  }

  async clearUserCache() {
    return this.request(API_ACTIONS.CLEAR_USER_CACHE);
  }

  // 인증 API
  async checkApprovalStatus(email: string) {
    return this.request('checkUserStatus', { email });
  }

  async submitRegistrationRequest(registrationData: any) {
    return this.request('registerUser', registrationData);
  }

  async verifyAdminKey(adminKey: string) {
    return this.request('verifyAdminKey', { adminKey });
  }

  // 관리자 키 API
  async sendAdminKeyEmail(userEmail: string, adminAccessToken: string) {
    return this.request(API_ACTIONS.SEND_ADMIN_KEY_EMAIL, {
      userEmail,
      adminAccessToken
    });
  }

  // 이메일 마이그레이션 API
  async migrateEmails() {
    return this.request(API_ACTIONS.MIGRATE_EMAILS);
  }

  // 문서 관리 API
  async createDocument(documentData: {
    title: string;
    templateType?: string;
    creatorEmail: string;
    editors?: string[];
    role?: string;
    tag?: string;
  }) {
    return this.request('createDocument', documentData);
  }

  // 이메일로 사용자 이름 조회
  async getUserNameByEmail(email: string) {
    return this.request('getUserNameByEmail', { email });
  }

  async getTemplates() {
    return this.request('getTemplates');
  }

  // 공유 템플릿 업로드(파일 업로드)
  async uploadSharedTemplate(params: {
    fileName: string;
    fileMimeType: string;
    fileContentBase64: string;
    meta: { title: string; description: string; tag: string; creatorEmail?: string };
  }) {
    return this.request('uploadSharedTemplate', params);
  }

  // 공유 템플릿 메타데이터 수정
  async updateSharedTemplateMeta(params: {
    fileId: string;
    meta: Partial<{ title: string; description: string; tag: string; creatorEmail: string }>;
  }) {
    return this.request('updateSharedTemplateMeta', params);
  }

  // 공유 템플릿 목록(메타데이터 우선)
  async getSharedTemplates() {
    return this.request('getSharedTemplates');
  }

  async testDriveApi() {
    return this.request('testDriveApi');
  }

  async testTemplateFolderDebug() {
    return this.request('testTemplateFolderDebug');
  }

  async testSpecificFolder() {
    return this.request('testSpecificFolder');
  }

  async getDocuments(params: {
    role: string;
    searchTerm?: string;
    author?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    return this.request('getDocuments', params);
  }

  async deleteDocuments(documentIds: string[], role: string) {
    return this.request('deleteDocuments', { documentIds, role });
  }

  // 테스트 API
  async testEmailEncryption() {
    return this.request(API_ACTIONS.TEST_EMAIL_ENCRYPTION);
  }

  async testAllAppScript() {
    return this.request(API_ACTIONS.TEST_ALL_APP_SCRIPT);
  }

  // 간단한 연결 테스트
  async testConnection() {
    try {
      console.log('연결 테스트 시작:', this.baseUrl);
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      console.log('연결 테스트 응답:', response.status, response.statusText);
      const text = await response.text();
      console.log('연결 테스트 내용:', text.substring(0, 200));
      return { success: true, status: response.status, data: text };
    } catch (error) {
      console.error('연결 테스트 실패:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();

// 기존 API 함수들과의 호환성을 위한 래퍼 함수들
export const sendAdminKeyEmail = (userEmail: string, adminAccessToken: string) =>
  apiClient.sendAdminKeyEmail(userEmail, adminAccessToken);

export const fetchAllUsers = () =>
  apiClient.getAllUsers();

export const fetchPendingUsers = () =>
  apiClient.getPendingUsers();

export const approveUserWithGroup = (studentId: string, groupRole: string) =>
  apiClient.approveUserWithGroup(studentId, groupRole);

export const rejectUser = (userId: string) =>
  apiClient.rejectUser(userId);

export const clearUserCache = () =>
  apiClient.clearUserCache();

export const checkUserRegistrationStatus = (email: string) =>
  apiClient.checkApprovalStatus(email);

export const registerUser = (registrationData: any) =>
  apiClient.submitRegistrationRequest(registrationData);

export const verifyAdminKey = (adminKey: string) =>
  apiClient.verifyAdminKey(adminKey);
