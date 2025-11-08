/**
 * AnnouncementManagement.gs
 * 공지사항 관리 관련 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 공지사항 관리 함수들 =====

/**
 * 공지사항 시트 이름 가져오기 (스크립트 속성)
 * @returns {string} 시트 이름
 */
function getNoticeSheetName() {
  return PropertiesService.getScriptProperties().getProperty('NOTICE_SHEET_NAME') || '시트1';
}

/**
 * 사용자 시트 이름 가져오기 (스크립트 속성)
 * @returns {string} 시트 이름
 */
function getUserSheetName() {
  return PropertiesService.getScriptProperties().getProperty('SHEET_NAME_USER') || 'user';
}

/**
 * 공지사항 스프레드시트 가져오기
 * @param {string} spreadsheetName - 스프레드시트 이름
 * @returns {Object} 스프레드시트 객체
 */
function getAnnouncementSpreadsheet(spreadsheetName) {
  try {
    const files = DriveApp.getFilesByName(spreadsheetName);
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    }
    throw new Error(`스프레드시트를 찾을 수 없습니다: ${spreadsheetName}`);
  } catch (error) {
    console.error('공지사항 스프레드시트 가져오기 오류:', error);
    throw error;
  }
}

/**
 * 사용자 정보 가져오기 (이메일로)
 * @param {string} email - 사용자 이메일
 * @returns {Object} 사용자 정보
 */
function getUserByEmail(email) {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return null;
    }
    
    const sheetName = getUserSheetName();
    const data = getSheetData(spreadsheet.getId(), sheetName, 'A:G');
    
    if (!data || data.length <= 1) {
      return null;
    }
    
    const header = data[0];
    const encryptedEmail = applyEncryption(email, 'Base64', '');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const user = {};
      header.forEach((key, index) => {
        user[key] = row[index];
      });
      
      if (user.google_member === encryptedEmail && user.Approval === 'O') {
        return {
          no_member: user.no_member,
          user_type: user.user_type,
          name_member: user.name_member,
          email: email,
          is_admin: user.is_admin === 'O'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
}

/**
 * 사용자 목록 가져오기 (권한 설정용)
 * @returns {Array} 사용자 목록
 */
function getUserList() {
  try {
    const spreadsheet = getHpMemberSpreadsheet();
    if (!spreadsheet) {
      return [];
    }
    
    const sheetName = getUserSheetName();
    const data = getSheetData(spreadsheet.getId(), sheetName, 'A:G');
    
    if (!data || data.length <= 1) {
      return [];
    }
    
    const header = data[0];
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const user = {};
      header.forEach((key, index) => {
        user[key] = row[index];
      });
      
      if (user.no_member && user.name_member && user.Approval === 'O') {
        users.push({
          id: user.no_member,
          name: user.name_member,
          user_type: user.user_type || 'student',
          email: user.google_member ? applyDecryption(user.google_member, 'Base64', '') : ''
        });
      }
    }
    
    return users;
  } catch (error) {
    console.error('사용자 목록 가져오기 오류:', error);
    return [];
  }
}

/**
 * 공지사항 작성 권한 확인
 * @param {string} userType - 사용자 타입
 * @returns {boolean} 작성 권한 여부
 */
function canCreateAnnouncement(userType) {
  // student는 작성 불가, 나머지는 모두 가능
  return userType !== 'student';
}

/**
 * 공지사항 수정 권한 확인
 * @param {string} writerId - 작성자 ID
 * @param {string} currentUserId - 현재 사용자 ID
 * @returns {boolean} 수정 권한 여부
 */
function canEditAnnouncement(writerId, currentUserId) {
  return String(writerId) === String(currentUserId);
}

/**
 * 공지사항 읽기 권한 확인
 * @param {Object} announcement - 공지사항 정보
 * @param {string} userId - 사용자 ID
 * @param {string} userType - 사용자 타입
 * @returns {boolean} 읽기 권한 여부
 */
function canReadAnnouncement(announcement, userId, userType) {
  // 작성자는 항상 읽기 가능
  if (String(announcement.writer_id) === String(userId)) {
    return true;
  }
  
  // 권한 설정이 없으면 작성자만 볼 수 있음 (이미 작성자 체크는 위에서 했으므로 false)
  if (!announcement.access_rights || announcement.access_rights === '' || announcement.access_rights.trim() === '') {
    return false;
  }
  
  try {
    const accessRights = JSON.parse(announcement.access_rights);
    
    // 개별 권한 확인 (ID를 문자열로 통일하여 비교)
    if (accessRights.individual && Array.isArray(accessRights.individual)) {
      const hasAccess = accessRights.individual.some(id => String(id) === String(userId));
      if (hasAccess) {
        return true;
      }
    }
    
    // 그룹 권한 확인
    if (accessRights.groups && Array.isArray(accessRights.groups)) {
      if (accessRights.groups.includes(userType)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // 파싱 오류 시 접근 불가 (안전하게 처리)
    return false;
  }
}

/**
 * 공지사항 목록 가져오기 (권한 필터링)
 * @param {string} spreadsheetName - 스프레드시트 이름
 * @param {string} userId - 사용자 ID
 * @param {string} userType - 사용자 타입
 * @returns {Object} 공지사항 목록
 */
function getAnnouncements(req) {
  try {
    const { spreadsheetName, userId, userType } = req;
    
    if (!spreadsheetName || !userId || !userType) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.',
        announcements: []
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`,
        announcements: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: true,
        announcements: [],
        message: '공지사항이 없습니다.'
      };
    }
    
    const header = data[0];
    const announcements = [];
    
    // 헤더 인덱스 찾기
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // no_notice가 비어있으면 건너뛰기
      const noticeId = row[headerMap['no_notice']];
      if (!noticeId || noticeId === '') {
        continue;
      }
      
      const announcement = {
        id: String(noticeId), // ID를 문자열로 통일
        writer_notice: row[headerMap['writer_notice']] || '',
        writer_email: row[headerMap['writer_email']] || '',
        writer_id: '', // writer_email에서 추출 필요
        access_rights: row[headerMap['access_rights']] || '',
        title_notice: row[headerMap['title_notice']] || '',
        content_notice: row[headerMap['content_notice']] || '',
        date: row[headerMap['date']] || '',
        view_count: parseInt(row[headerMap['view_count']] || '0', 10),
        file_notice: row[headerMap['file_notice']] || '',
        fix_notice: row[headerMap['fix_notice']] || ''
      };
      
      // writer_email에서 writer_id 추출 (암호화된 이메일에서 사용자 찾기)
      if (announcement.writer_email) {
        try {
          const decryptedEmail = applyDecryption(announcement.writer_email, 'Base64', '');
          const writer = getUserByEmail(decryptedEmail);
          if (writer) {
            announcement.writer_id = String(writer.no_member); // ID를 문자열로 통일
          }
        } catch (error) {
          // 복호화 실패해도 계속 진행 (작성자 정보만 없을 뿐)
        }
      }
      
      // 권한 확인
      if (canReadAnnouncement(announcement, String(userId), userType)) {
        announcements.push(announcement);
      }
    }
    
    // 고정 공지 분리 및 정렬
    const pinnedAnnouncements = announcements.filter(a => a.fix_notice === 'O');
    const normalAnnouncements = announcements.filter(a => a.fix_notice !== 'O');
    
    // 고정 공지는 최상단, 나머지는 날짜 역순
    pinnedAnnouncements.sort((a, b) => new Date(b.date) - new Date(a.date));
    normalAnnouncements.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const sortedAnnouncements = [...pinnedAnnouncements, ...normalAnnouncements];
    
    return {
      success: true,
      announcements: sortedAnnouncements,
      message: `${sortedAnnouncements.length}개의 공지사항을 불러왔습니다.`
    };
  } catch (error) {
    console.error('공지사항 목록 가져오기 오류:', error);
    return {
      success: false,
      message: '공지사항 목록을 가져오는 중 오류가 발생했습니다: ' + error.message,
      announcements: []
    };
  }
}

/**
 * 공지사항 작성
 * @param {Object} req - 요청 데이터
 * @returns {Object} 작성 결과
 */
function createAnnouncement(req) {
  try {
    const { 
      spreadsheetName, 
      writerEmail, 
      writerName, 
      title, 
      content, 
      fileNotice, 
      accessRights, 
      isPinned 
    } = req;
    
    if (!spreadsheetName || !writerEmail || !title || !content) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      };
    }
    
    // 사용자 정보 확인
    const user = getUserByEmail(writerEmail);
    if (!user) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.'
      };
    }
    
    // 작성 권한 확인
    if (!canCreateAnnouncement(user.user_type)) {
      return {
        success: false,
        message: '학생은 공지사항을 작성할 수 없습니다.'
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    // 새 공지 번호 생성
    const lastRow = sheet.getLastRow();
    const newNoticeId = lastRow; // 헤더 제외
    
    // 이메일 암호화
    const encryptedEmail = applyEncryption(writerEmail, 'Base64', '');
    
    // 권한 설정 JSON 문자열화
    const accessRightsStr = accessRights ? JSON.stringify(accessRights) : '';
    
    // 고정 공지 상태 (요청 시 '-', 아니면 빈칸)
    const fixNotice = isPinned ? '-' : '';
    
    // 새 행 추가
    const newRow = [
      newNoticeId,              // A: no_notice
      writerName || user.name_member, // B: writer_notice
      encryptedEmail,           // C: writer_email
      accessRightsStr,          // D: access_rights
      title,                     // E: title_notice
      content,                   // F: content_notice
      new Date().toISOString().slice(0, 10), // G: date
      0,                         // H: view_count
      fileNotice || '',          // I: file_notice
      fixNotice                  // J: fix_notice
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: '공지사항이 작성되었습니다.',
      announcementId: newNoticeId
    };
  } catch (error) {
    console.error('공지사항 작성 오류:', error);
    return {
      success: false,
      message: '공지사항 작성 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 공지사항 수정
 * @param {Object} req - 요청 데이터
 * @returns {Object} 수정 결과
 */
function updateAnnouncement(req) {
  try {
    const { 
      spreadsheetName, 
      announcementId, 
      userId, 
      title, 
      content, 
      fileNotice, 
      accessRights,
      isPinned 
    } = req;
    
    if (!spreadsheetName || !announcementId || !userId) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: false,
        message: '공지사항 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    // 공지사항 찾기
    let targetRowIndex = -1;
    let announcement = null;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[headerMap['no_notice']]) === String(announcementId)) {
        targetRowIndex = i + 1; // 시트 행 번호 (1-based)
        announcement = {
          writer_id: row[headerMap['writer_email']] ? 
            (() => {
              const decryptedEmail = applyDecryption(row[headerMap['writer_email']], 'Base64', '');
              const writer = getUserByEmail(decryptedEmail);
              return writer ? writer.no_member : '';
            })() : ''
        };
        break;
      }
    }
    
    if (targetRowIndex === -1 || !announcement) {
      return {
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      };
    }
    
    // 수정 권한 확인
    if (!canEditAnnouncement(announcement.writer_id, userId)) {
      return {
        success: false,
        message: '수정 권한이 없습니다.'
      };
    }
    
    // 현재 fix_notice 값 확인 (targetRowIndex를 사용하여 데이터에서 가져오기)
    const currentRow = data[targetRowIndex - 1]; // targetRowIndex는 1-based이므로 -1
    const currentFixNotice = currentRow[headerMap['fix_notice']] || '';
    
    // 수정할 데이터 준비
    const updateData = {};
    if (title !== undefined) updateData[headerMap['title_notice']] = title;
    if (content !== undefined) updateData[headerMap['content_notice']] = content;
    if (fileNotice !== undefined) updateData[headerMap['file_notice']] = fileNotice;
    if (accessRights !== undefined) {
      updateData[headerMap['access_rights']] = accessRights ? JSON.stringify(accessRights) : '';
    }
    
    // 고정 공지 처리
    if (isPinned !== undefined) {
      if (isPinned) {
        // 고정 공지 요청: 기존에 'O'가 아니면 '-'로 설정 (요청)
        if (currentFixNotice !== 'O') {
          updateData[headerMap['fix_notice']] = '-';
        }
        // 이미 'O'면 그대로 유지
      } else {
        // 고정 공지 해제: 'O'인 경우에만 빈칸으로 변경 (요청 중이거나 거절된 경우는 유지)
        if (currentFixNotice === 'O') {
          updateData[headerMap['fix_notice']] = '';
        }
      }
    }
    
    // 데이터 업데이트
    Object.keys(updateData).forEach(colIndex => {
      sheet.getRange(targetRowIndex, parseInt(colIndex) + 1).setValue(updateData[colIndex]);
    });
    
    return {
      success: true,
      message: '공지사항이 수정되었습니다.'
    };
  } catch (error) {
    console.error('공지사항 수정 오류:', error);
    return {
      success: false,
      message: '공지사항 수정 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 공지사항 삭제
 * @param {Object} req - 요청 데이터
 * @returns {Object} 삭제 결과
 */
function deleteAnnouncement(req) {
  try {
    const { spreadsheetName, announcementId, userId } = req;
    
    if (!spreadsheetName || !announcementId || !userId) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: false,
        message: '공지사항 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    // 공지사항 찾기 및 권한 확인
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const noticeId = row[headerMap['no_notice']];
      
      // no_notice가 비어있으면 건너뛰기
      if (!noticeId || noticeId === '') {
        continue;
      }
      
      if (String(noticeId) === String(announcementId)) {
        const writerEmail = row[headerMap['writer_email']];
        const decryptedEmail = applyDecryption(writerEmail, 'Base64', '');
        const writer = getUserByEmail(decryptedEmail);
        
        if (!writer || !canEditAnnouncement(writer.no_member, userId)) {
          return {
            success: false,
            message: '삭제 권한이 없습니다.'
          };
        }
        
        targetRowIndex = i + 1; // 시트 행 번호 (1-based)
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      return {
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      };
    }
    
    // 행 삭제
    sheet.deleteRow(targetRowIndex);
    
    // 삭제 후 남은 공지사항들의 no_notice 번호를 행 번호로 재정렬
    const updatedData = sheet.getDataRange().getValues();
    if (updatedData && updatedData.length > 1) {
      const noNoticeColIndex = headerMap['no_notice'];
      if (noNoticeColIndex !== undefined && noNoticeColIndex !== null) {
        // 헤더를 제외한 실제 데이터가 있는 행들만 번호 매기기
        let noticeNumber = 1; // 실제 데이터 행 번호 (1부터 시작)
        
        for (let i = 1; i < updatedData.length; i++) {
          const row = updatedData[i];
          const currentNoticeId = row[noNoticeColIndex];
          
          // no_notice가 비어있거나 빈 행이면 건너뛰기
          if (!currentNoticeId || currentNoticeId === '') {
            continue;
          }
          
          // 현재 값이 행 번호와 다르면 업데이트
          if (String(currentNoticeId) !== String(noticeNumber)) {
            sheet.getRange(i + 1, noNoticeColIndex + 1).setValue(noticeNumber);
          }
          
          noticeNumber++; // 다음 번호로 증가
        }
        
        // 변경사항 즉시 반영
        SpreadsheetApp.flush();
      }
    }
    
    return {
      success: true,
      message: '공지사항이 삭제되었고 번호가 재정렬되었습니다.'
    };
  } catch (error) {
    console.error('공지사항 삭제 오류:', error);
    return {
      success: false,
      message: '공지사항 삭제 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 조회수 증가
 * @param {Object} req - 요청 데이터
 * @returns {Object} 결과
 */
function incrementViewCount(req) {
  try {
    const { spreadsheetName, announcementId } = req;
    
    if (!spreadsheetName || !announcementId) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: false,
        message: '공지사항 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    // 공지사항 찾기
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const noticeId = row[headerMap['no_notice']];
      
      // no_notice가 비어있으면 건너뛰기
      if (!noticeId || noticeId === '') {
        continue;
      }
      
      if (String(noticeId) === String(announcementId)) {
        targetRowIndex = i + 1; // 시트 행 번호 (1-based)
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      return {
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      };
    }
    
    // 조회수 증가
    const viewCountColIndex = headerMap['view_count'];
    if (viewCountColIndex === undefined || viewCountColIndex === null) {
      return {
        success: false,
        message: 'view_count 컬럼을 찾을 수 없습니다.'
      };
    }
    
    const currentViews = parseInt(data[targetRowIndex - 1][viewCountColIndex] || '0', 10);
    const newViews = currentViews + 1;
    
    sheet.getRange(targetRowIndex, viewCountColIndex + 1).setValue(newViews);
    
    return {
      success: true,
      viewCount: newViews
    };
  } catch (error) {
    console.error('조회수 증가 오류:', error);
    return {
      success: false,
      message: '조회수 증가 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 고정 공지 승인 요청
 * @param {Object} req - 요청 데이터
 * @returns {Object} 결과
 */
function requestPinnedAnnouncement(req) {
  try {
    const { spreadsheetName, announcementId, userId } = req;
    
    if (!spreadsheetName || !announcementId || !userId) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: false,
        message: '공지사항 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[headerMap['no_notice']]) === String(announcementId)) {
        const writerEmail = row[headerMap['writer_email']];
        const decryptedEmail = applyDecryption(writerEmail, 'Base64', '');
        const writer = getUserByEmail(decryptedEmail);
        
        if (!writer || !canEditAnnouncement(writer.no_member, userId)) {
          return {
            success: false,
            message: '권한이 없습니다.'
          };
        }
        
        // fix_notice를 '-'로 설정
        sheet.getRange(i + 1, headerMap['fix_notice'] + 1).setValue('-');
        
        return {
          success: true,
          message: '고정 공지 승인 요청이 완료되었습니다.'
        };
      }
    }
    
    return {
      success: false,
      message: '공지사항을 찾을 수 없습니다.'
    };
  } catch (error) {
    console.error('고정 공지 승인 요청 오류:', error);
    return {
      success: false,
      message: '고정 공지 승인 요청 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 고정 공지 승인/거절 (관리자용)
 * @param {Object} req - 요청 데이터
 * @returns {Object} 결과
 */
function approvePinnedAnnouncement(req) {
  try {
    // approvalAction을 사용 (action은 라우팅용으로 사용되므로)
    const { spreadsheetName, announcementId, approvalAction } = req;
    const action = approvalAction; // 'approve' or 'reject'
    
    if (!spreadsheetName || !announcementId || !action) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.',
        debug: { spreadsheetName, announcementId, approvalAction, action }
      };
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return {
        success: false,
        message: '잘못된 액션입니다. (approve 또는 reject만 가능)',
        debug: { action }
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`,
        debug: { 
          spreadsheetName, 
          sheetName, 
          availableSheets: spreadsheet.getSheets().map(s => s.getName())
        }
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: false,
        message: '공지사항 데이터를 찾을 수 없습니다.'
      };
    }
    
    const header = data[0];
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    // 공지사항 찾기
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const noticeId = row[headerMap['no_notice']];
      
      // no_notice가 비어있으면 건너뛰기
      if (!noticeId || noticeId === '') {
        continue;
      }
      
      if (String(noticeId) === String(announcementId)) {
        targetRowIndex = i + 1; // 시트 행 번호 (1-based)
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      // 디버깅: 찾은 공지사항 ID 목록
      const foundIds = [];
      for (let i = 1; i < Math.min(data.length, 10); i++) {
        const row = data[i];
        const noticeId = row[headerMap['no_notice']];
        if (noticeId) {
          foundIds.push(String(noticeId));
        }
      }
      return {
        success: false,
        message: '공지사항을 찾을 수 없습니다.',
        debug: { 
          requestedId: String(announcementId), 
          foundIds: foundIds,
          totalRows: data.length - 1
        }
      };
    }
    
    // fix_notice 컬럼 확인
    const fixNoticeColIndex = headerMap['fix_notice'];
    if (fixNoticeColIndex === undefined || fixNoticeColIndex === null) {
      return {
        success: false,
        message: 'fix_notice 컬럼을 찾을 수 없습니다. 헤더: ' + JSON.stringify(header)
      };
    }
    
    // 고정 공지 상태 업데이트
    const fixNoticeValue = action === 'approve' ? 'O' : 'X';
    
    try {
      // 시트 업데이트
      const targetRange = sheet.getRange(targetRowIndex, fixNoticeColIndex + 1);
      targetRange.setValue(fixNoticeValue);
      
      // 변경사항 즉시 반영
      SpreadsheetApp.flush();
      
      // 업데이트 확인
      const updatedValue = targetRange.getValue();
      if (updatedValue !== fixNoticeValue) {
        return {
          success: false,
          message: '시트 업데이트가 실패했습니다. 예상값: ' + fixNoticeValue + ', 실제값: ' + updatedValue
        };
      }
      
      return {
        success: true,
        message: action === 'approve' ? '고정 공지가 승인되었습니다.' : '고정 공지가 거절되었습니다.',
        updatedValue: updatedValue
      };
    } catch (updateError) {
      return {
        success: false,
        message: '시트 업데이트 중 오류가 발생했습니다: ' + updateError.message
      };
    }
  } catch (error) {
    console.error('고정 공지 승인/거절 오류:', error);
    return {
      success: false,
      message: '고정 공지 승인/거절 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * 고정 공지 승인 대기 목록 가져오기 (관리자용)
 * @param {Object} req - 요청 데이터
 * @returns {Object} 승인 대기 목록
 */
function getPinnedAnnouncementRequests(req) {
  try {
    const { spreadsheetName } = req;
    
    if (!spreadsheetName) {
      return {
        success: false,
        message: '필수 파라미터가 누락되었습니다.',
        requests: []
      };
    }
    
    const spreadsheet = getAnnouncementSpreadsheet(spreadsheetName);
    const sheetName = getNoticeSheetName();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        message: `시트를 찾을 수 없습니다: ${sheetName}`,
        requests: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return {
        success: true,
        requests: [],
        message: '승인 대기 중인 고정 공지가 없습니다.'
      };
    }
    
    const header = data[0];
    const headerMap = {};
    header.forEach((h, index) => {
      headerMap[h] = index;
    });
    
    const requests = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fixNotice = row[headerMap['fix_notice']] || '';
      
      // 승인 대기 중인 것만 ('-')
      if (fixNotice === '-') {
        const writerEmail = row[headerMap['writer_email']];
        const decryptedEmail = applyDecryption(writerEmail, 'Base64', '');
        const writer = getUserByEmail(decryptedEmail);
        
        requests.push({
          id: row[headerMap['no_notice']] || '',
          title: row[headerMap['title_notice']] || '',
          writer: row[headerMap['writer_notice']] || '',
          writerEmail: decryptedEmail,
          writerId: writer ? writer.no_member : '',
          date: row[headerMap['date']] || '',
          status: 'pending'
        });
      }
    }
    
    return {
      success: true,
      requests: requests,
      message: `${requests.length}개의 승인 대기 중인 고정 공지가 있습니다.`
    };
  } catch (error) {
    console.error('고정 공지 승인 대기 목록 가져오기 오류:', error);
    return {
      success: false,
      message: '고정 공지 승인 대기 목록을 가져오는 중 오류가 발생했습니다: ' + error.message,
      requests: []
    };
  }
}

// ===== 배포 정보 =====
function getAnnouncementManagementInfo() {
  return {
    version: '1.0.0',
    description: '공지사항 관리 관련 함수들',
    functions: [
      'getAnnouncements',
      'createAnnouncement',
      'updateAnnouncement',
      'deleteAnnouncement',
      'incrementViewCount',
      'requestPinnedAnnouncement',
      'approvePinnedAnnouncement',
      'getPinnedAnnouncementRequests',
      'getUserList'
    ],
    dependencies: ['SpreadsheetCore.gs', 'EncryptionEmail.gs', 'CONFIG.gs']
  };
}

