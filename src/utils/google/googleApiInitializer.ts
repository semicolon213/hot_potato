// Google API 초기화 관련 유틸리티

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// 중앙화된 Google API 초기화 상태 관리
let isGoogleAPIInitialized = false;
let googleAPIInitPromise: Promise<void> | null = null;

// gapi 초기화 상태 리셋 함수 (새로고침 시 호출)
export const resetGoogleAPIState = () => {
    console.log("Google API 상태 리셋");
    isGoogleAPIInitialized = false;
    googleAPIInitPromise = null;
};

// 페이지 로드 시 상태 리셋
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', resetGoogleAPIState);
}

// 직접 구현한 Google API 초기화 함수
export const initializeGoogleAPIOnce = async (hotPotatoDBSpreadsheetId: string | null): Promise<void> => {
    // 이미 초기화되었으면 바로 반환
    if (isGoogleAPIInitialized) {
        return;
    }

    // 이미 초기화 중이면 기존 Promise 반환
    if (googleAPIInitPromise) {
        return googleAPIInitPromise;
    }

    // 새로운 초기화 Promise 생성
    googleAPIInitPromise = (async () => {
        try {
            console.log("Google API 초기화 시작 (직접 구현)");

            // gapi 스크립트가 로드될 때까지 대기 (더 빠른 체크)
            const waitForGapi = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 30; // 3초로 더 단축

                    const checkGapi = () => {
                        attempts++;

                        // gapiLoaded 플래그와 gapi 객체 모두 확인
                        if (typeof window !== 'undefined' &&
                            ((window as any).gapiLoaded || (window as any).gapi)) {
                            console.log("gapi 스크립트 로드 완료");
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            reject(new Error("gapi 스크립트 로드 타임아웃"));
                        } else {
                            // 더 빠른 체크 간격 (100ms)
                            setTimeout(checkGapi, 100);
                        }
                    };

                    checkGapi();
                });
            };

            await waitForGapi();

            const gapi = (window as any).gapi;

            // 더 정확한 초기화 상태 확인 (Gmail API, Docs API 포함)
            const isClientInitialized = gapi.client &&
                gapi.client.sheets &&
                gapi.client.sheets.spreadsheets &&
                gapi.client.gmail &&
                gapi.client.gmail.users &&
                gapi.client.docs &&
                gapi.client.docs.documents;

            if (isClientInitialized) {
                console.log("Google API가 이미 초기화되어 있습니다.");

                // 새로고침 시 저장된 토큰 복원 시도
                const savedToken = localStorage.getItem('googleAccessToken');
                if (savedToken) {
                    console.log("저장된 토큰을 gapi client에 복원 시도");
                    try {
                        // gapi client에 토큰 설정
                        gapi.client.setToken({ access_token: savedToken });
                        console.log("토큰 복원 성공");

                        // 토큰 유효성 검증 (더 빠른 방법)
                        try {
                            if (hotPotatoDBSpreadsheetId) {
                                // 간단한 API 호출로 토큰 유효성 확인
                                await gapi.client.sheets.spreadsheets.get({
                                    spreadsheetId: hotPotatoDBSpreadsheetId,
                                    ranges: ['document_template!A1:A1'],
                                    includeGridData: false // 데이터를 가져오지 않아 더 빠름
                                });
                                console.log("토큰 유효성 검증 성공");
                            }
                        } catch (tokenError) {
                            console.warn("토큰 유효성 검증 실패, 토큰이 만료되었을 수 있습니다:", tokenError);
                            // 토큰이 만료된 경우 localStorage에서 제거
                            localStorage.removeItem('googleAccessToken');
                        }
                    } catch (error) {
                        console.error("토큰 복원 실패:", error);
                    }
                }

                isGoogleAPIInitialized = true;
                return;
            }

            console.log("Google API Client Library 초기화 중...");

            // Google API Client Library 초기화
            await new Promise<void>((resolve, reject) => {
                gapi.load('client:auth2', async () => {
                    try {
                        console.log("gapi.load 완료, client.init 시작...");

                        console.log("Google API 초기화 설정:", {
                            clientId: GOOGLE_CLIENT_ID,
                            discoveryDocs: [
                                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                                'https://gmail.googleapis.com/$discovery/rest?version=v1',
                                'https://docs.googleapis.com/$discovery/rest?version=v1'
                            ],
                            scope: [
                                'https://www.googleapis.com/auth/calendar.events',
                                'https://www.googleapis.com/auth/calendar.readonly',
                                'https://www.googleapis.com/auth/spreadsheets',
                                'https://www.googleapis.com/auth/gmail.compose',
                                'https://www.googleapis.com/auth/drive',
                                'https://www.googleapis.com/auth/documents',
                                'profile',
                                'email'
                            ].join(' ')
                        });

                        console.log('gapi.client.init 호출 시작...');
                        await gapi.client.init({
                            clientId: GOOGLE_CLIENT_ID,
                            discoveryDocs: [
                                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                                'https://gmail.googleapis.com/$discovery/rest?version=v1',
                                'https://docs.googleapis.com/$discovery/rest?version=v1'
                            ],
                            scope: [
                                'https://www.googleapis.com/auth/calendar.events',
                                'https://www.googleapis.com/auth/calendar.readonly',
                                'https://www.googleapis.com/auth/spreadsheets',
                                'https://www.googleapis.com/auth/gmail.compose',
                                'https://www.googleapis.com/auth/drive',
                                'https://www.googleapis.com/auth/documents',
                                'profile',
                                'email'
                            ].join(' ')
                        });
                        console.log('gapi.client.init 호출 완료');

                        console.log("Google API Client Library 초기화 성공!");

                        // Google Docs API 로드 상태 확인
                        console.log("Google Docs API 상태 확인:", {
                            'gapi.client': !!gapi.client,
                            'gapi.client.docs': !!gapi.client.docs,
                            'gapi.client.docs.documents': !!gapi.client.docs?.documents,
                            'gapi.client.docs.documents.create': typeof gapi.client.docs?.documents?.create,
                            'gapi.client.sheets': !!gapi.client.sheets,
                            'gapi.client.gmail': !!gapi.client.gmail,
                            'gapi.client.drive': !!gapi.client.drive,
                            'gapi.client.drive.files': !!gapi.client.drive?.files
                        });

                        // 새로고침 시 저장된 토큰 복원 시도
                        const savedToken = localStorage.getItem('googleAccessToken');
                        if (savedToken) {
                            console.log("저장된 토큰을 gapi client에 복원 시도");
                            try {
                                // gpi client에 토큰 설정
                                gapi.client.setToken({ access_token: savedToken });
                                console.log("토큰 복원 성공");

                                // 토큰 유효성 검증 (더 빠른 방법)
                                try {
                                    if (hotPotatoDBSpreadsheetId) {
                                        // 간단한 API 호출로 토큰 유효성 확인
                                        await gapi.client.sheets.spreadsheets.get({
                                            spreadsheetId: hotPotatoDBSpreadsheetId,
                                            ranges: ['document_template!A1:A1'],
                                            includeGridData: false // 데이터를 가져오지 않아 더 빠름
                                        });
                                        console.log("토큰 유효성 검증 성공");
                                    }
                                } catch (tokenError) {
                                    console.warn("토큰 유효성 검증 실패, 토큰이 만료되었을 수 있습니다:", tokenError);
                                    // 토큰이 만료된 경우 localStorage에서 제거
                                    localStorage.removeItem('googleAccessToken');
                                }
                            } catch (error) {
                                console.error("토큰 복원 실패:", error);
                            }
                        }

                        isGoogleAPIInitialized = true;
                        resolve();
                    } catch (error) {
                        console.error("Google API Client Library 초기화 실패:", error);
                        console.error("오류 상세 정보:", {
                            message: error.message,
                            code: error.code,
                            status: error.status,
                            response: error.response?.data
                        });
                        reject(error);
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
