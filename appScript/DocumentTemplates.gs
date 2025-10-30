/**
 * DocumentTemplates.gs
 * 문서 템플릿 관리 관련 기능
 * Hot Potato Document Management System
 */

// ===== 템플릿 관련 함수들 =====

/**
 * hot potato/문서/양식 폴더에서 템플릿 목록 가져오기
 * @returns {Object} 템플릿 목록 결과
 */
function getTemplatesFromFolder() {
  const debugInfo = [];
  
  try {
    debugInfo.push('📄 템플릿 폴더에서 파일 목록 가져오기 시작');
    
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      debugInfo.push('❌ Drive API가 정의되지 않았습니다');
      return {
        success: false,
        message: 'Drive API가 활성화되지 않았습니다. Google Apps Script에서 Drive API를 활성화해주세요.',
        debugInfo: debugInfo
      };
    }
    
    debugInfo.push('✅ Drive API 사용 가능');
    
    // 먼저 루트 폴더의 모든 폴더 검색
    debugInfo.push('🔍 루트 폴더에서 모든 폴더 검색 시작');
    try {
      const rootFolders = Drive.Files.list({
        q: "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id,name)'
      });
      
      debugInfo.push('🔍 루트 폴더 검색 결과: ' + JSON.stringify(rootFolders));
      debugInfo.push('🔍 루트 폴더에서 찾은 폴더 수: ' + (rootFolders.files ? rootFolders.files.length : 0));
      
      if (rootFolders.files && rootFolders.files.length > 0) {
        rootFolders.files.forEach((folder, index) => {
          debugInfo.push(`🔍 루트 폴더 ${index + 1}: ${folder.name} (${folder.id})`);
        });
      }
    } catch (rootError) {
      debugInfo.push('❌ 루트 폴더 검색 오류: ' + rootError.message);
    }
    
    // 여러 가능한 폴더 경로 시도
    const possiblePaths = [
      getTemplateFolderPath(),
      'hot_potato/문서/양식',
      '문서/양식',
      '양식'
    ];
    
    debugInfo.push('📁 가능한 폴더 경로들: ' + JSON.stringify(possiblePaths));
    
    let folder = null;
    let successfulPath = null;
    
    for (const path of possiblePaths) {
      debugInfo.push(`📁 폴더 경로 시도: ${path}`);
      const result = findOrCreateFolder(path);
      debugInfo.push(`📄 폴더 찾기 결과 (${path}): ` + JSON.stringify(result));
      
      if (result && result.success && result.data && result.data.id) {
        folder = result;
        successfulPath = path;
        debugInfo.push(`✅ 폴더 찾기 성공: ${path} -> ${result.data.id}`);
        break;
      } else {
        debugInfo.push(`❌ 폴더 찾기 실패: ${path}`);
      }
    }
    
    if (!folder) {
      debugInfo.push('❌ 모든 폴더 경로에서 폴더를 찾을 수 없습니다');
      return {
        success: false,
        message: '템플릿 폴더를 찾을 수 없습니다. 폴더 경로를 확인해주세요.',
        debugInfo: debugInfo
      };
    }
    
    debugInfo.push(`✅ 사용된 폴더 경로: ${successfulPath}`);
    debugInfo.push(`✅ 폴더 ID: ${folder.data.id}`);
    
    // 폴더 ID로 직접 검색해보기
    debugInfo.push('🔍 폴더 ID로 직접 검색 시도');
    try {
      const directFolder = Drive.Files.get(folder.data.id, {
        fields: 'id,name,parents,owners,permissions'
      });
      debugInfo.push('🔍 폴더 직접 검색 결과: ' + JSON.stringify(directFolder));
      
      // 폴더 소유자 정보 확인
      if (directFolder.owners && directFolder.owners.length > 0) {
        debugInfo.push('🔍 폴더 소유자: ' + directFolder.owners[0].displayName + ' (' + directFolder.owners[0].emailAddress + ')');
      }
      
      // 폴더 권한 정보 확인
      if (directFolder.permissions && directFolder.permissions.length > 0) {
        debugInfo.push('🔍 폴더 권한 수: ' + directFolder.permissions.length);
        directFolder.permissions.forEach((perm, index) => {
          debugInfo.push(`🔍 권한 ${index + 1}: ${perm.role} - ${perm.emailAddress || perm.displayName || 'Unknown'}`);
        });
      }
    } catch (directError) {
      debugInfo.push('❌ 폴더 직접 검색 오류: ' + directError.message);
    }
    
    // 폴더 내의 모든 파일들 먼저 검색해보기
    debugInfo.push('📄 폴더 내 모든 파일 검색 시작: ' + folder.data.id);
    
    let allFiles;
    try {
      // 방법 1: 기본 쿼리로 검색
      const allFilesQuery = `'${folder.data.id}' in parents and trashed=false`;
      debugInfo.push('📄 방법 1 - 모든 파일 검색 쿼리: ' + allFilesQuery);
      
      allFiles = Drive.Files.list({
        q: allFilesQuery,
        fields: 'files(id,name,mimeType,description,modifiedTime,owners)',
        orderBy: 'name'
      });
      
      debugInfo.push('📄 방법 1 - 검색 결과: ' + JSON.stringify(allFiles));
      debugInfo.push('📄 방법 1 - 검색된 파일 수: ' + (allFiles.files ? allFiles.files.length : 0));
      
      // 방법 2: 쿼리 없이 직접 검색 시도
      if (!allFiles.files || allFiles.files.length === 0) {
        debugInfo.push('📄 방법 2 - 쿼리 없이 직접 검색 시도');
        try {
          const directFiles = Drive.Files.list({
            fields: 'files(id,name,mimeType,description,modifiedTime,owners,parents)',
            orderBy: 'name'
          });
          
          debugInfo.push('📄 방법 2 - 전체 파일 검색 결과: ' + JSON.stringify(directFiles));
          
          // 해당 폴더의 파일들만 필터링
          const filteredFiles = (directFiles.files || []).filter(file => 
            file.parents && file.parents.includes(folder.data.id)
          );
          
          debugInfo.push('📄 방법 2 - 필터링된 파일 수: ' + filteredFiles.length);
          allFiles = { files: filteredFiles };
        } catch (directSearchError) {
          debugInfo.push('❌ 방법 2 - 직접 검색 오류: ' + directSearchError.message);
        }
      }
      
      // 각 파일의 상세 정보 로깅
      if (allFiles.files && allFiles.files.length > 0) {
        allFiles.files.forEach((file, index) => {
          debugInfo.push(`📄 파일 ${index + 1}: ${file.name} (${file.mimeType})`);
        });
      } else {
        debugInfo.push('❌ 모든 방법으로 파일을 찾을 수 없습니다');
      }
      
    } catch (allFilesError) {
      debugInfo.push('📄 모든 파일 검색 오류: ' + allFilesError.message);
      return {
        success: false,
        message: '파일 검색 실패: ' + allFilesError.message,
        debugInfo: debugInfo
      };
    }
    
    // Google Docs 파일만 필터링
    debugInfo.push('📄 Google Docs 파일 필터링 시작');
    const googleDocsFiles = allFiles.files ? allFiles.files.filter(file => 
      file.mimeType === 'application/vnd.google-apps.document'
    ) : [];
    
    debugInfo.push('📄 Google Docs 파일 수: ' + googleDocsFiles.length);
    googleDocsFiles.forEach((file, index) => {
      debugInfo.push(`📄 Google Docs 파일 ${index + 1}: ${file.name}`);
    });
    
    const files = { files: googleDocsFiles };
    
    if (!files.files || files.files.length === 0) {
      debugInfo.push('📄 템플릿 폴더에 문서가 없습니다');
      return {
        success: true,
        data: [],
        message: '템플릿 폴더에 문서가 없습니다',
        debugInfo: debugInfo
      };
    }
    
    // 템플릿 정보 파싱 (기본 템플릿은 파일명 방식 유지)
    const templates = files.files.map(file => {
      const p = file.properties || {};
      return {
        id: file.id,
        type: file.id,
        title: file.name,
        description: p.description || file.description || '템플릿 파일',
        tag: p.tag || '기본',
        fullTitle: file.name,
        modifiedDate: file.modifiedTime,
        owner: file.owners && file.owners.length > 0 ? file.owners[0].displayName : 'Unknown'
      };
    });
    
    debugInfo.push('📄 템플릿 목록 가져오기 성공: ' + templates.length + '개');
    debugInfo.push('📄 템플릿 목록: ' + JSON.stringify(templates));
    
    return {
      success: true,
      data: templates,
      message: `${templates.length}개의 템플릿을 찾았습니다`,
      debugInfo: debugInfo
    };
    
  } catch (error) {
    debugInfo.push('❌ 템플릿 목록 가져오기 오류: ' + error.message);
    return {
      success: false,
      message: '템플릿 목록을 가져오는 중 오류가 발생했습니다: ' + error.message,
      debugInfo: debugInfo
    };
  }
}

/**
 * 공유 템플릿 업로드(파일 업로드 + properties 저장 + 폴더 이동)
 * req: { fileName, fileMimeType, fileContentBase64, meta: { title, description, tag, creatorEmail } }
 */
function uploadSharedTemplate(req) {
  try {
    if (!req || !req.fileName || !req.fileContentBase64) {
      return { success: false, message: 'fileName과 fileContentBase64가 필요합니다.' };
    }
    // 권한 검증: 관리자만 허용
    var creatorEmail = (req.meta && req.meta.creatorEmail) || '';
    var status = checkUserStatus(creatorEmail);
    if (!status.success || !status.data || !status.data.user || status.data.user.is_admin !== 'O') {
      return { success: false, message: '관리자만 템플릿을 업로드할 수 있습니다.' };
    }

    // 입력 검증/정규화
    var sanitize = function(s){
      if (!s) return '';
      s = String(s);
      s = s.replace(/[<>"'\\]/g, '');
      return s.substring(0, 200);
    };

    var safeTitle = sanitize((req.meta && req.meta.title) || req.fileName);
    var safeDesc = sanitize((req.meta && req.meta.description) || '');
    var safeTag = sanitize((req.meta && req.meta.tag) || '기본');
    var mime = req.fileMimeType || '';
    var allowed = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.ms-excel'];
    if (mime && allowed.indexOf(mime) === -1) {
      return { success: false, message: '지원되지 않는 파일 형식입니다.' };
    }
    if (req.fileContentBase64.length > 12 * 1024 * 1024) { // ~12MB base64 길이 보호
      return { success: false, message: '파일이 너무 큽니다.' };
    }

    if (typeof Drive === 'undefined') {
      return { success: false, message: 'Drive API가 활성화되지 않았습니다.' };
    }

    var bytes = Utilities.base64Decode(req.fileContentBase64);
    var blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', req.fileName);

    // 대상 폴더 준비(사전 조회) 후 부모 설정과 함께 업로드
    var folderPath = getTemplateFolderPath();
    var folderRes = findOrCreateFolder(folderPath);
    if (!folderRes || !folderRes.success || !folderRes.data || !folderRes.data.id) {
      return { success: false, message: '양식 폴더를 찾을 수 없습니다.' };
    }

    // 업로드: 부모(folder)와 이름을 메타데이터로 설정해 바로 해당 폴더에 저장 (Drive v3 스타일)
    // Word/Excel 업로드 시 Google 형식으로 변환하여 저장
    var targetGoogleMime = 'application/vnd.google-apps.document';
    var lower = (mime || '').toLowerCase();
    if (lower.indexOf('sheet') !== -1 || lower.indexOf('excel') !== -1 || lower.indexOf('spreadsheetml') !== -1) {
      targetGoogleMime = 'application/vnd.google-apps.spreadsheet';
    }
    var created = Drive.Files.create({
      name: safeTitle,
      mimeType: targetGoogleMime,
      parents: [folderRes.data.id]
    }, blob);

    // properties 설정
    var props = {
      description: safeDesc,
      tag: safeTag,
      creatorEmail: creatorEmail,
      createdDate: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
    };
    Drive.Files.update({ properties: props }, created.id);

    return { success: true, data: { id: created.id } };
  } catch (e) {
    return { success: false, message: '업로드 실패: ' + e.message };
  }
}

/**
 * 공유 템플릿 메타데이터 수정(properties만)
 */
function updateSharedTemplateMeta(req) {
  try {
    if (!req || !req.fileId) {
      return { success: false, message: 'fileId가 필요합니다.' };
    }
    // 관리자 검증
    var editorEmail = (req.meta && req.meta.creatorEmail) || req.editorEmail || '';
    var status = checkUserStatus(editorEmail);
    if (!status.success || !status.data || !status.data.user || status.data.user.is_admin !== 'O') {
      return { success: false, message: '관리자만 메타데이터를 수정할 수 있습니다.' };
    }
    var updateProps = {};
    if (req.meta) {
      var sanitize = function(s){ if(!s) return ''; s=String(s); s=s.replace(/[<>"'\\]/g,''); return s.substring(0,200); };
      if (req.meta.title !== undefined) updateProps.title = sanitize(req.meta.title);
      if (req.meta.description !== undefined) updateProps.description = sanitize(req.meta.description);
      if (req.meta.tag !== undefined) updateProps.tag = sanitize(req.meta.tag);
      if (req.meta.creatorEmail !== undefined) updateProps.creatorEmail = sanitize(req.meta.creatorEmail);
    }
    Drive.Files.update({ properties: updateProps }, req.fileId);
    return { success: true };
  } catch (e) {
    return { success: false, message: '메타데이터 업데이트 실패: ' + e.message };
  }
}

/**
 * 공유 템플릿 목록(메타데이터 우선) 반환
 */
function getSharedTemplates() {
  try {
    var folderPath = getTemplateFolderPath();
    var folderRes = findOrCreateFolder(folderPath);
    if (!folderRes || !folderRes.success || !folderRes.data || !folderRes.data.id) {
      return { success: false, message: '양식 폴더를 찾을 수 없습니다.' };
    }
    var files = Drive.Files.list({
      q: '\'' + folderRes.data.id + '\' in parents and trashed=false',
      fields: 'files(id,name,mimeType,modifiedTime,description,properties,owners)'
    });
    var items = (files.files || []).filter(function(f){ return f.mimeType === 'application/vnd.google-apps.document'; }).map(function(file){
      var p = file.properties || {};
      return {
        id: file.id,
        title: file.name,
        description: p.description || file.description || '템플릿 파일',
        tag: p.tag || '기본',
        creatorEmail: p.creatorEmail || '',
        createdDate: p.createdDate || '',
        fullTitle: file.name,
        modifiedDate: file.modifiedTime,
        owner: file.owners && file.owners.length > 0 ? file.owners[0].displayName : 'Unknown'
      };
    });
    return { success: true, data: items };
  } catch (e) {
    return { success: false, message: '공유 템플릿 조회 실패: ' + e.message };
  }
}

/**
 * 특정 폴더 ID로 직접 테스트
 */
function testSpecificFolder() {
  console.log('🔍 특정 폴더 ID 테스트 시작');
  
  try {
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      return {
        success: false,
        message: 'Drive API가 활성화되지 않았습니다.'
      };
    }
    
    // 실제 폴더 구조를 단계별로 찾기
    // 1단계: 루트에서 "hot potato" 또는 "hot_potato" 폴더 찾기
    let hotPotatoFolderId = null;
    const rootFolders = Drive.Files.list({
      q: "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name)'
    });
    
    for (const folder of rootFolders.files || []) {
      if (folder.name === 'hot potato' || folder.name === 'hot_potato') {
        hotPotatoFolderId = folder.id;
        break;
      }
    }
    
    if (!hotPotatoFolderId) {
      return {
        success: false,
        message: 'hot potato 폴더를 찾을 수 없습니다',
        debugInfo: ['루트 폴더에서 hot potato 폴더를 찾을 수 없음']
      };
    }
    
    // 2단계: hot potato 폴더에서 "문서" 폴더 찾기
    let documentFolderId = null;
    const hotPotatoFolders = Drive.Files.list({
      q: `'${hotPotatoFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)'
    });
    
    for (const folder of hotPotatoFolders.files || []) {
      if (folder.name === '문서') {
        documentFolderId = folder.id;
        break;
      }
    }
    
    if (!documentFolderId) {
      return {
        success: false,
        message: '문서 폴더를 찾을 수 없습니다',
        debugInfo: ['hot potato 폴더에서 문서 폴더를 찾을 수 없음']
      };
    }
    
    // 3단계: 문서 폴더에서 "양식" 폴더 찾기
    let templateFolderId = null;
    const documentFolders = Drive.Files.list({
      q: `'${documentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)'
    });
    
    for (const folder of documentFolders.files || []) {
      if (folder.name === '양식') {
        templateFolderId = folder.id;
        break;
      }
    }
    
    if (!templateFolderId) {
      return {
        success: false,
        message: '양식 폴더를 찾을 수 없습니다',
        debugInfo: ['문서 폴더에서 양식 폴더를 찾을 수 없음']
      };
    }
    
    const testFolderId = templateFolderId;
    
    console.log('🔍 테스트 폴더 ID:', testFolderId);
    
    // 폴더 정보 가져오기 (권한 정보 포함)
    const folder = Drive.Files.get(testFolderId, {
      fields: 'id,name,parents,owners,permissions'
    });
    
    console.log('🔍 폴더 정보:', folder);
    
    // 폴더 소유자 정보 확인
    if (folder.owners && folder.owners.length > 0) {
      console.log('🔍 폴더 소유자:', folder.owners[0].displayName, folder.owners[0].emailAddress);
    }
    
    // 폴더 내 파일 검색 (여러 방법 시도)
    let files;
    try {
      // 방법 1: 기본 쿼리
      files = Drive.Files.list({
        q: `'${testFolderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType)'
      });
      
      console.log('🔍 방법 1 - 폴더 내 파일들:', files);
      
      // 방법 2: 쿼리 없이 전체 검색 후 필터링
      if (!files.files || files.files.length === 0) {
        console.log('🔍 방법 2 - 전체 파일 검색 시도');
        const allFiles = Drive.Files.list({
          fields: 'files(id,name,mimeType,parents)'
        });
        
        const filteredFiles = (allFiles.files || []).filter(file => 
          file.parents && file.parents.includes(testFolderId)
        );
        
        files = { files: filteredFiles };
        console.log('🔍 방법 2 - 필터링된 파일들:', files);
      }
    } catch (fileSearchError) {
      console.error('🔍 파일 검색 오류:', fileSearchError);
      files = { files: [] };
    }
    
    return {
      success: true,
      message: '특정 폴더 테스트 완료',
      folder: folder,
      files: files.files || [],
      debugInfo: [
        `1단계 - hot potato 폴더 ID: ${hotPotatoFolderId}`,
        `2단계 - 문서 폴더 ID: ${documentFolderId}`,
        `3단계 - 양식 폴더 ID: ${testFolderId}`,
        `최종 폴더 이름: ${folder.name}`,
        `파일 수: ${files.files ? files.files.length : 0}`,
        ...(files.files || []).map(f => `- ${f.name} (${f.mimeType})`)
      ]
    };
    
  } catch (error) {
    console.error('🔍 특정 폴더 테스트 오류:', error);
    return {
      success: false,
      message: '특정 폴더 테스트 실패: ' + error.message
    };
  }
}

/**
 * 템플릿 폴더 디버깅 테스트
 */
function testTemplateFolderDebug() {
  console.log('🔍 템플릿 폴더 디버깅 테스트 시작');
  
  try {
    // Drive API 확인
    if (typeof Drive === 'undefined') {
      return {
        success: false,
        message: 'Drive API가 활성화되지 않았습니다.'
      };
    }
    
    // 루트 폴더에서 모든 폴더 검색
    console.log('🔍 루트 폴더에서 모든 폴더 검색');
    const rootFolders = Drive.Files.list({
      q: "'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id,name)'
    });
    
    console.log('🔍 루트 폴더 검색 결과:', rootFolders);
    
    const result = {
      success: true,
      message: '디버깅 테스트 완료',
      rootFolders: rootFolders.files || [],
      debugInfo: [
        '루트 폴더에서 찾은 폴더들:',
        ...(rootFolders.files || []).map(f => `- ${f.name} (${f.id})`)
      ]
    };
    
    console.log('🔍 디버깅 테스트 결과:', result);
    return result;
    
  } catch (error) {
    console.error('🔍 디버깅 테스트 오류:', error);
    return {
      success: false,
      message: '디버깅 테스트 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getDocumentTemplatesInfo() {
  return {
    version: '1.0.0',
    description: '문서 템플릿 관리 관련 기능',
    functions: [
      'getTemplatesFromFolder',
      'testSpecificFolder',
      'testTemplateFolderDebug'
    ],
    dependencies: ['CONFIG.gs']
  };
}
