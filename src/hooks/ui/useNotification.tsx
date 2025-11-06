import { useState, useCallback } from 'react';

interface NotificationState {
  isOpen: boolean;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancelAction?: () => void;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    message: '',
    type: 'info',
    duration: 3000
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showNotification = useCallback((
    message: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
    duration: number = 3000
  ) => {
    setNotification({
      isOpen: true,
      message,
      type,
      duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
      onCancel?: () => void;
    }
  ) => {
    setConfirm({
      isOpen: true,
      message,
      onConfirm,
      title: options?.title,
      confirmText: options?.confirmText || '확인',
      cancelText: options?.cancelText || '취소',
      type: options?.type || 'info',
      onCancelAction: options?.onCancel
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirm.onConfirm) {
      confirm.onConfirm();
    }
    hideConfirm();
  }, [confirm, hideConfirm]);

  return {
    notification,
    confirm,
    showNotification,
    hideNotification,
    showConfirm,
    hideConfirm,
    handleConfirm
  };
};

