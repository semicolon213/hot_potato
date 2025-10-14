/**
 * KeyManagement.gs
 * 관리자 키 관리 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 시간 관련 함수들 =====
// 한국 표준시(KST) 가져오기
function getKSTTime() {
  const now = new Date();
  const kstOffset = getConfig('kst_offset'); // CONFIG에서 가져옴
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (kstOffset * 60000));
  return kst;
}

// KST 포맷팅
function formatKSTTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} KST`;
}

// ===== 관리자 키 검증 함수 =====
// 입력된 키가 현재 저장된 관리자 키와 일치하는지 확인
function verifyAdminKey(inputKey) {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    const sheet = spreadsheet.getSheetByName('admin_keys');
    
    if (!sheet) {
      throw new Error('admin_keys 시트를 찾을 수 없습니다');
    }
    
    // hp_member의 admin_keys 시트에서 현재 키와 레이어 정보 가져오기
    const data = sheet.getRange('A2:D2').getValues();
    
    if (!data || data.length === 0 || !data[0][0]) {
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const storedKey = data[0][0];
    const layersUsed = data[0][3]; // D열: layers_used
    
    console.log('저장된 키:', storedKey.substring(0, 20) + '...');
    console.log('사용된 레이어:', layersUsed);
    
    // 레이어 정보가 있는 경우 복호화 검증 수행
    if (layersUsed) {
      const layers = layersUsed.split(',');
      console.log('레이어 목록:', layers);
      
      // 저장된 키를 레이어 순서의 역순으로 복호화하여 원본 키 추출
      let decryptedKey = storedKey;
      
      // 레이어 순서의 역순으로 복호화 적용
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i].trim();
        console.log(`검증 복호화 레이어 ${i}: ${layer}`);
        const beforeDecrypt = decryptedKey.substring(0, 20) + '...';
        decryptedKey = applyDecryption(decryptedKey, layer, '');
        console.log(`검증 복호화 전: ${beforeDecrypt}`);
        console.log(`검증 복호화 후: ${decryptedKey.substring(0, 20)}...`);
      }
      
      console.log('복호화된 저장된 키:', decryptedKey.substring(0, 20) + '...');
      console.log('입력값과 비교:', decryptedKey === inputKey);
      
      const isValid = decryptedKey === inputKey;
      
      console.log(`관리자 키 검증 (복호화 방식): ${isValid ? '성공' : '실패'}`);
      return {
        isValid,
        message: isValid ? '관리자 키가 일치합니다' : '관리자 키가 일치하지 않습니다',
        verificationMethod: 'decryption'
      };
    } else {
      // 레이어 정보가 없는 경우 단순 문자열 비교
      const isValid = inputKey === storedKey;
      
      console.log(`관리자 키 검증 (단순 비교): ${isValid ? '성공' : '실패'}`);
      return {
        isValid,
        message: isValid ? '관리자 키가 일치합니다' : '관리자 키가 일치하지 않습니다',
        verificationMethod: 'simple'
      };
    }
    
  } catch (error) {
    console.error('관리자 키 검증 실패:', error);
    throw new Error('키 검증 중 오류가 발생했습니다');
  }
}

// ===== 관리자 키 조회 함수 =====
function getDecryptedAdminKey() {
  try {
    console.log('관리자 키 조회 시작...');
    const spreadsheet = getHpMemberSpreadsheet();
    const sheet = spreadsheet.getSheetByName('admin_keys');
    
    if (!sheet) {
      throw new Error('admin_keys 시트를 찾을 수 없습니다');
    }
    
    const data = sheet.getRange('A2:D2').getValues();
    
    if (!data || data.length === 0 || !data[0][0]) {
      throw new Error('저장된 관리자 키를 찾을 수 없습니다');
    }
    
    const currentAdminKey = data[0][0];
    const layersUsed = data[0][3];
    
    console.log('관리자 키 조회 완료:', currentAdminKey.substring(0, 10) + '...');
    console.log('사용된 레이어:', layersUsed);
    
    // 복호화된 키 생성
    let decryptedKey = currentAdminKey;
    if (layersUsed) {
      const layers = layersUsed.split(',');
      console.log('레이어 목록:', layers);
      
      // 레이어 순서의 역순으로 복호화 적용
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i].trim();
        console.log(`복호화 레이어 ${i}: ${layer}`);
        const beforeDecrypt = decryptedKey.substring(0, 20) + '...';
        decryptedKey = applyDecryption(decryptedKey, layer, '');
        console.log(`복호화 전: ${beforeDecrypt}`);
        console.log(`복호화 후: ${decryptedKey.substring(0, 20)}...`);
      }
      
      console.log('복호화된 키:', decryptedKey.substring(0, 20) + '...');
    }
    
    return {
      success: true,
      adminKey: decryptedKey,
      encryptedKey: currentAdminKey,
      layersUsed: layersUsed
    };
    
  } catch (error) {
    console.error('관리자 키 조회 실패:', error);
    throw error;
  }
}

// ===== 스프레드시트 업데이트 함수 =====
// hp_member의 admin_keys 시트에 새로운 관리자 키 업데이트
function updateSpreadsheetKey(newKey, layers) {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    const sheet = spreadsheet.getSheetByName('admin_keys');
    
    if (!sheet) {
      throw new Error('admin_keys 시트를 찾을 수 없습니다');
    }
    
    const now = getKSTTime();
    const expiryHours = getConfig('key_expiry_hours');
    const expiryKST = new Date(now.getTime() + expiryHours * 60 * 60 * 1000); // 설정된 시간 후 KST
    
    // 시트 구조에 맞게 업데이트 (KST 시간을 문자열로 저장)
    const updateData = [
      ['unified_admin_key', 'key_expiry', 'last_updated', 'layers_used'],
      [newKey, formatKSTTime(expiryKST), formatKSTTime(now), layers.join(',')]
    ];
    
    // 헤더와 데이터 업데이트
    sheet.getRange('A1:D2').setValues(updateData);
    
    console.log('Spreadsheet key update complete');
    console.log(`업데이트 시간: ${formatKSTTime(now)}`);
    console.log(`만료 시간: ${formatKSTTime(expiryKST)}`);
    console.log(`사용된 레이어: ${layers.join(', ')}`);
  } catch (error) {
    console.error('Error updating spreadsheet key:', error);
    throw error;
  }
}

// ===== 관리자 키 자동 갱신 핸들러 =====
function handleDailyKeyUpdate() {
  try {
    const kstTime = getKSTTime();
    console.log(`[${kstTime}] 확장된 다중 레이어 관리자 키 자동 갱신 시작`);
    
    const { key, layers } = generateExtendedMultiLayerKey();
    
    updateSpreadsheetKey(key, layers);
    
    console.log(`[${getKSTTime()}] 스프레드시트 키 업데이트 완료`);
    console.log(`생성된 키: ${key.substring(0, 20)}...`);
    console.log(`사용된 레이어: ${layers.join(', ')}`);
    
    return { 
      success: true, 
      message: "키 갱신 완료",
      key: key.substring(0, 20) + "...",
      layers: layers
    };
    
  } catch (error) {
    console.error('키 갱신 실패:', error);
    throw error;
  }
}

// ===== 이메일 템플릿 생성 함수 =====
// adminKey는 암호화된 상태로 전달됩니다
function generateEmailTemplate(userEmail, adminKey) {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .key-container { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .admin-key { 
            font-family: monospace; 
            font-size: 14px; 
            word-break: break-all; 
            background-color: #fff; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 3px; 
            user-select: all;
            cursor: text;
        }
        .copy-btn { 
            background-color: #007bff; 
            color: #f8f8f7; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px; 
            margin-top: 10px; 
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }
        .copy-btn:hover { 
            background-color: #0056b3; 
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,123,255,0.4);
        }
        .copy-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0,123,255,0.3);
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Hot Potato 관리자 회원가입 키</h2>
        </div>
        
        <p>안녕하세요!</p>
        
        <p>Hot Potato 관리자 회원가입을 위한 관리자 키입니다.</p>
        
        <div class="key-container">
            <strong>관리자 키:</strong>
            <div class="admin-key" id="adminKey">${adminKey}</div>
            <button class="copy-btn" onclick="copyToClipboard()">복사하기</button>
        </div>
        
        <p>이 키를 사용하여 관리자로 회원가입할 수 있습니다.</p>
        <p>키는 매일 자정에 자동으로 갱신됩니다.</p>
        
        <div class="footer">
            <p>감사합니다.<br>Hot Potato 팀</p>
        </div>
    </div>
    
    <script>
        function copyToClipboard() {
            const keyElement = document.getElementById('adminKey');
            const text = keyElement.textContent;
            
            // 다양한 복사 방법 시도
            if (navigator.clipboard && window.isSecureContext) {
                // 최신 브라우저의 Clipboard API 사용
                navigator.clipboard.writeText(text).then(function() {
                    showCopySuccess();
                }).catch(function(err) {
                    console.error('Clipboard API 복사 실패:', err);
                    fallbackCopy(text);
                });
            } else {
                // 구형 브라우저를 위한 fallback
                fallbackCopy(text);
            }
        }
        
        function fallbackCopy(text) {
            // 텍스트 영역을 생성하여 복사
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopySuccess();
                } else {
                    showCopyError();
                }
            } catch (err) {
                console.error('execCommand 복사 실패:', err);
                showCopyError();
            } finally {
                document.body.removeChild(textArea);
            }
        }
        
        function showCopySuccess() {
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '복사됨!';
            btn.style.backgroundColor = '#28a745';
            
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#007bff';
            }, 2000);
        }
        
        function showCopyError() {
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '복사 실패';
            btn.style.backgroundColor = '#dc3545';
            
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#007bff';
            }, 2000);
            
            // 사용자에게 수동 복사 안내
            const keyElement = document.getElementById('adminKey');
            keyElement.style.backgroundColor = '#fff3cd';
            keyElement.style.border = '2px solid #ffc107';
            keyElement.style.cursor = 'text';
            keyElement.setAttribute('contenteditable', 'true');
            keyElement.focus();
            
            // 텍스트 선택
            if (window.getSelection) {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(keyElement);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    </script>
</body>
</html>
  `;
  
  return {
    html: emailContent.trim(),
    subject: 'Hot Potato 관리자 회원가입 키',
    to: userEmail,
    adminKey: adminKey
  };
}

// ===== 관리자 키 이메일 전송 핸들러 =====
function handleSendAdminKeyEmail(userEmail) {
  try {
    console.log('=== handleSendAdminKeyEmail 호출됨 ===');
    console.log('사용자 이메일:', userEmail);
    
    if (!userEmail) {
      throw new Error('사용자 이메일을 입력해주세요');
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error('올바른 이메일 형식을 입력해주세요');
    }
    
    // 관리자 키 조회
    console.log('관리자 키 조회 시작...');
    const keyResult = getDecryptedAdminKey();
    
    if (!keyResult.success) {
      throw new Error('관리자 키 조회에 실패했습니다');
    }
    
    const decryptedKey = keyResult.adminKey;
    const encryptedKey = keyResult.encryptedKey;
    const layersUsed = keyResult.layersUsed;
    
    console.log('관리자 키 조회 성공');
    console.log('복호화된 키:', decryptedKey.substring(0, 20) + '...');
    
    // 이메일 템플릿 생성 (암호화된 키 사용)
    let emailTemplate;
    try {
      emailTemplate = generateEmailTemplate(userEmail, encryptedKey);
      console.log('이메일 템플릿 생성 완료');
    } catch (templateError) {
      console.error('이메일 템플릿 생성 실패:', templateError);
      throw new Error('이메일 템플릿 생성에 실패했습니다: ' + templateError.message);
    }
    
    // 암호화된 키와 이메일 템플릿을 반환
    return {
      success: true,
      message: '관리자 키를 성공적으로 조회했습니다',
      userEmail,
      adminKey: encryptedKey, // 암호화된 키 반환
      encryptedKey: encryptedKey,
      layersUsed: layersUsed,
      emailTemplate: emailTemplate
    };
    
  } catch (error) {
    console.error('관리자 키 조회 실패:', error);
    throw error;
  }
}
