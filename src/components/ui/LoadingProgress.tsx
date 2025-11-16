/**
 * @file LoadingProgress.tsx
 * @brief 초기 데이터 로딩 진행률 표시 컴포넌트
 * @details 전체 화면 오버레이와 진행률 바를 표시합니다.
 */

import React from 'react';
import './LoadingProgress.css';

interface LoadingProgressProps {
  isVisible: boolean;
  progress: {
    current: number;
    total: number;
    message?: string;
  };
  onCancel?: () => void;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  isVisible,
  progress,
  onCancel
}) => {
  if (!isVisible) return null;

  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="loading-progress-overlay">
      <div className="loading-progress-container">
        <div className="loading-progress-header">
          <h3>데이터 로딩 중...</h3>
          {onCancel && (
            <button 
              className="loading-progress-cancel"
              onClick={onCancel}
              title="취소"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="loading-progress-bar-container">
          <div className="loading-progress-bar">
            <div 
              className="loading-progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="loading-progress-text">
            {progress.current} / {progress.total} ({percentage}%)
          </div>
        </div>

        {progress.message && (
          <div className="loading-progress-message">
            {progress.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;

