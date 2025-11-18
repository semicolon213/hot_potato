/**
 * Netlify Function: Apps Script 프록시
 * CORS 문제 해결을 위해 서버 사이드에서 Apps Script로 요청을 프록시합니다.
 */

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Apps Script URL (환경 변수에서 가져오기)
  const APP_SCRIPT_URL = process.env.VITE_APP_SCRIPT_URL || process.env.APP_SCRIPT_URL;

  if (!APP_SCRIPT_URL) {
    console.error('❌ APP_SCRIPT_URL 환경 변수가 설정되지 않았습니다.');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '서버 설정 오류: Apps Script URL이 설정되지 않았습니다.'
      })
    };
  }

  try {
    console.log('📤 프록시 요청:', {
      method: event.httpMethod,
      url: APP_SCRIPT_URL,
      body: event.body ? JSON.parse(event.body) : null
    });

    // Apps Script로 요청 전달
    const response = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: event.body,
      redirect: 'follow' // 리다이렉트 따라가기
    });

    // 응답 본문 가져오기
    const responseText = await response.text();
    
    console.log('📥 프록시 응답:', {
      status: response.status,
      statusText: response.statusText,
      bodyLength: responseText.length
    });

    // JSON 파싱 시도
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // JSON이 아니면 텍스트 그대로 반환
      responseData = { success: false, error: responseText };
    }

    return {
      statusCode: response.ok ? 200 : response.status,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ 프록시 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `프록시 오류: ${error.message}`,
        details: error.toString()
      })
    };
  }
};

