const { generateExtendedMultiLayerKey, applyEncryption, applyDecryption } = require('./index.js');

console.log('=== 암호화/복호화 테스트 ===');
const testString = 'Hello World! 안녕하세요!';
console.log('원본 텍스트:', testString);

// 테스트할 암호화 방식들
const testMethods = [
  'Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution', 
  'Padding', 'Compression', 'MultiEncode', 'RandomInsert', 
  'Transposition', 'Reverse', 'Atbash', 'Vigenere', 'RailFence', 
  'Columnar', 'Affine', 'Permutation', 'Pattern', 'Mirror', 
  'Zigzag', 'Wave', 'Snake'
];

let allPassed = true;

for (const method of testMethods) {
  try {
    const encrypted = applyEncryption(testString, method, '');
    const decrypted = applyDecryption(encrypted, method, '');
    const isReversible = decrypted === testString;
    
    console.log(`${method}: ${isReversible ? '✅' : '❌'} (원본: ${testString}, 복원: ${decrypted})`);
    
    if (!isReversible) {
      allPassed = false;
    }
  } catch (error) {
    console.log(`${method}: ❌ 오류 - ${error.message}`);
    allPassed = false;
  }
}

console.log('\n=== 전체 결과 ===');
console.log(`모든 암호화 방식이 가역적: ${allPassed ? '✅' : '❌'}`);

// 실제 관리자 키 생성 및 복호화 테스트
console.log('\n=== 실제 관리자 키 테스트 ===');
try {
  const { key, layers } = generateExtendedMultiLayerKey();
  console.log('생성된 키:', key.substring(0, 50) + '...');
  console.log('사용된 레이어:', layers);
  
  // 복호화 테스트
  let decryptedKey = key;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i].trim();
    decryptedKey = applyDecryption(decryptedKey, layer, '');
  }
  
  console.log('복호화된 키:', decryptedKey);
  console.log('복호화 성공:', decryptedKey.includes('ADMIN_') ? '✅' : '❌');
} catch (error) {
  console.log('관리자 키 테스트 실패:', error.message);
}

