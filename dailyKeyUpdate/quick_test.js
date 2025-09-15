// 간단한 테스트
console.log('테스트 시작...');

// index.js에서 필요한 함수들 import
const index = require('./index.js');

console.log('사용 가능한 함수들:', Object.keys(index));

// Base64 테스트
if (index.applyEncryption && index.applyDecryption) {
  const testText = 'Hello World!';
  const encrypted = index.applyEncryption(testText, 'Base64', '');
  const decrypted = index.applyDecryption(encrypted, 'Base64', '');
  
  console.log('원본:', testText);
  console.log('암호화:', encrypted);
  console.log('복호화:', decrypted);
  console.log('가역성:', decrypted === testText ? '성공' : '실패');
} else {
  console.log('applyEncryption 또는 applyDecryption 함수를 찾을 수 없습니다.');
}

console.log('테스트 완료.');

