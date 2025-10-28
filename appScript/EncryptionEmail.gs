/**
 * EncryptionEmail.gs
 * 이메일/연락처 암호화 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 이메일/연락처 암호화 함수들 =====

/**
 * 이메일/연락처 통합 암호화 (Base64)
 * @param {string} email - 암호화할 이메일/연락처
 * @returns {string} 암호화된 이메일/연락처
 */
function encryptEmailMain(email) {
  try {
    console.log('🔐 암호화 시작:', email);
    
    if (!email || typeof email !== 'string') {
      console.warn('유효하지 않은 입력:', email);
      return email || '';
    }
    
    // 기존 암호화 함수 사용 (Base64)
    const result = EncryptionCore.applyEncryption(email, 'Base64', '');
    console.log('🔐 암호화 완료:', email, '->', result);
    return result;
  } catch (error) {
    console.error('암호화 오류:', error);
    return email || '';
  }
}

/**
 * 이메일/연락처 통합 복호화 (Base64)
 * @param {string} encryptedEmail - 복호화할 이메일/연락처
 * @returns {string} 복호화된 이메일/연락처
 */
function decryptEmailMain(encryptedEmail) {
  try {
    console.log('🔓 복호화 시작:', encryptedEmail);
    
    if (!encryptedEmail || typeof encryptedEmail !== 'string') {
      console.warn('유효하지 않은 입력:', encryptedEmail);
      return encryptedEmail || '';
    }
    
    // 이미 복호화된 전화번호인지 확인 (010-XXXX-XXXX 형식)
    if (/^010-\d{4}-\d{4}$/.test(encryptedEmail)) {
      console.log('이미 복호화된 전화번호:', encryptedEmail);
      return encryptedEmail;
    }
    
    // 기존 복호화 함수 사용 (Base64)
    const result = EncryptionCore.applyDecryption(encryptedEmail, 'Base64', '');
    console.log('🔓 복호화 완료:', encryptedEmail, '->', result);
    return result;
  } catch (error) {
    console.error('복호화 오류:', error);
    return encryptedEmail || '';
  }
}

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일인지 여부
 */
function validateEmailFormat(email) {
  try {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } catch (error) {
    console.error('이메일 형식 검증 오류:', error);
    return false;
  }
}

/**
 * 전화번호 형식 검증
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} 유효한 전화번호인지 여부
 */
function validatePhoneFormat(phone) {
  try {
    if (!phone || typeof phone !== 'string') {
      return false;
    }
    
    // 한국 전화번호 형식 검증 (010-XXXX-XXXX)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  } catch (error) {
    console.error('전화번호 형식 검증 오류:', error);
    return false;
  }
}

/**
 * 이메일 마스킹
 * @param {string} email - 마스킹할 이메일
 * @returns {string} 마스킹된 이메일
 */
function maskEmail(email) {
  try {
    if (!email || typeof email !== 'string') {
      return email || '';
    }
    
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return email;
    }
    
    const maskedLocal = localPart.length > 2 
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  } catch (error) {
    console.error('이메일 마스킹 오류:', error);
    return email || '';
  }
}

/**
 * 전화번호 마스킹
 * @param {string} phone - 마스킹할 전화번호
 * @returns {string} 마스킹된 전화번호
 */
function maskPhone(phone) {
  try {
    if (!phone || typeof phone !== 'string') {
      return phone || '';
    }
    
    // 010-XXXX-XXXX 형식인 경우
    if (/^010-\d{4}-\d{4}$/.test(phone)) {
      return phone.replace(/010-(\d{2})\d{2}-(\d{2})\d{2}/, '010-$1**-$2**');
    }
    
    // 다른 형식의 전화번호
    if (phone.length > 4) {
      return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
    }
    
    return phone;
  } catch (error) {
    console.error('전화번호 마스킹 오류:', error);
    return phone || '';
  }
}

/**
 * 연락처 정보 암호화 (이메일 + 전화번호)
 * @param {Object} contact - 연락처 정보
 * @returns {Object} 암호화된 연락처 정보
 */
function encryptContactInfo(contact) {
  try {
    console.log('🔐 연락처 정보 암호화 시작:', contact);
    
    const encryptedContact = {};
    
    if (contact.email) {
      encryptedContact.email = encryptEmailMain(contact.email);
    }
    
    if (contact.phone) {
      encryptedContact.phone = encryptEmailMain(contact.phone);
    }
    
    if (contact.name) {
      encryptedContact.name = encryptEmailMain(contact.name);
    }
    
    console.log('🔐 연락처 정보 암호화 완료:', encryptedContact);
    return encryptedContact;
    
  } catch (error) {
    console.error('연락처 정보 암호화 오류:', error);
    return contact || {};
  }
}

/**
 * 연락처 정보 복호화 (이메일 + 전화번호)
 * @param {Object} encryptedContact - 암호화된 연락처 정보
 * @returns {Object} 복호화된 연락처 정보
 */
function decryptContactInfo(encryptedContact) {
  try {
    console.log('🔓 연락처 정보 복호화 시작:', encryptedContact);
    
    const decryptedContact = {};
    
    if (encryptedContact.email) {
      decryptedContact.email = decryptEmailMain(encryptedContact.email);
    }
    
    if (encryptedContact.phone) {
      decryptedContact.phone = decryptEmailMain(encryptedContact.phone);
    }
    
    if (encryptedContact.name) {
      decryptedContact.name = decryptEmailMain(encryptedContact.name);
    }
    
    console.log('🔓 연락처 정보 복호화 완료:', decryptedContact);
    return decryptedContact;
    
  } catch (error) {
    console.error('연락처 정보 복호화 오류:', error);
    return encryptedContact || {};
  }
}

/**
 * 연락처 정보 검증
 * @param {Object} contact - 검증할 연락처 정보
 * @returns {Object} 검증 결과
 */
function validateContactInfo(contact) {
  try {
    const validation = {
      isValid: true,
      errors: []
    };
    
    if (contact.email && !validateEmailFormat(contact.email)) {
      validation.isValid = false;
      validation.errors.push('유효하지 않은 이메일 형식');
    }
    
    if (contact.phone && !validatePhoneFormat(contact.phone)) {
      validation.isValid = false;
      validation.errors.push('유효하지 않은 전화번호 형식');
    }
    
    return validation;
    
  } catch (error) {
    console.error('연락처 정보 검증 오류:', error);
    return {
      isValid: false,
      errors: ['검증 중 오류가 발생했습니다']
    };
  }
}

/**
 * 연락처 정보 마스킹
 * @param {Object} contact - 마스킹할 연락처 정보
 * @returns {Object} 마스킹된 연락처 정보
 */
function maskContactInfo(contact) {
  try {
    const maskedContact = {};
    
    if (contact.email) {
      maskedContact.email = maskEmail(contact.email);
    }
    
    if (contact.phone) {
      maskedContact.phone = maskPhone(contact.phone);
    }
    
    if (contact.name) {
      maskedContact.name = contact.name; // 이름은 마스킹하지 않음
    }
    
    return maskedContact;
    
  } catch (error) {
    console.error('연락처 정보 마스킹 오류:', error);
    return contact || {};
  }
}

// ===== 배포 정보 =====
function getEncryptionEmailInfo() {
  return {
    version: '1.0.0',
    description: '이메일/연락처 암호화 관련 함수들',
    functions: [
      'encryptEmailMain',
      'decryptEmailMain',
      'validateEmailFormat',
      'validatePhoneFormat',
      'maskEmail',
      'maskPhone',
      'encryptContactInfo',
      'decryptContactInfo',
      'validateContactInfo',
      'maskContactInfo'
    ],
    dependencies: ['EncryptionCore.gs']
  };
}
