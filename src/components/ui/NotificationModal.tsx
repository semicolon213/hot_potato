import React, { useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './NotificationModal.css';

// React 19 호환성을 위한 타입 단언
const CheckCircleIcon = FaCheckCircle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const TimesCircleIcon = FaTimesCircle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ExclamationTriangleIcon = FaExclamationTriangle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const InfoCircleIcon = FaInfoCircle as React.ComponentType<React.SVGProps<SVGSVGElement>>;
const TimesIcon = FaTimes as React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NotificationModalProps {
  isOpen: boolean;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
  duration?: number; // 자동 닫기 시간 (ms), 0이면 자동 닫기 안 함
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  message,
  type = 'info',
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div 
        className={`notification-modal notification-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-icon">
          {type === 'success' && <CheckCircleIcon />}
          {type === 'error' && <TimesCircleIcon />}
          {type === 'warning' && <ExclamationTriangleIcon />}
          {type === 'info' && <InfoCircleIcon />}
        </div>
        <div className="notification-message">{message}</div>
        <button className="notification-close" onClick={onClose}>
          <TimesIcon />
        </button>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  onCancelAction?: () => void; // 취소 버튼 클릭 시 실행할 추가 액션
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  title,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'info',
  onCancelAction
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = async () => {
    if (onCancelAction) {
      await onCancelAction();
    }
    onCancel();
  };

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div 
        className={`confirm-modal confirm-${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="confirm-modal-title">{title}</div>}
        <div className="confirm-modal-message">{message}</div>
        <div className="confirm-modal-buttons">
          <button 
            className={`confirm-button confirm-primary ${type === 'danger' ? 'danger-button' : 'primary-button'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
          <button 
            className="confirm-button cancel-button" 
            onClick={handleCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

