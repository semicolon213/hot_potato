/**
 * Main.gs
 * 메인 엔트리 포인트 - UserManagement.gs 연동
 * Hot Potato Admin Key Management System
 */

// ===== 메인 엔트리 포인트 =====
function doPost(e) {
  try {
    console.log('=== 메인 doPost 시작 ===');
    console.log('요청 데이터:', e);
    
    // 요청 데이터 파싱
    const req = parseRequest(e);
    console.log('파싱된 요청:', req);
    
    // UserManagement.gs의 doPostAuthInternal 함수 호출
    const result = callUserManagementPost(req);
    console.log('UserManagement.gs 응답:', result);
    
    return result;
  } catch (error) {
    console.error('메인 doPost 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '서버 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 요청 데이터 파싱 =====
function parseRequest(e) {
  let req = {};
  
  if (e.postData && e.postData.contents) {
    try {
      // JSON 형태의 요청 처리
      req = JSON.parse(e.postData.contents);
    } catch (jsonError) {
      try {
        // URL 인코딩된 형태의 요청 처리
        const params = e.postData.contents.split('&');
        for (const param of params) {
          const [key, value] = param.split('=');
          if (key && value) {
            req[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        }
      } catch (urlError) {
        console.error('요청 파싱 오류:', urlError);
        req = {};
      }
    }
  }
  
  // 쿼리 파라미터도 추가
  if (e.parameter) {
    for (const key in e.parameter) {
      if (e.parameter.hasOwnProperty(key)) {
        req[key] = e.parameter[key];
      }
    }
  }
  
  return req;
}

// ===== UserManagement.gs 함수 호출 래퍼 =====
function callUserManagementPost(req) {
  try {
    // UserManagement.gs의 doPostAuthInternal 함수를 직접 호출
    return doPostAuthInternal(req);
  } catch (error) {
    console.error('UserManagement.gs 호출 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '인증 처리 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== GET 요청 처리 =====
function doGet(e) {
  try {
    console.log('=== 메인 doGet 시작 ===');
    console.log('GET 요청:', e);
    
    // UserManagement.gs의 doGetAuthInternal 함수 호출
    return callUserManagementGet(e);
  } catch (error) {
    console.error('메인 doGet 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '서버 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== UserManagement.gs GET 함수 호출 래퍼 =====
function callUserManagementGet(e) {
  try {
    // UserManagement.gs의 doGetAuthInternal 함수를 직접 호출
    return doGetAuthInternal(e);
  } catch (error) {
    console.error('UserManagement.gs GET 호출 오류:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'GET 처리 오류: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 유틸리티 함수들 =====
function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 테스트 함수 =====
function testMain() {
  console.log('=== 메인 테스트 시작 ===');
  
  // 테스트 요청 데이터
  const testReq = {
    action: 'test',
    message: '메인 함수 테스트'
  };
  
  try {
    const result = callUserManagementPost(testReq);
    console.log('테스트 결과:', result);
    return result;
  } catch (error) {
    console.error('테스트 오류:', error);
    return { success: false, message: '테스트 실패: ' + error.message };
  }
}

// ===== 배포 정보 =====
function getDeploymentInfo() {
  return {
    version: '1.0.0',
    description: '메인 엔트리 포인트 - UserManagement.gs 연동',
    functions: [
      'doPost',
      'doGet', 
      'parseRequest',
      'doPostAuthInternal',
      'doGetAuthInternal',
      'testMain'
    ],
    dependencies: ['UserManagement.gs']
  };
}