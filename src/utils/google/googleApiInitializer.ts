/**
 * @file googleApiInitializer.ts
 * @brief Google API 초기화 유틸리티
 * @details Google API Client Library의 초기화와 상태 관리를 담당하는 유틸리티 모듈입니다.
 * @author Hot Potato Team
 * @date 2024
 */

import { ENV_CONFIG } from '../../config/environment';

const GOOGLE_CLIENT_ID = ENV_CONFIG.GOOGLE_CLIENT_ID;

// 중앙화된 Google API 초기화 상태 관리
let isGoogleAPIInitialized = false;
let googleAPIInitPromise: Promise<void> | null = null;

/**
 * @brief Google API 상태 리셋 함수
 * @details 새로고침 시 Google API 초기화 상태를 리셋합니다.
 */
export const resetGoogleAPIState = () => {
    console.log("Google API 상태 리셋");
    isGoogleAPIInitialized = false;
    googleAPIInitPromise = null;
};

// 페이지 로드 시 상태 리셋
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', resetGoogleAPIState);
}

/**
 * @brief Google API 초기화 함수
 * @details Google API Client Library를 한 번만 초기화하도록 보장하는 함수입니다.
 * @param {string | null} hotPotatoDBSpreadsheetId - Hot Potato DB 스프레드시트 ID
 * @returns {Promise<void>} 초기화 완료 Promise
 */
export const initializeGoogleAPIOnce = async (_hotPotatoDBSpreadsheetId: string | null): Promise<void> => {
    // 환경 변수 확인
    if (!GOOGLE_CLIENT_ID) {
        console.warn('Google Client ID가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
        console.warn('Google API 초기화를 건너뜁니다.');
        isGoogleAPIInitialized = true;
        return;
    }

    // 이미 초기화 중이면 대기
    if (googleAPIInitPromise) {
        console.log('Google API 초기화가 이미 진행 중입니다. 대기 중...');
        return googleAPIInitPromise;
    }

    // 이미 초기화되었으면 바로 반환
    if (isGoogleAPIInitialized) {
        return;
    }

    // 새로운 초기화 Promise 생성
    googleAPIInitPromise = (async () => {
        try {
            console.log("Google API 초기화 시작 (개선된 버전)");

            // gapi 스크립트가 로드될 때까지 대기
            const waitForGapi = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 100; // 10초로 증가

                    const checkGapi = () => {
                        attempts++;

                        if (typeof window !== 'undefined' && (window as any).gapi && (window as any).gapi.load) {
                            console.log("gapi 스크립트 로드 완료");
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            console.error("gapi 스크립트 로드 타임아웃");
                            reject(new Error("gapi 스크립트 로드 타임아웃"));
                        } else {
                            setTimeout(checkGapi, 100);
                        }
                    };

                    checkGapi();
                });
            };

            await waitForGapi();

            // 최신 방식: 인증은 GIS로, gapi는 클라이언트만 로드
            await new Promise<void>((resolve) => {
                console.log("Google API Client Library 초기화 중...");

                (window as any).gapi.load('client', async () => {
                    try {
                        console.log("gapi.load 완료, client.init 시작...");

                        await gapi.client.init({
                            clientId: GOOGLE_CLIENT_ID,
                            discoveryDocs: [
                                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
                            ]
                        });

                        // 저장된 토큰이 있으면 복원
                        const savedToken = localStorage.getItem('googleAccessToken');
                        if (savedToken) {
                            try {
                                (window as any).gapi.client.setToken({ access_token: savedToken });
                                console.log("✅ 액세스 토큰이 gapi.client에 설정되었습니다.");
                            } catch (tokenError) {
                                console.warn("토큰 설정 실패:", tokenError);
                            }
                        } else {
                            console.warn('저장된 Google 액세스 토큰이 없습니다. 로그인 후 토큰을 저장하세요.');
                        }

                        // papyrus-db가 사용할 클라이언트 연결
                        try {
                            (window as any).papyrusAuth = { client: (window as any).gapi.client };
                        } catch {}

                        console.log("Google API Client Library 초기화 성공!");
                        isGoogleAPIInitialized = true;
                        resolve();
                    } catch (error) {
                        console.error("Google API Client Library 초기화 실패:", error);
                        console.warn("Google API 초기화 실패했지만 앱을 계속 실행합니다.");
                        isGoogleAPIInitialized = false;
                        resolve();
                    }
                });
            });

        } catch (error) {
            console.error("Google API 초기화 실패:", error);
            isGoogleAPIInitialized = false;
            googleAPIInitPromise = null;
            throw error;
        }
    })();

    return googleAPIInitPromise;
};

// Google API 초기화 상태 확인
export const isGoogleAPIReady = (): boolean => {
    return isGoogleAPIInitialized;
};

// Google API 초기화 강제 재시도
export const retryGoogleAPIInitialization = async (): Promise<void> => {
    console.log("Google API 초기화 강제 재시도");
    resetGoogleAPIState();
    return initializeGoogleAPIOnce(null);
};