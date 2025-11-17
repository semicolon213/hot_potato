/**
 * @file DataSyncStatus.tsx
 * @brief 데이터 동기화 상태 표시 컴포넌트
 * @details 마지막 갱신 시간과 수동 새로고침 버튼을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { FaSync, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useNotification } from '../../hooks/ui/useNotification';
import './DataSyncStatus.css';

interface DataSyncStatusProps {
  lastSyncTime: Date | null;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  refreshError?: string | null;
}

/**
 * 상대 시간 포맷팅 (예: "2분 전", "방금 전")
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return '갱신 없음';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  // 7일 이상이면 절대 시간 표시
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 절대 시간 포맷팅 (예: "2025-01-15 14:30:25")
 */
function formatAbsoluteTime(date: Date | null): string {
  if (!date) return '갱신 없음';

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export const DataSyncStatus: React.FC<DataSyncStatusProps> = ({
  lastSyncTime,
  onRefresh,
  isRefreshing = false,
  refreshError = null
}) => {
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(lastSyncTime));
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const { showNotification } = useNotification();

  // 상대 시간 실시간 업데이트 (1초마다)
  useEffect(() => {
    if (!lastSyncTime) return;

    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastSyncTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // lastSyncTime 변경 시 상대 시간 업데이트
  useEffect(() => {
    setRelativeTime(formatRelativeTime(lastSyncTime));
  }, [lastSyncTime]);

  // 새로고침 버튼 클릭 핸들러
  const handleRefresh = async () => {
    if (!onRefresh) {
      console.warn('onRefresh 함수가 제공되지 않았습니다.');
      return;
    }

    setIsRefreshingLocal(true);
    setShowSuccess(false);

    try {
      await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // 3초 후 성공 메시지 숨김
      showNotification('데이터 갱신이 완료되었습니다.', 'success');
    } catch (error) {
      console.error('데이터 갱신 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showNotification(`데이터 갱신에 실패했습니다: ${errorMessage}`, 'error', 5000);
    } finally {
      setIsRefreshingLocal(false);
    }
  };

  const isRefreshingState = isRefreshing || isRefreshingLocal;

  return (
    <div className="data-sync-container">
      <div className="data-sync-status">
        <span className="sync-text" title={formatAbsoluteTime(lastSyncTime)}>
          {relativeTime}
        </span>
      </div>
      <button
        className={`sync-refresh-btn ${isRefreshingState ? 'refreshing' : ''} ${showSuccess ? 'success' : ''}`}
        onClick={handleRefresh}
        disabled={isRefreshingState}
        title="전체 데이터 새로고침"
      >
        <FaSync className={`refresh-icon ${isRefreshingState ? 'spinning' : ''}`} />
        {showSuccess && <FaCheckCircle className="success-icon" />}
        {refreshError && <FaExclamationCircle className="error-icon" />}
      </button>
    </div>
  );
};

export default DataSyncStatus;

