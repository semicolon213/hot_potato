/**
 * TestUserManagement.gs
 * 사용자 관리 관련 테스트 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 사용자 관리 테스트 함수들 =====

/**
 * 사용자 등록 요청 테스트
 * @returns {Object} 테스트 결과
 */
function testUserRegistration() {
  console.log('=== 사용자 등록 요청 테스트 ===');
  
  try {
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '010-1234-5678',
      department: 'Test Department',
      position: 'Test Position',
      reason: 'Test registration reason'
    };
    
    console.log('테스트 사용자 정보:', testUser);
    
    const result = UserRegistration.handleSubmitRegistrationRequest(testUser);
    
    if (!result.success) {
      throw new Error('사용자 등록 요청 실패: ' + result.message);
    }
    
    console.log('사용자 등록 요청 성공');
    
    return {
      success: true,
      message: '사용자 등록 요청 테스트 성공',
      testUser: testUser
    };
    
  } catch (error) {
    console.error('❌ 사용자 등록 요청 테스트 실패:', error);
    return {
      success: false,
      message: '사용자 등록 요청 테스트 실패: ' + error.message
    };
  }
}

/**
 * 사용자 승인 상태 확인 테스트
 * @returns {Object} 테스트 결과
 */
function testUserApprovalStatus() {
  console.log('=== 사용자 승인 상태 확인 테스트 ===');
  
  try {
    const testEmail = 'test@example.com';
    console.log('확인할 이메일:', testEmail);
    
    const result = UserRegistration.handleCheckApprovalStatus(testEmail);
    
    if (!result.success) {
      throw new Error('승인 상태 확인 실패: ' + result.message);
    }
    
    console.log('승인 상태 확인 성공');
    console.log('승인 상태:', result.data?.status || 'Unknown');
    
    return {
      success: true,
      message: '사용자 승인 상태 확인 테스트 성공',
      testEmail: testEmail,
      status: result.data?.status || 'Unknown'
    };
    
  } catch (error) {
    console.error('❌ 사용자 승인 상태 확인 테스트 실패:', error);
    return {
      success: false,
      message: '사용자 승인 상태 확인 테스트 실패: ' + error.message
    };
  }
}

/**
 * 대기 중인 사용자 목록 테스트
 * @returns {Object} 테스트 결과
 */
function testPendingUsers() {
  console.log('=== 대기 중인 사용자 목록 테스트 ===');
  
  try {
    const result = UserApproval.handleGetPendingUsers();
    
    if (!result.success) {
      throw new Error('대기 중인 사용자 목록 조회 실패: ' + result.message);
    }
    
    const pendingUsers = result.data || [];
    console.log('대기 중인 사용자 수:', pendingUsers.length);
    
    if (pendingUsers.length > 0) {
      console.log('첫 번째 대기 사용자:', pendingUsers[0]);
    }
    
    return {
      success: true,
      message: '대기 중인 사용자 목록 테스트 성공',
      pendingCount: pendingUsers.length,
      sampleUser: pendingUsers[0] || null
    };
    
  } catch (error) {
    console.error('❌ 대기 중인 사용자 목록 테스트 실패:', error);
    return {
      success: false,
      message: '대기 중인 사용자 목록 테스트 실패: ' + error.message
    };
  }
}

/**
 * 사용자 승인 테스트
 * @returns {Object} 테스트 결과
 */
function testUserApproval() {
  console.log('=== 사용자 승인 테스트 ===');
  
  try {
    const testEmail = 'test@example.com';
    console.log('승인할 사용자 이메일:', testEmail);
    
    const result = UserApproval.handleApproveUser(testEmail);
    
    if (!result.success) {
      throw new Error('사용자 승인 실패: ' + result.message);
    }
    
    console.log('사용자 승인 성공');
    
    return {
      success: true,
      message: '사용자 승인 테스트 성공',
      testEmail: testEmail
    };
    
  } catch (error) {
    console.error('❌ 사용자 승인 테스트 실패:', error);
    return {
      success: false,
      message: '사용자 승인 테스트 실패: ' + error.message
    };
  }
}

/**
 * 사용자 거부 테스트
 * @returns {Object} 테스트 결과
 */
function testUserRejection() {
  console.log('=== 사용자 거부 테스트 ===');
  
  try {
    const testEmail = 'test@example.com';
    console.log('거부할 사용자 이메일:', testEmail);
    
    const result = UserApproval.handleRejectUser(testEmail);
    
    if (!result.success) {
      throw new Error('사용자 거부 실패: ' + result.message);
    }
    
    console.log('사용자 거부 성공');
    
    return {
      success: true,
      message: '사용자 거부 테스트 성공',
      testEmail: testEmail
    };
    
  } catch (error) {
    console.error('❌ 사용자 거부 테스트 실패:', error);
    return {
      success: false,
      message: '사용자 거부 테스트 실패: ' + error.message
    };
  }
}

/**
 * 사용자 상태 확인 테스트
 * @returns {Object} 테스트 결과
 */
function testUserStatus() {
  console.log('=== 사용자 상태 확인 테스트 ===');
  
  try {
    const testEmail = 'test@example.com';
    console.log('상태를 확인할 사용자 이메일:', testEmail);
    
    const result = UserAuth.handleCheckUserStatus(testEmail);
    
    if (!result.success) {
      throw new Error('사용자 상태 확인 실패: ' + result.message);
    }
    
    console.log('사용자 상태 확인 성공');
    console.log('사용자 상태:', result.data?.status || 'Unknown');
    
    return {
      success: true,
      message: '사용자 상태 확인 테스트 성공',
      testEmail: testEmail,
      status: result.data?.status || 'Unknown'
    };
    
  } catch (error) {
    console.error('❌ 사용자 상태 확인 테스트 실패:', error);
    return {
      success: false,
      message: '사용자 상태 확인 테스트 실패: ' + error.message
    };
  }
}

/**
 * 전체 사용자 관리 테스트 실행
 * @returns {Object} 전체 테스트 결과
 */
function runAllUserManagementTests() {
  console.log('=== 전체 사용자 관리 테스트 실행 ===');
  
  try {
    const results = {
      registration: testUserRegistration(),
      approvalStatus: testUserApprovalStatus(),
      pendingUsers: testPendingUsers(),
      approval: testUserApproval(),
      rejection: testUserRejection(),
      userStatus: testUserStatus()
    };
    
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n=== 사용자 관리 테스트 결과 요약 ===`);
    console.log(`성공: ${successCount}/${totalCount}`);
    
    Object.keys(results).forEach(testName => {
      const result = results[testName];
      console.log(`${testName}: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    });
    
    return {
      success: successCount === totalCount,
      message: `사용자 관리 테스트 결과: ${successCount}/${totalCount} 성공`,
      results: results
    };
    
  } catch (error) {
    console.error('❌ 전체 사용자 관리 테스트 실패:', error);
    return {
      success: false,
      message: '전체 사용자 관리 테스트 실패: ' + error.message
    };
  }
}

// ===== 배포 정보 =====
function getTestUserManagementInfo() {
  return {
    version: '1.0.0',
    description: '사용자 관리 관련 테스트 함수들',
    functions: [
      'testUserRegistration',
      'testUserApprovalStatus',
      'testPendingUsers',
      'testUserApproval',
      'testUserRejection',
      'testUserStatus',
      'runAllUserManagementTests'
    ],
    dependencies: [
      'UserRegistration.gs',
      'UserApproval.gs',
      'UserAuth.gs'
    ]
  };
}
