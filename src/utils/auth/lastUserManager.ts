/**
 * @file lastUserManager.ts
 * @brief 로그인 사용자 목록 관리 유틸리티
 * @details 로그인 화면에 표시할 로그인한 사용자 목록을 관리합니다.
 */

export interface LastUser {
  email: string;
  name: string;
  picture?: string;
  lastLoginTime: number; // timestamp
}

const LAST_USERS_KEY = 'hot_potato_last_users';
const MAX_USERS = 10; // 최대 저장 개수

/**
 * @brief 로그인 사용자 목록 관리
 */
export const lastUserManager = {
  /**
   * 로그인 사용자 정보 저장 (여러 계정 지원)
   * 같은 이메일이 있으면 업데이트, 없으면 추가
   */
  save: (user: { email: string; name: string; picture?: string }) => {
    try {
      const users = lastUserManager.getAll();
      
      // 같은 이메일이 있는지 확인
      const existingIndex = users.findIndex(u => u.email === user.email);
      
      const updatedUser: LastUser = {
        email: user.email,
        name: user.name,
        picture: user.picture,
        lastLoginTime: Date.now()
      };
      
      if (existingIndex >= 0) {
        // 기존 사용자 업데이트
        users[existingIndex] = updatedUser;
      } else {
        // 새 사용자 추가
        users.push(updatedUser);
      }
      
      // 최신순으로 정렬
      users.sort((a, b) => b.lastLoginTime - a.lastLoginTime);
      
      // 최대 개수 제한
      const limitedUsers = users.slice(0, MAX_USERS);
      
      localStorage.setItem(LAST_USERS_KEY, JSON.stringify(limitedUsers));
    } catch (error) {
      console.error('사용자 목록 저장 실패:', error);
    }
  },

  /**
   * 모든 로그인 사용자 목록 가져오기 (최신순)
   */
  getAll: (): LastUser[] => {
    try {
      const stored = localStorage.getItem(LAST_USERS_KEY);
      if (!stored) return [];
      const users = JSON.parse(stored) as LastUser[];
      // 최신순으로 정렬하여 반환
      return users.sort((a, b) => b.lastLoginTime - a.lastLoginTime);
    } catch {
      return [];
    }
  },

  /**
   * 마지막 로그인 사용자 정보 가져오기 (하위 호환성)
   */
  get: (): LastUser | null => {
    const users = lastUserManager.getAll();
    return users.length > 0 ? users[0] : null;
  },

  /**
   * 특정 사용자 제거
   */
  remove: (email: string) => {
    try {
      const users = lastUserManager.getAll();
      const filteredUsers = users.filter(u => u.email !== email);
      localStorage.setItem(LAST_USERS_KEY, JSON.stringify(filteredUsers));
    } catch (error) {
      console.error('사용자 제거 실패:', error);
    }
  },

  /**
   * 모든 로그인 사용자 정보 삭제
   */
  clear: () => {
    localStorage.removeItem(LAST_USERS_KEY);
  }
};

