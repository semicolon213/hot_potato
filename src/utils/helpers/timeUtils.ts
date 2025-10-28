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