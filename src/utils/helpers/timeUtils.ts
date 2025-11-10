export const formatRelativeTime = (timestamp: number): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (past.getTime() >= startOfYesterday.getTime() && past.getTime() < startOfToday.getTime()) {
    return '어제';
  }

  const year = past.getFullYear();
  const month = String(past.getMonth() + 1).padStart(2, '0');
  const day = String(past.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

/**
 * ISO 시간 문자열을 한국어 형식으로 포맷
 * @param isoString ISO 8601 시간 문자열
 * @returns 포맷된 시간 문자열 (예: "2025.10.28 14:30")
 */
export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('시간 포맷 오류:', error);
    return isoString;
  }
};

/**
 * ISO 날짜 문자열을 'YYYY-MM-DD' 형식으로 변환합니다.
 * UTC 시간을 현지 시간 기준으로 변환하여 하루 밀리는 문제를 해결합니다.
 * @param isoString ISO 8601 날짜 문자열 (e.g., "2025-11-09T15:00:00.000Z")
 * @returns 포맷된 날짜 문자열 (e.g., "2025-11-10")
 */
export const formatDateToYYYYMMDD = (isoString: string): string => {
  if (!isoString) return '';

  try {
    // ISO 문자열로부터 Date 객체를 생성합니다.
    // 'Z'는 UTC를 의미하며, new Date()는 이를 브라우저의 로컬 시간대로 자동 변환합니다.
    // 예: KST(UTC+9)에서 "2025-11-09T15:00:00.000Z"는 2025년 11월 10일 00:00:00 KST가 됩니다.
    const date = new Date(isoString);

    const year = date.getFullYear();
    // getMonth()는 0부터 시작하므로 1을 더해줍니다.
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    // 오류 발생 시 원본 문자열의 날짜 부분만 반환하거나, 그대로 반환합니다.
    return isoString.split('T')[0];
  }
};