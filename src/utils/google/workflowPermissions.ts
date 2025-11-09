/**
 * workflowPermissions.ts
 * 프론트엔드에서 개인 문서 권한 부여 유틸리티
 * 사용자의 Google 계정 권한으로 문서 권한 부여
 */

/**
 * 개인 문서에 권한 부여 (프론트엔드)
 * @param documentId 문서 ID
 * @param userEmails 권한 부여할 사용자 이메일 배열
 * @param permissionType 권한 타입 ('reader' | 'writer', 기본: 'reader')
 * @returns 권한 부여 결과
 */
export async function grantPersonalDocumentPermissions(
  documentId: string,
  userEmails: string[],
  permissionType: 'reader' | 'writer' = 'reader'
): Promise<{
  successCount: number;
  failCount: number;
  grantedUsers: string[];
  failedUsers: string[];
  details: Array<{ email: string; success: boolean; message?: string }>;
}> {
  const gapi = window.gapi;
  
  if (!gapi?.client?.drive) {
    throw new Error('Google Drive API가 초기화되지 않았습니다.');
  }
  
  const role = permissionType === 'writer' ? 'writer' : 'reader';
  const results = {
    successCount: 0,
    failCount: 0,
    grantedUsers: [] as string[],
    failedUsers: [] as string[],
    details: [] as Array<{ email: string; success: boolean; message?: string }>
  };
  
  // 중복 제거
  const uniqueEmails = [...new Set(userEmails.filter(email => email && email.trim() !== ''))];
  
  for (const email of uniqueEmails) {
    try {
      // Drive API v3를 사용하여 권한 부여
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${documentId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: role,
            type: 'user',
            emailAddress: email,
            sendNotificationEmail: false
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // 이미 권한이 있는 경우는 성공으로 처리
        if (response.status === 400 && errorData.error?.message?.includes('already')) {
          results.successCount++;
          results.grantedUsers.push(email);
          results.details.push({
            email: email,
            success: true,
            message: '이미 권한이 있습니다'
          });
          continue;
        }
        
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }
      
      results.successCount++;
      results.grantedUsers.push(email);
      results.details.push({
        email: email,
        success: true
      });
      
      // API 제한 방지 (짧은 대기)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 권한 부여 실패 [${email}]:`, errorMessage);
      results.failCount++;
      results.failedUsers.push(email);
      results.details.push({
        email: email,
        success: false,
        message: errorMessage
      });
    }
  }
  
  return results;
}

/**
 * 여러 개인 문서에 일괄 권한 부여
 * @param documents 문서 배열 { documentId, userEmails }
 * @param permissionType 권한 타입
 * @returns 전체 권한 부여 결과
 */
export async function grantPermissionsToMultiplePersonalDocuments(
  documents: Array<{ documentId: string; userEmails: string[] }>,
  permissionType: 'reader' | 'writer' = 'reader'
): Promise<{
  totalDocuments: number;
  totalUsers: number;
  successCount: number;
  failCount: number;
  documentResults: Array<{
    documentId: string;
    successCount: number;
    failCount: number;
    grantedUsers: string[];
    failedUsers: string[];
  }>;
}> {
  const results = {
    totalDocuments: documents.length,
    totalUsers: 0,
    successCount: 0,
    failCount: 0,
    documentResults: [] as Array<{
      documentId: string;
      successCount: number;
      failCount: number;
      grantedUsers: string[];
      failedUsers: string[];
    }>
  };
  
  for (const doc of documents) {
    results.totalUsers += doc.userEmails.length;
    const result = await grantPersonalDocumentPermissions(doc.documentId, doc.userEmails, permissionType);
    results.documentResults.push({
      documentId: doc.documentId,
      ...result
    });
    
    if (result.successCount > 0) {
      results.successCount++;
    } else {
      results.failCount++;
    }
  }
  
  return results;
}

