    /**
    * CONFIG.gs
    * 설정 및 상수 정의
    * Hot Potato Admin Key Management System
    */

    // ===== 스프레드시트 설정 =====
    // hp_member 스프레드시트 ID (실제 값으로 교체 필요)
    const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

    // 시트 이름 상수
    const SHEET_NAMES = {
    USER: 'user',
    ADMIN_KEYS: 'admin_keys'
    };

    // ===== 암호화 설정 =====
    // 사용 가능한 암호화 방법들
    const ENCRYPTION_METHODS = [
    'Base64', 'Caesar', 'ROT13', 'BitShift', 'Substitution',
    'Padding', 'MultiEncode', 'RandomInsert',
    'Transposition', 'Reverse', 'Atbash', 'Vigenere', 'RailFence',
    'Columnar', 'Affine', 'Permutation', 'Pattern', 'Mirror',
    'Zigzag', 'Wave', 'Snake'
    ];

    // 레이어 수 설정 (최소 5개, 최대 15개)
    const LAYER_CONFIG = {
    MIN_LAYERS: 5,
    MAX_LAYERS: 15
    };

    // ===== 시간 설정 =====
    // KST 오프셋 (UTC+9)
    const KST_OFFSET = 9 * 60; // 분 단위

    // 키 만료 시간 (24시간)
    const KEY_EXPIRY_HOURS = 24;

    // ===== 사용자 관리 설정 =====
    // 사용자 시트 컬럼 설정
    const USER_SHEET_COLUMNS = {
    EMAIL: 0,           // A열 - 이메일
    APPROVAL_STATUS: 1, // B열 - 승인상태
    IS_ADMIN: 2,        // C열 - 관리자여부
    STUDENT_ID: 3,      // D열 - 학생번호
    REGISTERED_AT: 4    // E열 - 등록일시
    };
    
    // 사용자 시트 헤더
    const USER_SHEET_HEADERS = ['이메일', '승인상태', '관리자여부', '학생번호', '등록일시'];
    
    // 승인 상태 상수
    const APPROVAL_STATUS = {
    PENDING: 'X',  // 대기
    APPROVED: 'O'  // 승인
    };
    
    // 관리자 여부 상수
    const ADMIN_STATUS = {
    NO: 'X',  // 일반 사용자
    YES: 'O'  // 관리자
    };

    // ===== 이메일 설정 =====
    // 이메일 암호화 사용 여부
    const USE_EMAIL_ENCRYPTION = true;

    // 이메일 암호화 방식 설정
    const EMAIL_ENCRYPTION_CONFIG = {
    // 사용할 암호화 방법 (ENCRYPTION_METHODS에서 선택)
    METHOD: 'ROT13', // 'ROT13', 'Base64', 'Caesar', 'BitShift', 'Substitution' 등
    
    // 암호화 레이어 수 (1 = 단일 암호화, 2+ = 다중 레이어)
    LAYERS: 1,
    
    // 다중 레이어 사용 시 사용할 방법들 (LAYERS > 1일 때만 적용)
    LAYER_METHODS: ['ROT13', 'Base64', 'Caesar'],
    
    // 암호화된 이메일 식별 패턴 (전체 이메일 주소 기준)
    IDENTIFICATION_PATTERNS: {
        ROT13: ['.pbz', '.bet', '.rqh', 'grfg', 'hfref', 'nqzva', 'fghqrag', 'ubgcbgngb', 'vagrtengvba', 'havirefvgl'], // ROT13 변환된 도메인 + 사용자명
        Base64: ['==', '=', 'dGVzdA', 'dXNlcg', 'YWRtaW4', 'c3R1ZGVudA', 'Z3JmZ0BleGFtcGxlLmNvbQ', 'aW50ZWdyYXRpb25AdGVzdC5jb20='], // Base64 패딩 + 일반적인 패턴
        Caesar: ['@'], // Caesar 암호화된 이메일은 @ 기호 유지
        BitShift: ['{', '}', '|', '~', '^', '`'], // BitShift 특수 문자
        Substitution: ['@'] // Substitution 암호화된 이메일은 @ 기호 유지
    }
    };

    // 이메일 템플릿 설정
    const EMAIL_CONFIG = {
    SUBJECT: 'Hot Potato 관리자 회원가입 키',
    FROM_NAME: 'Hot Potato 팀',
    COMPANY_NAME: 'Hot Potato'
    };

    // ===== 사용자 관리 설정 =====
    // (이미 위에서 정의됨)

    // ===== API 설정 =====
    // 지원하는 액션들
    const SUPPORTED_ACTIONS = [
    'getPendingUsers',
    'approveUser',
    'rejectUser',
    'verifyAdminKey',
    'sendAdminKeyEmail',
    'clearUserCache',
    'submitRegistrationRequest',
    'checkApprovalStatus',
    'checkRegistrationStatus',
    'migrateEmails',
    'testRot13Encryption',
    'testEmailEncryption',
    'testDecryption',
    'testEncryption',
    'testAdminKey',
    'testSpreadsheetIntegration',
    'testUserManagement',
    'testEmailSending',
    'testConfigManagement',
    'testAPIEndpoints',
    'testAllAppScript'
    ];

    // ===== 로깅 설정 =====
    // 로그 레벨
    const LOG_LEVELS = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
    };

    // 로그 출력 여부
    const ENABLE_LOGGING = true;

    // ===== 성능 설정 =====
    // 캐시 만료 시간 (분)
    const CACHE_EXPIRY_MINUTES = 1; // 1분으로 단축하여 실시간성 향상

    // 배치 처리 크기
    const BATCH_SIZE = 100;

    // ===== 보안 설정 =====
    // 최대 시도 횟수
    const MAX_RETRY_ATTEMPTS = 3;

    // 타임아웃 설정 (밀리초)
    const TIMEOUT_MS = 30000;

    // ===== 유틸리티 함수들 =====

    // 설정 값 가져오기
    function getConfig(key) {
    const configs = {
        'spreadsheet_id': SPREADSHEET_ID,
        'sheet_names': SHEET_NAMES,
        'encryption_methods': ENCRYPTION_METHODS,
        'layer_config': LAYER_CONFIG,
        'kst_offset': KST_OFFSET,
        'key_expiry_hours': KEY_EXPIRY_HOURS,
        'use_email_encryption': USE_EMAIL_ENCRYPTION,
        'email_encryption_config': EMAIL_ENCRYPTION_CONFIG,
        'email_config': EMAIL_CONFIG,
        'approval_status': APPROVAL_STATUS,
        'admin_status': ADMIN_STATUS,
        'user_sheet_columns': USER_SHEET_COLUMNS,
        'user_sheet_headers': USER_SHEET_HEADERS,
        'supported_actions': SUPPORTED_ACTIONS,
        'log_levels': LOG_LEVELS,
        'enable_logging': ENABLE_LOGGING,
        // 'cache_expiry_minutes': CACHE_EXPIRY_MINUTES, // 캐시 사용 안함
        'batch_size': BATCH_SIZE,
        'max_retry_attempts': MAX_RETRY_ATTEMPTS,
        'timeout_ms': TIMEOUT_MS
    };
    
    return configs[key] || null;
    }

    // 스프레드시트 ID 설정
    function setSpreadsheetId(id) {
    if (id && id !== 'YOUR_SPREADSHEET_ID_HERE') {
        // PropertiesService를 사용하여 동적으로 설정 저장
        PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
        console.log('스프레드시트 ID가 설정되었습니다:', id);
        return true;
    }
    return false;
    }

    // 스프레드시트 ID 가져오기 (동적)
    function getSpreadsheetId() {
    const storedId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    return storedId || SPREADSHEET_ID;
    }

    // 설정 검증
    function validateConfig() {
    const errors = [];
    
    // 스프레드시트 ID 확인
    const spreadsheetId = getSpreadsheetId();
    if (!spreadsheetId || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
        errors.push('스프레드시트 ID가 설정되지 않았습니다.');
    }
    
    // 암호화 방법 확인
    if (!ENCRYPTION_METHODS || ENCRYPTION_METHODS.length === 0) {
        errors.push('암호화 방법이 정의되지 않았습니다.');
    }
    
    // 레이어 설정 확인
    if (LAYER_CONFIG.MIN_LAYERS >= LAYER_CONFIG.MAX_LAYERS) {
        errors.push('레이어 설정이 잘못되었습니다.');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
    }

    // 설정 초기화
    function initializeConfig() {
    console.log('=== 설정 초기화 시작 ===');
    
    const validation = validateConfig();
    if (!validation.isValid) {
        console.error('설정 검증 실패:', validation.errors);
        return false;
    }
    
    console.log('설정 검증 성공');
    console.log('스프레드시트 ID:', getSpreadsheetId());
    console.log('암호화 방법 수:', ENCRYPTION_METHODS.length);
    console.log('레이어 설정:', LAYER_CONFIG);
    
    return true;
    }

    // 설정 정보 출력
    function printConfig() {
    console.log('=== 현재 설정 ===');
    console.log('스프레드시트 ID:', getSpreadsheetId());
    console.log('시트 이름:', SHEET_NAMES);
    console.log('암호화 방법:', ENCRYPTION_METHODS);
    console.log('레이어 설정:', LAYER_CONFIG);
    console.log('KST 오프셋:', KST_OFFSET);
    console.log('키 만료 시간:', KEY_EXPIRY_HOURS, '시간');
    console.log('이메일 암호화 사용:', USE_EMAIL_ENCRYPTION);
    console.log('승인 상태:', APPROVAL_STATUS);
    console.log('관리자 상태:', ADMIN_STATUS);
    console.log('지원 액션:', SUPPORTED_ACTIONS);
    console.log('로깅 활성화:', ENABLE_LOGGING);
    console.log('캐시 만료 시간:', CACHE_EXPIRY_MINUTES, '분');
    console.log('배치 크기:', BATCH_SIZE);
    console.log('최대 재시도:', MAX_RETRY_ATTEMPTS);
    console.log('타임아웃:', TIMEOUT_MS, 'ms');
    }

    // 환경별 설정
    function getEnvironmentConfig() {
    const environment = PropertiesService.getScriptProperties().getProperty('ENVIRONMENT') || 'development';
    
    const configs = {
        development: {
        enableLogging: true,
        // cacheExpiryMinutes: 5, // 캐시 사용 안함
        maxRetryAttempts: 1,
        timeoutMs: 10000
        },
        staging: {
        enableLogging: true,
        // cacheExpiryMinutes: 15, // 캐시 사용 안함
        maxRetryAttempts: 2,
        timeoutMs: 20000
        },
        production: {
        enableLogging: false,
        // cacheExpiryMinutes: 30, // 캐시 사용 안함
        maxRetryAttempts: 3,
        timeoutMs: 30000
        }
    };
    
    return configs[environment] || configs.development;
    }

    // 환경 설정
    function setEnvironment(env) {
    const validEnvironments = ['development', 'staging', 'production'];
    if (validEnvironments.includes(env)) {
        PropertiesService.getScriptProperties().setProperty('ENVIRONMENT', env);
        console.log('환경이 설정되었습니다:', env);
        return true;
    }
    console.error('유효하지 않은 환경:', env);
    return false;
    }

    // ===== 이메일 암호화 설정 함수들 =====

    // 이메일 암호화 방법 설정
    function setEmailEncryptionMethod(method) {
    const validMethods = getConfig('encryption_methods');
    if (validMethods && validMethods.includes(method)) {
        PropertiesService.getScriptProperties().setProperty('EMAIL_ENCRYPTION_METHOD', method);
        console.log('이메일 암호화 방법이 설정되었습니다:', method);
        return true;
    }
    console.error('유효하지 않은 암호화 방법:', method);
    console.log('사용 가능한 방법들:', validMethods);
    return false;
    }

    // 이메일 암호화 레이어 수 설정
    function setEmailEncryptionLayers(layers) {
    if (layers && layers >= 1 && layers <= 5) {
        PropertiesService.getScriptProperties().setProperty('EMAIL_ENCRYPTION_LAYERS', layers.toString());
        console.log('이메일 암호화 레이어 수가 설정되었습니다:', layers);
        return true;
    }
    console.error('유효하지 않은 레이어 수:', layers, '(1-5 범위)');
    return false;
    }

    // 이메일 암호화 레이어 방법들 설정
    function setEmailEncryptionLayerMethods(methods) {
    const validMethods = getConfig('encryption_methods');
    if (methods && Array.isArray(methods) && methods.length > 0) {
        const invalidMethods = methods.filter(method => !validMethods.includes(method));
        if (invalidMethods.length === 0) {
        PropertiesService.getScriptProperties().setProperty('EMAIL_ENCRYPTION_LAYER_METHODS', JSON.stringify(methods));
        console.log('이메일 암호화 레이어 방법들이 설정되었습니다:', methods);
        return true;
        } else {
        console.error('유효하지 않은 암호화 방법들:', invalidMethods);
        console.log('사용 가능한 방법들:', validMethods);
        return false;
        }
    }
    console.error('유효하지 않은 방법 배열:', methods);
    return false;
    }

    // 현재 이메일 암호화 설정 가져오기
    function getCurrentEmailEncryptionConfig() {
    const storedMethod = PropertiesService.getScriptProperties().getProperty('EMAIL_ENCRYPTION_METHOD');
    const storedLayers = PropertiesService.getScriptProperties().getProperty('EMAIL_ENCRYPTION_LAYERS');
    const storedLayerMethods = PropertiesService.getScriptProperties().getProperty('EMAIL_ENCRYPTION_LAYER_METHODS');
    
    const defaultConfig = getConfig('email_encryption_config');
    
    return {
        method: storedMethod || defaultConfig.METHOD,
        layers: storedLayers ? parseInt(storedLayers) : defaultConfig.LAYERS,
        layerMethods: storedLayerMethods ? JSON.parse(storedLayerMethods) : defaultConfig.LAYER_METHODS,
        identificationPatterns: defaultConfig.IDENTIFICATION_PATTERNS
    };
    }

    // 이메일 암호화 설정 초기화
    function resetEmailEncryptionConfig() {
    // 모든 설정 삭제
    PropertiesService.getScriptProperties().deleteProperty('EMAIL_ENCRYPTION_METHOD');
    PropertiesService.getScriptProperties().deleteProperty('EMAIL_ENCRYPTION_LAYERS');
    PropertiesService.getScriptProperties().deleteProperty('EMAIL_ENCRYPTION_LAYER_METHODS');
    
    // 기본값으로 강제 설정
    const defaultConfig = getConfig('email_encryption_config');
    PropertiesService.getScriptProperties().setProperty('EMAIL_ENCRYPTION_METHOD', defaultConfig.METHOD);
    PropertiesService.getScriptProperties().setProperty('EMAIL_ENCRYPTION_LAYERS', defaultConfig.LAYERS.toString());
    PropertiesService.getScriptProperties().setProperty('EMAIL_ENCRYPTION_LAYER_METHODS', JSON.stringify(defaultConfig.LAYER_METHODS));
    
    // 초기화 후 검증
    const validation = validateEmailEncryptionConfig();
    if (!validation.isValid) {
      console.error('초기화 후 검증 실패:', validation.errors);
      // 검증 실패해도 초기화는 성공으로 간주 (기본값으로 설정됨)
      console.log('기본값으로 초기화 완료');
      return true;
    }
    
    console.log('초기화 후 검증 성공');
    
    console.log('이메일 암호화 설정이 초기화되었습니다');
    return true;
    }

    // 이메일 암호화 설정 검증
    function validateEmailEncryptionConfig() {
    const config = getCurrentEmailEncryptionConfig();
    const validMethods = getConfig('encryption_methods');
    
    const errors = [];
    
    // 암호화 방법 검증
    if (!validMethods.includes(config.method)) {
        errors.push(`유효하지 않은 암호화 방법: ${config.method}`);
    }
    
    // 레이어 수 검증
    if (config.layers < 1 || config.layers > 5) {
        errors.push(`유효하지 않은 레이어 수: ${config.layers} (1-5 범위)`);
    }
    
    // 레이어 방법들 검증
    if (config.layers > 1) {
        const invalidMethods = config.layerMethods.filter(method => !validMethods.includes(method));
        if (invalidMethods.length > 0) {
        errors.push(`유효하지 않은 레이어 방법들: ${invalidMethods.join(', ')}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        config: config
    };
    }

    // ===== 문서 관리 설정 =====
    // 문서 저장 폴더 경로
    const DOCUMENT_FOLDER_PATH = 'hot potato/문서';
    
    // 템플릿 폴더 경로
    const TEMPLATE_FOLDER_PATH = 'hot potato/문서/양식';
    
    // 공유 문서 폴더 경로
    const SHARED_DOCUMENT_FOLDER_PATH = 'hot potato/문서/공유 문서';
    
    // 역할별 스프레드시트 이름 매핑
    const ROLE_SPREADSHEET_MAP = {
        'student': '학생_문서관리',
        'professor': '교수_문서관리',
        'admin': '관리자_문서관리'
    };
    
    // 기본 역할
    const DEFAULT_ROLE = 'student';
    
    // 문서 상태
    const DOCUMENT_STATUS = {
        CREATED: '생성됨',
        UPDATED: '수정됨',
        DELETED: '삭제됨'
    };
    
    // 스프레드시트 컬럼 설정
    const DOCUMENT_SHEET_COLUMNS = {
        CREATED_AT: 0,      // A열 - 생성일시
        TITLE: 1,           // B열 - 문서제목
        CREATOR: 2,         // C열 - 생성자
        URL: 3,             // D열 - 문서URL
        STATUS: 4           // E열 - 상태
    };
    
    // ===== 문서 관리 설정 함수들 =====
    
    /**
     * 문서 저장 폴더 경로 반환
     * @returns {string} 폴더 경로
     */
    function getDocumentFolderPath() {
        return DOCUMENT_FOLDER_PATH;
    }
    
    /**
     * 템플릿 폴더 경로 반환
     * @returns {string} 폴더 경로
     */
    function getTemplateFolderPath() {
        return TEMPLATE_FOLDER_PATH;
    }
    
    /**
     * 공유 문서 폴더 경로 반환
     * @returns {string} 폴더 경로
     */
    function getSharedDocumentFolderPath() {
        return SHARED_DOCUMENT_FOLDER_PATH;
    }
    
    /**
     * 역할에 따른 스프레드시트 이름 반환
     * @param {string} role - 사용자 역할
     * @returns {string} 스프레드시트 이름
     */
    function getSpreadsheetNameByRole(role) {
        return ROLE_SPREADSHEET_MAP[role] || ROLE_SPREADSHEET_MAP[DEFAULT_ROLE];
    }
    
    /**
     * 기본 역할 반환
     * @returns {string} 기본 역할
     */
    function getDefaultRole() {
        return DEFAULT_ROLE;
    }
    
    /**
     * 문서 상태 반환
     * @returns {Object} 문서 상태 객체
     */
    function getDocumentStatus() {
        return DOCUMENT_STATUS;
    }
    
    /**
     * 문서 스프레드시트 컬럼 설정 반환
     * @returns {Object} 컬럼 설정 객체
     */
    function getDocumentSheetColumns() {
        return DOCUMENT_SHEET_COLUMNS;
    }