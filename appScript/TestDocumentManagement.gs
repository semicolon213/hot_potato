/**
 * TestDocumentManagement.gs
 * 문서 관리 관련 테스트 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 문서 관리 테스트 함수들 =====

/**
 * 문서 생성 테스트
 * @returns {Object} 테스트 결과
 */
function testDocumentCreation() {
  console.log('=== 문서 생성 테스트 ===');
  
  try {
    const testTitle = 'Test Document ' + new Date().getTime();
    const testTemplateType = 'empty';
    const testCreatorEmail = 'test@example.com';
    const testEditors = ['editor1@example.com', 'editor2@example.com'];
    const testRole = 'student';
    
    console.log('테스트 문서 정보:', {
      title: testTitle,
      templateType: testTemplateType,
      creatorEmail: testCreatorEmail,
      editors: testEditors,
      role: testRole
    });
    
    const result = DocumentCreation.createGoogleDocument(testTitle, testTemplateType);
    
    if (!result.success) {
      throw new Error('문서 생성 실패: ' + result.message);
    }
    
    console.log('문서 생성 성공');
    console.log('문서 ID:', result.data.id);
    console.log('문서 URL:', result.data.webViewLink);
    
    return {
      success: true,
      message: '문서 생성 테스트 성공',
      documentId: result.data.id,
      documentUrl: result.data.webViewLink,
      testData: {
        title: testTitle,
        templateType: testTemplateType,
        creatorEmail: testCreatorEmail,
        editors: testEditors,
        role: testRole
      }
    };
    
  } catch (error) {
    console.error('❌ 문서 생성 테스트 실패:', error);
    return {
      success: false,
      message: '문서 생성 테스트 실패: ' + error.message
    };
  }
}

/**
 * 문서 권한 설정 테스트
 * @returns {Object} 테스트 결과
 */
function testDocumentPermissions() {
  console.log('=== 문서 권한 설정 테스트 ===');
  
  try {
    const testDocumentId = 'test_document_id';
    const testCreatorEmail = 'test@example.com';
    const testEditors = ['editor1@example.com', 'editor2@example.com'];
    
    console.log('테스트 권한 정보:', {
      documentId: testDocumentId,
      creatorEmail: testCreatorEmail,
      editors: testEditors
    });
    
    const result = DocumentPermissions.setDocumentPermissions(testDocumentId, testCreatorEmail, testEditors);
    
    if (!result.success) {
      throw new Error('문서 권한 설정 실패: ' + result.message);
    }
    
    console.log('문서 권한 설정 성공');
    
    return {
      success: true,
      message: '문서 권한 설정 테스트 성공',
      testData: {
        documentId: testDocumentId,
        creatorEmail: testCreatorEmail,
        editors: testEditors
      }
    };
    
  } catch (error) {
    console.error('❌ 문서 권한 설정 테스트 실패:', error);
    return {
      success: false,
      message: '문서 권한 설정 테스트 실패: ' + error.message
    };
  }
}

/**
 * 문서 폴더 이동 테스트
 * @returns {Object} 테스트 결과
 */
function testDocumentFolderMove() {
  console.log('=== 문서 폴더 이동 테스트 ===');
  
  try {
    const testDocumentId = 'test_document_id';
    console.log('이동할 문서 ID:', testDocumentId);
    
    const result = DocumentFolder.moveDocumentToFolder(testDocumentId);
    
    if (!result.success) {
      throw new Error('문서 폴더 이동 실패: ' + result.message);
    }
    
    console.log('문서 폴더 이동 성공');
    
    return {
      success: true,
      message: '문서 폴더 이동 테스트 성공',
      testData: {
        documentId: testDocumentId
      }
    };
    
  } catch (error) {
    console.error('❌ 문서 폴더 이동 테스트 실패:', error);
    return {
      success: false,
      message: '문서 폴더 이동 테스트 실패: ' + error.message
    };
  }
}

/**
 * 문서 스프레드시트 추가 테스트
 * @returns {Object} 테스트 결과
 */
function testDocumentSpreadsheetAdd() {
  console.log('=== 문서 스프레드시트 추가 테스트 ===');
  
  try {
    const testDocumentId = 'test_document_id';
    const testTitle = 'Test Document';
    const testCreatorEmail = 'test@example.com';
    const testDocumentUrl = 'https://docs.google.com/document/d/test_document_id/edit';
    const testRole = 'student';
    
    console.log('테스트 스프레드시트 정보:', {
      documentId: testDocumentId,
      title: testTitle,
      creatorEmail: testCreatorEmail,
      documentUrl: testDocumentUrl,
      role: testRole
    });
    
    const result = DocumentSpreadsheet.addDocumentToSpreadsheet(
      testDocumentId,
      testTitle,
      testCreatorEmail,
      testDocumentUrl,
      testRole
    );
    
    if (!result.success) {
      throw new Error('문서 스프레드시트 추가 실패: ' + result.message);
    }
    
    console.log('문서 스프레드시트 추가 성공');
    
    return {
      success: true,
      message: '문서 스프레드시트 추가 테스트 성공',
      testData: {
        documentId: testDocumentId,
        title: testTitle,
        creatorEmail: testCreatorEmail,
        documentUrl: testDocumentUrl,
        role: testRole
      }
    };
    
  } catch (error) {
    console.error('❌ 문서 스프레드시트 추가 테스트 실패:', error);
    return {
      success: false,
      message: '문서 스프레드시트 추가 테스트 실패: ' + error.message
    };
  }
}

/**
 * 템플릿 폴더에서 템플릿 가져오기 테스트
 * @returns {Object} 테스트 결과
 */
function testTemplateFolderAccess() {
  console.log('=== 템플릿 폴더에서 템플릿 가져오기 테스트 ===');
  
  try {
    const result = DocumentTemplates.getTemplatesFromFolder();
    
    if (!result.success) {
      throw new Error('템플릿 폴더 접근 실패: ' + result.message);
    }
    
    const templates = result.data || [];
    console.log('가져온 템플릿 수:', templates.length);
    
    if (templates.length > 0) {
      console.log('첫 번째 템플릿:', templates[0]);
    }
    
    return {
      success: true,
      message: '템플릿 폴더에서 템플릿 가져오기 테스트 성공',
      templateCount: templates.length,
      sampleTemplate: templates[0] || null
    };
    
  } catch (error) {
    console.error('❌ 템플릿 폴더에서 템플릿 가져오기 테스트 실패:', error);
    return {
      success: false,
      message: '템플릿 폴더에서 템플릿 가져오기 테스트 실패: ' + error.message
    };
  }
}

/**
 * 특정 폴더 테스트
 * @returns {Object} 테스트 결과
 */
function testSpecificFolder() {
  console.log('=== 특정 폴더 테스트 ===');
  
  try {
    const result = DocumentTemplates.testSpecificFolder();
    
    if (!result.success) {
      throw new Error('특정 폴더 테스트 실패: ' + result.message);
    }
    
    console.log('특정 폴더 테스트 성공');
    
    return {
      success: true,
      message: '특정 폴더 테스트 성공',
      result: result
    };
    
  } catch (error) {
    console.error('❌ 특정 폴더 테스트 실패:', error);
    return {
      success: false,
      message: '특정 폴더 테스트 실패: ' + error.message
    };
  }
}

/**
 * 전체 문서 관리 테스트 실행
 * @returns {Object} 전체 테스트 결과
 */
function runAllDocumentManagementTests() {
  console.log('=== 전체 문서 관리 테스트 실행 ===');
  
  try {
    const results = {
      documentCreation: testDocumentCreation(),
      documentPermissions: testDocumentPermissions(),
      documentFolderMove: testDocumentFolderMove(),
      documentSpreadsheetAdd: testDocumentSpreadsheetAdd(),
      templateFolderAccess: testTemplateFolderAccess(),
      specificFolder: testSpecificFolder()
    };
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n=== 문서 관리 테스트 결과 요약 ===`);
    console.log(`성공: ${successCount}/${totalCount}`);
    
    Object.keys(results).forEach(testName => {
      const result = results[testName];
      console.log(`${testName}: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    });
    
    return {
      success: successCount === totalCount,
      message: `문서 관리 테스트 결과: ${successCount}/${totalCount} 성공`,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 전체 문서 관리 테스트 실패:', error);
    return {
      success: false,
      message: '전체 문서 관리 테스트 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getTestDocumentManagementInfo() {
  return {
    version: '1.0.0',
    description: '문서 관리 관련 테스트 함수들',
    functions: [
      'testDocumentCreation',
      'testDocumentPermissions',
      'testDocumentFolderMove',
      'testDocumentSpreadsheetAdd',
      'testTemplateFolderAccess',
      'testSpecificFolder',
      'runAllDocumentManagementTests'
    ],
    dependencies: [
      'DocumentCreation.gs',
      'DocumentPermissions.gs',
      'DocumentFolder.gs',
      'DocumentSpreadsheet.gs',
      'DocumentTemplates.gs'
    ]
  };
}
