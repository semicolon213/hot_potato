console.log('=== 간단한 테스트 ===');

try {
  const { generateExtendedMultiLayerKey, applyEncryption, applyDecryption } = require('./index.js');
  console.log('✅ 모듈 로드 성공');
  
  // 간단한 테스트
  const testString = 'Hello World!';
  console.log('원본:', testString);
  
  const encrypted = applyEncryption(testString, 'Base64', '');
  console.log('암호화:', encrypted);
  
  const decrypted = applyDecryption(encrypted, 'Base64', '');
  console.log('복호화:', decrypted);
  
  console.log('가역성:', decrypted === testString ? '✅ 성공' : '❌ 실패');
  
  // 관리자 키 테스트
  console.log('\n=== 관리자 키 테스트 ===');
  const { key, layers, originalKey } = generateExtendedMultiLayerKey();
  console.log('원본 키:', originalKey);
  console.log('생성된 키 (처음 50자):', key.substring(0, 50) + '...');
  console.log('사용된 레이어 수:', layers.length);
  
  // 복호화 테스트
  let decryptedKey = key;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i].trim();
    decryptedKey = applyDecryption(decryptedKey, layer, originalKey);
  }
  
  console.log('복호화된 키:', decryptedKey);
  console.log('관리자 키 복호화:', decryptedKey === originalKey ? '✅ 성공' : '❌ 실패');
  
} catch (error) {
  console.error('❌ 오류:', error.message);
}

