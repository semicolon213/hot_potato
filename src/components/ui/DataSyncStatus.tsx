/**
 * @file DataSyncStatus.tsx
 * @brief 데이터 동기화 상태 표시 컴포넌트
 * @details 마지막 갱신 시간과 수동 새로고침 버튼을 제공합니다.
 */

import React, { useState, useEffect } from 'react';
import { FaSync, FaCheckCircle, FaExclamationCircle, FaPause, FaPlay } from 'react-icons/fa';
import { useNotification } from '../../hooks/ui/useNotification';
import { getDataSyncService } from '../../services/dataSyncService';
import './DataSyncStatus.css';

// React 19 호환성을 위한 타입 단언
const SyncIcon = FaSync as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const CheckCircleIcon = FaCheckCircle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ExclamationCircleIcon = FaExclamationCircle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const PauseIcon = FaPause as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const PlayIcon = FaPlay as React.ComponentType<React.SVGProps<SVGSVGElement>>;

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
  const [isSyncPaused, setIsSyncPaused] = useState(false);
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
      
      // 429 에러인 경우 특별한 안내 메시지
      if (errorMessage.includes('429') || errorMessage.includes('호출 제한')) {
        const waitTimeMatch = errorMessage.match(/(\d+)분/);
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : '60';
        showNotification(
          `API 호출 제한에 도달했습니다. ${waitTime}분 후 자동으로 재시도됩니다.`,
          'warning',
          8000
        );
      } else {
        showNotification(`데이터 갱신에 실패했습니다: ${errorMessage}`, 'error', 5000);
      }
    } finally {
      setIsRefreshingLocal(false);
    }
  };

  // 동기화 일시 중지/재개 핸들러
  const handleToggleSync = () => {
    const syncService = getDataSyncService();
    if (isSyncPaused) {
      syncService.startPeriodicSync();
      setIsSyncPaused(false);
      showNotification('자동 동기화가 재개되었습니다.', 'success');
    } else {
      syncService.stopPeriodicSync();
      setIsSyncPaused(true);
      showNotification('자동 동기화가 일시 중지되었습니다. 429 에러 방지를 위해 1시간 후 자동으로 재개됩니다.', 'warning', 8000);
      // 1시간 후 자동 재개
      setTimeout(() => {
        syncService.startPeriodicSync();
        setIsSyncPaused(false);
        showNotification('자동 동기화가 재개되었습니다.', 'success');
      }, 60 * 60 * 1000); // 1시간
    }
  };

  const isRefreshingState = isRefreshing || isRefreshingLocal;

  return (
    <div className="data-sync-container">
      <div className="data-sync-status">
        <span className="sync-text" title={formatAbsoluteTime(lastSyncTime)}>
          {relativeTime}
        </span>
        {isSyncPaused && (
          <span className="sync-paused-indicator" title="자동 동기화 일시 중지됨">
            (일시 중지)
          </span>
        )}
      </div>
      <button
        className={`sync-pause-btn ${isSyncPaused ? 'paused' : ''}`}
        onClick={handleToggleSync}
        title={isSyncPaused ? '자동 동기화 재개' : '자동 동기화 일시 중지 (429 에러 방지)'}
      >
        {isSyncPaused ? <PlayIcon /> : <PauseIcon />}
      </button>
      <button
        className={`sync-refresh-btn ${isRefreshingState ? 'refreshing' : ''} ${showSuccess ? 'success' : ''}`}
        onClick={handleRefresh}
        disabled={isRefreshingState}
        title="전체 데이터 새로고침"
      >
        <SyncIcon className={`refresh-icon ${isRefreshingState ? 'spinning' : ''}`} />
        {showSuccess && <CheckCircleIcon className="success-icon" />}
        {refreshError && <ExclamationCircleIcon className="error-icon" />}
      </button>
    </div>
  );
};

export default DataSyncStatus;

