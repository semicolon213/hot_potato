/**
 * @file useSession.ts
 * @brief 세션 관리 훅
 * @details 세션 타임아웃 및 사용자 활동 추적을 관리하는 React 훅입니다.
 */

import { useEffect, useRef } from 'react';

/**
 * @brief 세션 타임아웃 설정 (30분)
 */
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)

/**
 * @brief 세션 관리 훅
 * @param isLoggedIn - 사용자 로그인 상태
 * @param onTimeout - 타임아웃 시 호출할 콜백 함수 (로그아웃 처리 등)
 */
export const useSession = (
  isLoggedIn: boolean,
  onTimeout: () => void
) => {
  const lastActivityTimeRef = useRef<number>(Date.now());
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 로그인 상태가 아니면 세션 관리 중지
    if (!isLoggedIn) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    /**
     * @brief 타이머 리셋 함수
     */
    const resetTimer = () => {
      lastActivityTimeRef.current = Date.now();

      // 기존 타이머 클리어
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // 새 타이머 설정
      timeoutIdRef.current = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;

        // 타임아웃 시간이 지났으면 로그아웃
        if (timeSinceLastActivity >= SESSION_TIMEOUT) {
          console.log('⏰ 세션 타임아웃 - 자동 로그아웃');
          onTimeout();
        }
      }, SESSION_TIMEOUT);
    };

    // 사용자 활동 감지 이벤트 리스너
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove'
    ];

    // 이벤트 리스너 등록
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // 초기 타이머 시작
    resetTimer();

    // 정리 함수
    return () => {
      // 타이머 클리어
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // 이벤트 리스너 제거
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn, onTimeout]);
};

