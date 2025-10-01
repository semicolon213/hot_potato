// Apps Script 마이그레이션 테스트 스크립트
import { apiClient } from './apiClient';

// 마이그레이션 테스트 함수
export const testAppsScriptMigration = async () => {
  console.log('🚀 Apps Script 마이그레이션 테스트 시작...');
  
  const results = {
    systemInfo: false,
    pendingUsers: false,
    emailEncryption: false,
    allTests: false
  };

  try {
  // 1. 시스템 정보 테스트 (환경변수 URL 사용)
  console.log('1️⃣ 시스템 정보 테스트...');
  try {
    const systemResponse = await fetch(apiClient['baseUrl'], {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    const systemData = await systemResponse.json();
    console.log('✅ 시스템 정보:', systemData);
    results.systemInfo = true;
  } catch (error) {
    console.error('❌ 시스템 정보 테스트 실패:', error);
  }

    // 2. 사용자 목록 조회 테스트
    console.log('2️⃣ 사용자 목록 조회 테스트...');
    try {
      const usersResponse = await apiClient.getPendingUsers();
      console.log('✅ 사용자 목록:', usersResponse);
      results.pendingUsers = true;
    } catch (error) {
      console.error('❌ 사용자 목록 조회 테스트 실패:', error);
    }

    // 3. 이메일 암호화 테스트
    console.log('3️⃣ 이메일 암호화 테스트...');
    try {
      const encryptionResponse = await apiClient.testEmailEncryption();
      console.log('✅ 이메일 암호화:', encryptionResponse);
      results.emailEncryption = true;
    } catch (error) {
      console.error('❌ 이메일 암호화 테스트 실패:', error);
    }

    // 4. 전체 테스트
    console.log('4️⃣ 전체 App Script 테스트...');
    try {
      const allTestsResponse = await apiClient.testAllAppScript();
      console.log('✅ 전체 테스트:', allTestsResponse);
      results.allTests = true;
    } catch (error) {
      console.error('❌ 전체 테스트 실패:', error);
    }

    // 결과 요약
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log('\n📊 마이그레이션 테스트 결과:');
    console.log(`✅ 성공: ${successCount}/${totalCount}`);
    console.log('상세 결과:', results);

    if (successCount === totalCount) {
      console.log('🎉 모든 테스트가 성공했습니다! Apps Script 마이그레이션이 완료되었습니다.');
    } else {
      console.log('⚠️ 일부 테스트가 실패했습니다. 설정을 확인해주세요.');
    }

    return results;
  } catch (error) {
    console.error('❌ 마이그레이션 테스트 중 오류 발생:', error);
    return results;
  }
};

// 브라우저 콘솔에서 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  (window as any).testAppsScriptMigration = testAppsScriptMigration;
  (window as any).testConnection = () => apiClient.testConnection();
  (window as any).apiClient = apiClient;
  
  // 직접 URL 테스트 함수
  (window as any).testDirectUrl = async () => {
    const url = 'https://script.google.com/macros/s/AKfycbwW-XbxPLmQcx_gzMB0ZGQkubfaXFjJ-hSenVP0ORxI9niLJPQN6EB_hGKglo_eNBvw/exec';
    try {
      console.log('직접 URL 테스트:', url);
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      const data = await response.json();
      console.log('✅ 직접 URL 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ 직접 URL 실패:', error);
      return error;
    }
  };
  
  // 프록시 URL 테스트 함수
  (window as any).testProxyUrl = async () => {
    const url = '/api';
    try {
      console.log('프록시 URL 테스트:', url);
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      console.log('✅ 프록시 URL 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ 프록시 URL 실패:', error);
      return error;
    }
  };
  
  console.log('💡 브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:');
  console.log('  - testAppsScriptMigration(): 전체 마이그레이션 테스트');
  console.log('  - testConnection(): 간단한 연결 테스트');
  console.log('  - testDirectUrl(): 직접 Apps Script URL 테스트');
  console.log('  - testProxyUrl(): Vite 프록시 URL 테스트');
  console.log('  - apiClient: API 클라이언트 인스턴스');
}
