/**
 * TimeUtils.gs
 * 시간 관련 유틸리티 함수들
 * Hot Potato Admin Key Management System
 */

// ===== 시간 관련 함수들 =====

/**
 * 한국 표준시(KST) 가져오기
 * @returns {Date} KST 시간
 */
function getKSTTime() {
  const now = new Date();
  const kstOffset = getConfig('kst_offset'); // CONFIG에서 가져옴
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (kstOffset * 60000));
  return kst;
}

/**
 * KST 포맷팅
 * @param {Date} date - 포맷팅할 날짜
 * @returns {string} 포맷팅된 시간 문자열
 */
function formatKSTTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} KST`;
}

/**
 * 현재 시간을 ISO 형식으로 반환
 * @returns {string} ISO 형식 시간 문자열
 */
function getCurrentISOTime() {
  return new Date().toISOString();
}

/**
 * 현재 시간을 KST 형식으로 반환
 * @returns {string} KST 형식 시간 문자열
 */
function getCurrentKSTTime() {
  return formatKSTTime(getKSTTime());
}

/**
 * 시간 차이 계산 (밀리초)
 * @param {Date} startTime - 시작 시간
 * @param {Date} endTime - 종료 시간
 * @returns {number} 시간 차이 (밀리초)
 */
function getTimeDifference(startTime, endTime) {
  return endTime.getTime() - startTime.getTime();
}

/**
 * 시간 차이를 사람이 읽기 쉬운 형식으로 변환
 * @param {number} milliseconds - 밀리초
 * @returns {string} 사람이 읽기 쉬운 시간 문자열
 */
function formatTimeDifference(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}일 ${hours % 24}시간 ${minutes % 60}분`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  } else {
    return `${seconds}초`;
  }
}

/**
 * 시간이 특정 범위 내에 있는지 확인
 * @param {Date} time - 확인할 시간
 * @param {Date} startTime - 시작 시간
 * @param {Date} endTime - 종료 시간
 * @returns {boolean} 범위 내 여부
 */
function isTimeInRange(time, startTime, endTime) {
  return time >= startTime && time <= endTime;
}

/**
 * 시간을 특정 단위로 반올림
 * @param {Date} time - 반올림할 시간
 * @param {string} unit - 단위 ('minute', 'hour', 'day')
 * @returns {Date} 반올림된 시간
 */
function roundTime(time, unit) {
  const rounded = new Date(time);
  
  switch (unit) {
    case 'minute':
      rounded.setSeconds(0, 0);
      break;
    case 'hour':
      rounded.setMinutes(0, 0, 0);
      break;
    case 'day':
      rounded.setHours(0, 0, 0, 0);
      break;
    default:
      break;
  }
  
  return rounded;
}

/**
 * 시간을 특정 단위로 내림
 * @param {Date} time - 내림할 시간
 * @param {string} unit - 단위 ('minute', 'hour', 'day')
 * @returns {Date} 내림된 시간
 */
function floorTime(time, unit) {
  const floored = new Date(time);
  
  switch (unit) {
    case 'minute':
      floored.setSeconds(0, 0);
      break;
    case 'hour':
      floored.setMinutes(0, 0, 0);
      break;
    case 'day':
      floored.setHours(0, 0, 0, 0);
      break;
    default:
      break;
  }
  
  return floored;
}

/**
 * 시간을 특정 단위로 올림
 * @param {Date} time - 올림할 시간
 * @param {string} unit - 단위 ('minute', 'hour', 'day')
 * @returns {Date} 올림된 시간
 */
function ceilTime(time, unit) {
  const ceiled = new Date(time);
  
  switch (unit) {
    case 'minute':
      ceiled.setSeconds(0, 0);
      if (time.getSeconds() > 0) {
        ceiled.setMinutes(ceiled.getMinutes() + 1);
      }
      break;
    case 'hour':
      ceiled.setMinutes(0, 0, 0);
      if (time.getMinutes() > 0 || time.getSeconds() > 0) {
        ceiled.setHours(ceiled.getHours() + 1);
      }
      break;
    case 'day':
      ceiled.setHours(0, 0, 0, 0);
      if (time.getHours() > 0 || time.getMinutes() > 0 || time.getSeconds() > 0) {
        ceiled.setDate(ceiled.getDate() + 1);
      }
      break;
    default:
      break;
  }
  
  return ceiled;
}

/**
 * 시간을 특정 형식으로 포맷팅
 * @param {Date} time - 포맷팅할 시간
 * @param {string} format - 형식 ('YYYY-MM-DD', 'HH:mm:ss', 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} 포맷팅된 시간 문자열
 */
function formatTime(time, format) {
  const year = time.getFullYear();
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'HH:mm:ss':
      return `${hours}:${minutes}:${seconds}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    default:
      return time.toString();
  }
}

/**
 * 시간 문자열을 Date 객체로 변환
 * @param {string} timeString - 시간 문자열
 * @param {string} format - 형식 ('YYYY-MM-DD', 'HH:mm:ss', 'YYYY-MM-DD HH:mm:ss')
 * @returns {Date} Date 객체
 */
function parseTime(timeString, format) {
  try {
    switch (format) {
      case 'YYYY-MM-DD':
        const [year, month, day] = timeString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      case 'HH:mm:ss':
        const [hours, minutes, seconds] = timeString.split(':');
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                       parseInt(hours), parseInt(minutes), parseInt(seconds));
      case 'YYYY-MM-DD HH:mm:ss':
        const [datePart, timePart] = timeString.split(' ');
        const [year2, month2, day2] = datePart.split('-');
        const [hours2, minutes2, seconds2] = timePart.split(':');
        return new Date(parseInt(year2), parseInt(month2) - 1, parseInt(day2),
                       parseInt(hours2), parseInt(minutes2), parseInt(seconds2));
      default:
        return new Date(timeString);
    }
  } catch (error) {
    console.error('시간 파싱 오류:', error);
    return new Date();
  }
}

// ===== 배포 정보 =====
function getTimeUtilsInfo() {
  return {
    version: '1.0.0',
    description: '시간 관련 유틸리티 함수들',
    functions: [
      'getKSTTime',
      'formatKSTTime',
      'getCurrentISOTime',
      'getCurrentKSTTime',
      'getTimeDifference',
      'formatTimeDifference',
      'isTimeInRange',
      'roundTime',
      'floorTime',
      'ceilTime',
      'formatTime',
      'parseTime'
    ],
    dependencies: ['CONFIG.gs']
  };
}
